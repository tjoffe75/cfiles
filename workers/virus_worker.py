import os
import subprocess
import pika
import json

# RabbitMQ connection
connection = pika.BlockingConnection(pika.ConnectionParameters(host='localhost'))
channel = connection.channel()
channel.queue_declare(queue='virus_scan')

def scan_file(file_path):
    try:
        result = subprocess.run(['clamscan', file_path], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        output = result.stdout.decode()
        if 'FOUND' in output:
            return {'status': 'infected', 'details': output}
        return {'status': 'clean', 'details': output}
    except Exception as e:
        return {'status': 'error', 'details': str(e)}

def callback(ch, method, properties, body):
    message = json.loads(body)
    file_path = message['file_path']
    scan_result = scan_file(file_path)
    print(f"Scan result for {file_path}: {scan_result}")
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_consume(queue='virus_scan', on_message_callback=callback)
print('Waiting for messages. To exit press CTRL+C')
channel.start_consuming()
