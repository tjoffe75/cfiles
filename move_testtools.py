import os
import shutil

# Move test files to new testtools structure
files_to_move = [
    ("test_db_connection.py", "testtools/db/test_db_connection.py"),
    ("test_worker_db.py", "testtools/db/test_worker_db.py"),
    ("test_upload.py", "testtools/upload/test_upload.py"),
    ("test_upload.txt", "testtools/upload/test_upload.txt"),
    ("test_upload_2.txt", "testtools/upload/test_upload_2.txt"),
    ("test_download.py", "testtools/misc/test_download.py"),
    ("test.txt", "testtools/misc/test.txt")
]

for src, dst in files_to_move:
    if os.path.exists(src):
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.move(src, dst)
        print(f"Moved {src} -> {dst}")
    else:
        print(f"File not found: {src}")
