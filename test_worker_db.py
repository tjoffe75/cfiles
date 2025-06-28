import os
import sys
import time
import uuid
from celery import Celery

# Correctly import database modules available in the backend container
from database.database import SessionLocal
import database.models as backend_models

# Get RabbitMQ connection details from environment variables
# Default to localhost for local testing, but Docker will use the linked service name
RABBITMQ_USER = os.getenv("RABBITMQ_USER", "user")
RABBITMQ_PASSWORD = os.getenv("RABBITMQ_PASSWORD", "password")
RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "rabbitmq")
RABBITMQ_PORT = os.getenv("RABBITMQ_PORT", "5672")

# Create a Celery app instance to send tasks to the worker
celery_app = Celery(
    "test_sender",
    broker=f"amqp://{RABBITMQ_USER}:{RABBITMQ_PASSWORD}@{RABBITMQ_HOST}:{RABBITMQ_PORT}//"
)


def run_worker_test():
    """
    Tests the worker's database connection by creating a file record,
    triggering the scan_file task via the broker, and verifying the status update.
    """
    db = SessionLocal()
    test_file = None
    exit_code = 1  # Default to failure

    try:
        # 1. Create a dummy file record for the worker to process
        print("--> Creating a dummy file record...")
        # Correctly instantiate the File model based on models.py
        test_file = backend_models.File(
            filename="test_worker_file.txt",
            filepath=f"/tmp/fake_path/{uuid.uuid4()}.txt", # Ensure unique path
            status=backend_models.ScanStatus.PENDING # Use the enum member
        )
        db.add(test_file)
        db.commit()
        db.refresh(test_file)
        print(f"    Dummy file created with ID: {test_file.id}")

        # 2. Trigger the worker task by sending a message to the broker
        task_name = "workers.worker.scan_file"
        print(f"--> Sending task '{task_name}' for file ID: {test_file.id}")
        task = celery_app.send_task(task_name, args=[test_file.id])
        print(f"    Task '{task.id}' sent to the worker.")

        # 3. Wait for the worker to process and verify the result
        print("--> Waiting for 10 seconds for the worker to process...")
        time.sleep(10)

        db.refresh(test_file)
        print(f"--> Checking file status in database...")
        print(f"    Current file status: '{test_file.status}'")

        if test_file.status == backend_models.ScanStatus.CLEAN:
            print("✅ SUCCESS: Worker database connection confirmed.")
            exit_code = 0
        else:
            print(f"❌ FAILURE: Worker did not update the file status correctly. Final status: '{test_file.status}'")

    except Exception as e:
        print(f"An error occurred during the test: {e}")

    finally:
        # 4. Clean up the dummy record
        if test_file:
            print("--> Cleaning up dummy file record...")
            db.delete(test_file)
            db.commit()
            print("    Cleanup successful.")
        db.close()
        # Use assert for pytest
        assert exit_code == 0, "Test failed with non-zero exit code."


if __name__ == "__main__":
    # Give services a moment to be ready
    time.sleep(5)
    sys.exit(run_worker_test())
