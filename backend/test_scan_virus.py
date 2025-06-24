import pytest
from fastapi.testclient import TestClient
from config_endpoints import app

client = TestClient(app)

def test_scan_virus():
    test_file_path = "uploads/testfile.txt"

    response = client.post("/scan-virus", json={"file_path": test_file_path})

    assert response.status_code == 200
    assert response.json()["message"] == "File sent for virus scanning"
    assert response.json()["file_path"] == test_file_path
