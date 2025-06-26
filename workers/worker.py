import pika
import os
import clamd
import logging
import time
import json

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def scan_file(file_path):
    """Scans a file using ClamAV with connection retries."""
    max_retries = 5
    retry_delay = 5
    for attempt in range(max_retries):
        try:
            cd = clamd.ClamdNetworkSocket(host='clamav', port=3310)
            # Ping to check connection
            cd.ping()
            logging.info(f"Successfully connected to ClamAV on attempt {attempt + 1}")
            logging.info(f"Scanning file: {file_path}")
            result = cd.scan(file_path)
            if result is None:
                logging.warning("No result from ClamAV scan.")
            return result
        except clamd.ConnectionError as e:
            logging.warning(f"ClamAV connection error on attempt {attempt + 1}/{max_retries}: {e}. Retrying in {retry_delay} seconds...")
            time.sleep(retry_delay)
        except Exception as e:
            logging.error(f"An unexpected error occurred during scanning: {e}")
            return None
    logging.error("Could not connect to ClamAV after several retries.")
    return None

def connect_to_rabbitmq():
    """Establishes a connection to RabbitMQ with retries."""
    max_retries = 5
    retry_delay = 5
    for attempt in range(max_retries):
        try:
            connection = pika.BlockingConnection(pika.ConnectionParameters(host='rabbitmq', port=5672))
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
        return # Exit if no connection could be made

    try:
        channel = connection.channel()
        channel.queue_declare(queue='file_queue', durable=True)

        def callback(ch, method, properties, body):
            try:
                message_data = json.loads(body.decode())
                file_path = message_data['file_path']
                logging.info(f"Received file path: {file_path}")

                if not os.path.exists(file_path):
                    logging.warning(f"File does not exist: {file_path}")
                    ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
                    return

                scan_result = scan_file(file_path)
                logging.info(f"Scan result: {scan_result}")
                ch.basic_ack(delivery_tag=method.delivery_tag)
            except Exception as e:
                logging.error(f"Error processing message: {e}")
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

        channel.basic_consume(queue='file_queue', on_message_callback=callback, auto_ack=False)
        logging.info("Waiting for messages...")
        channel.start_consuming()
    except Exception as e:
        logging.error(f"An unexpected error occurred in the main loop: {e}")
    finally:
        if connection and not connection.is_closed:
            connection.close()
            logging.info("RabbitMQ connection closed.")

if __name__ == "__main__":
    main()
