import pika
import os
import clamd
import logging
import time
import json
import shutil
import hashlib
from sqlalchemy.orm import Session
from database.database import SessionLocal
from database.models import File, ScanStatus, SystemSetting

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

QUARANTINE_DIR = "/quarantine"

# Skapa nödvändiga mappar automatiskt
for folder in ["uploads", "quarantine", "testfiles"]:
    os.makedirs(folder, exist_ok=True)

def calculate_checksum(file_path):
    """Calculates the SHA256 checksum of a file."""
    sha256_hash = hashlib.sha256()
    try:
        with open(file_path, "rb") as f:
            # Read and update hash string value in blocks of 4K
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    except IOError as e:
        logging.error(f"Error reading file for checksum: {e}")
        return None

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

def update_scan_status(db: Session, file_id: int, status: ScanStatus, details: str = None, checksum: str = None):
    """Updates the scan status and checksum of a file in the database."""
    try:
        db_file = db.query(File).filter(File.id == file_id).first()
        if db_file:
            db_file.scan_status = status
            if details is not None:
                db_file.scan_details = details
            if checksum is not None:
                db_file.checksum = checksum
            db.commit()
            logging.info(f"Updated file {file_id} status to {status.value}, details: {details}, checksum: {'yes' if checksum else 'no'}")
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


def is_maintenance_mode_active(db: Session) -> bool:
    """Checks if maintenance mode is active."""
    try:
        setting = db.query(SystemSetting).filter(SystemSetting.key == "maintenance_mode").first()
        # The value is stored as a boolean.
        return setting and setting.value is True
    except Exception as e:
        logging.error(f"Could not check maintenance mode status: {e}")
        # Fail-safe: if we can't check, assume it's not active to not halt processing.
        return False

def connect_to_rabbitmq():
    """Establishes a connection to RabbitMQ with retries."""
    rabbitmq_user = os.getenv("RABBITMQ_DEFAULT_USER", "guest")
    rabbitmq_password = os.getenv("RABBITMQ_DEFAULT_PASS", "guest")
    
    if not rabbitmq_user or not rabbitmq_password:
        logging.error("RabbitMQ user or password not set. Please check environment variables.")
        return None

    credentials = pika.PlainCredentials(rabbitmq_user, rabbitmq_password)
    
    max_retries = 5
    retry_delay = 5
    for attempt in range(max_retries):
        try:
            connection = pika.BlockingConnection(pika.ConnectionParameters(host='rabbitmq', port=5672, heartbeat=600, blocked_connection_timeout=300, credentials=credentials))
            logging.info("Successfully connected to RabbitMQ")
            return connection
        except pika.exceptions.AMQPConnectionError as e:
            logging.warning(f"Failed to connect to RabbitMQ: {e}. Retrying in {retry_delay} seconds...")
            time.sleep(retry_delay)
    logging.error("Could not connect to RabbitMQ after several retries.")
    return None

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def publish_status_update(channel: pika.channel.Channel, file_id: int, status: str, details: str = None, checksum: str = None, new_path: str = None):
    """Publishes a status update to RabbitMQ using an existing channel."""
    try:
        message = {'file_id': file_id, 'status': status, 'details': details, 'checksum': checksum}
        if new_path:
            message['filepath'] = new_path
        channel.basic_publish(
            exchange='',
            routing_key='status_updates',
            body=json.dumps(message),
            properties=pika.BasicProperties(
                delivery_mode=2,  # make message persistent
            ))
        logging.info(f"Published status update for file {file_id}: {status}")
    except Exception as e:
        logging.error(f"Failed to publish status update for file {file_id}: {e}")


def main():
    logging.info("Worker started")

    connection = connect_to_rabbitmq()
    if not connection:
        return

    clamd_socket = connect_clamav()

    try:
        channel = connection.channel()
        channel.queue_declare(queue='file_queue', durable=True)
        # Also declare the queue we will be publishing to
        channel.queue_declare(queue='status_updates', durable=True)

        def callback(ch, method, properties, body):
            nonlocal clamd_socket
            db = SessionLocal()
            try:
                # Pass the channel 'ch' to process_message for publishing
                # Pass clamd_socket as a mutable list to allow modification on reconnect
                new_socket = process_message(db, body, [clamd_socket], ch)
                if new_socket is not None:
                    clamd_socket = new_socket
                ch.basic_ack(delivery_tag=method.delivery_tag)
            except MessageProcessingError as e:
                logging.error(f"Message processing failed: {e}. Requeuing message.")
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
            except Exception as e:
                logging.error(f"An unhandled error occurred during message processing: {e}", exc_info=True)
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False) # Don't requeue on unknown errors
            finally:
                db.close()

        channel.basic_qos(prefetch_count=1)
        channel.basic_consume(queue='file_queue', on_message_callback=callback, auto_ack=False)
        logging.info("Waiting for messages...")
        channel.start_consuming()

    except Exception as e:
        logging.error(f"An unexpected error occurred in the main loop: {e}")
    finally:
        if connection and not connection.is_closed:
            connection.close()
            logging.info("RabbitMQ connection closed.")

class MessageProcessingError(Exception):
    """Custom exception for message processing errors."""
    pass

def process_message(db: Session, body: bytes, clamd_socket_wrapper: list, channel: pika.channel.Channel):
    """Processes a single message from the queue."""
    clamd_socket = clamd_socket_wrapper[0]
    file_id = None
    checksum = None # Initialize checksum
    try:
        if is_maintenance_mode_active(db):
            logging.info("Maintenance mode is active. Re-queuing message.")
            raise MessageProcessingError("Maintenance mode is active")

        message_data = json.loads(body.decode())
        file_path = message_data.get('file_path')
        file_id = message_data.get('file_id')

        if not file_path or not file_id:
            logging.error("Message missing file_path or file_id")
            raise MessageProcessingError("Missing file_path or file_id")

        logging.info(f"Received file: {file_path} with ID: {file_id}")

        # Immediately publish 'pending' status
        publish_status_update(channel, file_id, ScanStatus.PENDING.value, "Awaiting scan...")

        if not os.path.exists(file_path):
            logging.warning(f"File does not exist: {file_path}")
            update_scan_status(db, file_id, ScanStatus.ERROR, "File not found at worker")
            publish_status_update(channel, file_id, ScanStatus.ERROR.value, "File not found at worker")
            return

        checksum = calculate_checksum(file_path)
        if not checksum:
            logging.warning(f"Could not calculate checksum for file {file_id}, continuing without it.")

        update_scan_status(db, file_id, ScanStatus.SCANNING, checksum=checksum)
        publish_status_update(channel, file_id, ScanStatus.SCANNING.value, checksum=checksum)

        if not clamd_socket:
            logging.error("No ClamAV connection, cannot scan.")
            update_scan_status(db, file_id, ScanStatus.ERROR, "Could not connect to ClamAV")
            publish_status_update(channel, file_id, ScanStatus.ERROR.value, "Could not connect to ClamAV")
            raise MessageProcessingError("No ClamAV connection")

        try:
            logging.info(f"Scanning file: {file_path}")
            result = clamd_socket.scan(file_path)
            logging.info(f"Scan result for file {file_id}: {result}")

            if result:
                status, details = result[file_path]
                if status == 'FOUND':
                    logging.info(f"File {file_id} is INFECTED. Moving to quarantine.")
                    new_filepath = quarantine_file(db, file_id, file_path)
                    update_scan_status(db, file_id, ScanStatus.INFECTED, details, checksum=checksum)
                    publish_status_update(channel, file_id, ScanStatus.INFECTED.value, details, checksum, new_path=new_filepath)
                else:  # OK
                    update_scan_status(db, file_id, ScanStatus.CLEAN, "File is clean", checksum=checksum)
                    publish_status_update(channel, file_id, ScanStatus.CLEAN.value, "File is clean", checksum)
            else:
                update_scan_status(db, file_id, ScanStatus.ERROR, "Scan failed or returned no result", checksum=checksum)
                publish_status_update(channel, file_id, ScanStatus.ERROR.value, "Scan failed or returned no result", checksum)

        except clamd.ConnectionError as e:
            logging.error(f"ClamAV connection lost: {e}. Reconnecting...")
            new_clamd_socket = connect_clamav() # Try to reconnect
            if new_clamd_socket:
                clamd_socket_wrapper[0] = new_clamd_socket # Update the socket in the wrapper
                logging.info("Successfully reconnected to ClamAV.")
            else:
                logging.error("Failed to reconnect to ClamAV.")

            update_scan_status(db, file_id, ScanStatus.ERROR, f"ClamAV connection error: {e}")
            publish_status_update(channel, file_id, ScanStatus.ERROR.value, f"ClamAV connection error: {e}", checksum)
            raise MessageProcessingError("ClamAV connection error")
        except Exception as e:
            logging.error(f"Error scanning file {file_path}: {e}")
            update_scan_status(db, file_id, ScanStatus.ERROR, str(e))
            publish_status_update(channel, file_id, ScanStatus.ERROR.value, str(e), checksum)

    except json.JSONDecodeError:
        logging.error(f"Error decoding message body: {body}")
        # Do not requeue if message is malformed
    except MessageProcessingError:
        raise # Re-raise to be handled by the callback for requeuing
    except Exception as e:
        logging.error(f"Unhandled error in process_message: {e}", exc_info=True)
        if file_id:
            try:
                update_scan_status(db, file_id, ScanStatus.ERROR, f"Unhandled worker error: {e}")
                publish_status_update(channel, file_id, ScanStatus.ERROR.value, f"Unhandled worker error: {e}", checksum)
            except Exception as db_e:
                logging.error(f"Could not update DB to ERROR status after unhandled exception: {db_e}")
        # Do not requeue for unknown errors to avoid poison pills
    return clamd_socket_wrapper[0] if clamd_socket_wrapper else None

if __name__ == "__main__":
    main()
