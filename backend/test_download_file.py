import pytest
from fastapi.testclient import TestClient
from config_endpoints import app

client = TestClient(app)

def test_download_file_clean():
    file_id = "testfile.txt"
    response = client.get(f"/download/{file_id}")

    if response.status_code == 200:
        assert response.headers["content-type"] == "application/octet-stream"
        assert "attachment" in response.headers["content-disposition"]
    elif response.status_code == 404:
        assert response.json()["detail"] == "File not found"
    else:
        assert response.json()["message"] == "File is quarantined due to virus detection"
