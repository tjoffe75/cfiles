import pytest
from fastapi.testclient import TestClient
from config_endpoints import app

client = TestClient(app)

def test_upload_chunk():
    test_file_content = b"This is a test chunk"
    test_file_name = "testfile.txt"
    chunk_index = 0

    response = client.post(
        "/upload-chunk",
        files={"file": (test_file_name, test_file_content)},
        data={"chunkIndex": chunk_index, "fileName": test_file_name},
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Chunk uploaded successfully"
    assert response.json()["chunkIndex"] == chunk_index
