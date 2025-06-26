import pika
import os
import clamd
import logging
import time
import json
import shutil
from sqlalchemy.orm import Session
from database.database import SessionLocal
from database.models import File, ScanStatus

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

QUARANTINE_DIR = "/quarantine"

def connect_clamav():
    """Connects to ClamAV with retries."""
    max_retries = 5
    retry_delay = 5
    for attempt in range(max_retries):
        try:
            cd = clamd.ClamdNetworkSocket(host='clamav', port=3310)
            cd.ping()
            logging.info(f"Successfully connected to ClamAV on attempt {attempt + 1}")
            return cd
        except clamd.ConnectionError as e:
            logging.warning(f"ClamAV connection error on attempt {attempt + 1}/{max_retries}: {e}. Retrying in {retry_delay} seconds...")
            time.sleep(retry_delay)
    logging.error("Could not connect to ClamAV after several retries.")
    return None

def update_scan_status(db: Session, file_id: int, status: ScanStatus, details: str = None):
    """Updates the scan status of a file in the database."""
    try:
        db_file = db.query(File).filter(File.id == file_id).first()
        if db_file:
            db_file.status = status
            db_file.details = details
            db.commit()
            logging.info(f"Updated file {file_id} status to {status} with details: {details}")
        else:
            logging.warning(f"File with id {file_id} not found in database.")
    except Exception as e:
        logging.error(f"Failed to update database for file {file_id}: {e}")
        db.rollback()

def quarantine_file(db: Session, file_id: int, file_path: str):
    """Moves a file to the quarantine directory and updates its path in the database."""
    if not os.path.exists(file_path):
        logging.error(f"Cannot quarantine file: {file_path} does not exist.")
        return None

    filename = os.path.basename(file_path)
    new_path = os.path.join(QUARANTINE_DIR, filename)

    # Handle filename conflicts in quarantine
    counter = 1
    while os.path.exists(new_path):
        name, extension = os.path.splitext(filename)
        new_filename = f"{name}_{counter}{extension}"
        new_path = os.path.join(QUARANTINE_DIR, new_filename)
        counter += 1

    try:
        # Ensure the quarantine directory exists inside the container
        os.makedirs(QUARANTINE_DIR, exist_ok=True)
        
        shutil.move(file_path, new_path)
        logging.info(f"Moved infected file {file_id} to quarantine at {new_path}")

        # Update the filepath in the database
        db_file = db.query(File).filter(File.id == file_id).first()
        if db_file:
            db_file.filepath = new_path
            db.commit()
            logging.info(f"Updated filepath for file {file_id} to {new_path}")
            return new_path
        else:
            logging.warning(f"Could not find file {file_id} to update its path after quarantine.")
            return None # Return None as the path could not be updated
            
    except Exception as e:
        logging.error(f"Failed to move file {file_id} to quarantine: {e}")
        db.rollback()
        return None


def connect_to_rabbitmq():
    """Establishes a connection to RabbitMQ with retries."""
    max_retries = 5
    retry_delay = 5
    for attempt in range(max_retries):
        try:
            connection = pika.BlockingConnection(pika.ConnectionParameters(host='rabbitmq', port=5672, heartbeat=600, blocked_connection_timeout=300))
            logging.info("Successfully connected to RabbitMQ")
            return connection
        except pika.exceptions.AMQPConnectionError as e:
            logging.warning(f"Failed to connect to RabbitMQ: {e}. Retrying in {retry_delay} seconds...")
            time.sleep(retry_delay)
    logging.error("Could not connect to RabbitMQ after several retries.")
    return None

def main():
    logging.info("Worker started")

    connection = connect_to_rabbitmq()
    if not connection:
        return

    db = SessionLocal()
    clamd_socket = connect_clamav()

    try:
        channel = connection.channel()
        channel.queue_declare(queue='file_queue', durable=True)

        def callback(ch, method, properties, body):
            nonlocal clamd_socket
            file_id = None
            try:
                message_data = json.loads(body.decode())
                file_path = message_data.get('file_path')
                file_id = message_data.get('file_id')

                if not file_path or not file_id:
                    logging.error("Message missing file_path or file_id")
                    ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
                    return

                logging.info(f"Received file: {file_path} with ID: {file_id}")

                if not os.path.exists(file_path):
                    logging.warning(f"File does not exist: {file_path}")
                    update_scan_status(db, file_id, ScanStatus.ERROR, "File not found at worker")
                    ch.basic_ack(delivery_tag=method.delivery_tag)
                    return

                update_scan_status(db, file_id, ScanStatus.SCANNING)

                if clamd_socket:
                    try:
                        logging.info(f"Scanning file: {file_path}")
                        result = clamd_socket.scan(file_path)
                        logging.info(f"Scan result for file {file_id}: {result}")

                        if result:
                            status, details = result[file_path]
                            if status == 'FOUND':
                                logging.info(f"File {file_id} is INFECTED. Moving to quarantine.")
                                quarantine_file(db, file_id, file_path)
                                update_scan_status(db, file_id, ScanStatus.INFECTED, details)
                            else: # OK
                                update_scan_status(db, file_id, ScanStatus.CLEAN)
                        else:
                            update_scan_status(db, file_id, ScanStatus.ERROR, "Scan failed or returned no result")

                    except clamd.ConnectionError as e:
                        logging.error(f"ClamAV connection lost: {e}. Reconnecting...")
                        clamd_socket = connect_clamav()
                        update_scan_status(db, file_id, ScanStatus.ERROR, f"ClamAV connection error: {e}")
                        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
                        return
                    except Exception as e:
                        logging.error(f"Error scanning file {file_path}: {e}")
                        update_scan_status(db, file_id, ScanStatus.ERROR, str(e))
                else:
                    logging.error("No ClamAV connection, cannot scan.")
                    update_scan_status(db, file_id, ScanStatus.ERROR, "Could not connect to ClamAV")
                    ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True) # Requeue hoping connection is restored
                    return

                ch.basic_ack(delivery_tag=method.delivery_tag)

            except json.JSONDecodeError:
                logging.error(f"Error decoding message body: {body}")
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
            except Exception as e:
                logging.error(f"Unhandled error in callback: {e}", exc_info=True)
                if file_id:
                    try:
                        update_scan_status(db, file_id, ScanStatus.ERROR, f"Unhandled worker error: {e}")
                    except Exception as db_e:
                        logging.error(f"Could not update DB to ERROR status after unhandled exception: {db_e}")
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


        channel.basic_qos(prefetch_count=1)
        channel.basic_consume(queue='file_queue', on_message_callback=callback, auto_ack=False)
        logging.info("Waiting for messages...")
        channel.start_consuming()

    except Exception as e:
        logging.error(f"An unexpected error occurred in the main loop: {e}")
    finally:
        if db:
            db.close()
        if connection and not connection.is_closed:
            connection.close()
            logging.info("RabbitMQ connection closed.")

if __name__ == "__main__":
    main()
