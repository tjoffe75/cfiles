import pytest
from fastapi.testclient import TestClient
from config_endpoints import app

client = TestClient(app)

# Test for fetching configurations
def test_get_config():
    response = client.get("/config")
    assert response.status_code == 200
    assert "maintenance" in response.json()
    assert "maintenance_mode" in response.json()["maintenance"]

# Test for updating configurations
def test_update_config():
    response = client.put("/config/maintenance", json={
        "maintenance_mode": True,
        "maintenance_message": "Updated maintenance message."
    })
    assert response.status_code == 200
    assert response.json()["message"] == "Configuration updated successfully"
    assert response.json()["key"] == "maintenance"
    assert response.json()["value"]["maintenance_mode"] is True
    assert response.json()["value"]["maintenance_message"] == "Updated maintenance message."

# Test for uploading logo
def test_upload_logo():
    response = client.post("/config/logo", json={"logo": "new_logo.png"})
    assert response.status_code == 200
    assert response.json()["message"] == "Logo uploaded successfully"

# Test for fetching quarantined files
def test_get_quarantined_files():
    response = client.get("/quarantine")
    assert response.status_code == 200
    assert "quarantined_files" in response.json()

# Test for updating quarantine status
def test_update_quarantine_status():
    response = client.put("/quarantine/file123", json={"action": "release"})
    assert response.status_code == 200
    assert response.json()["message"] == "File file123 released successfully"

# Test for fetching logs
def test_get_logs():
    response = client.get("/logs")
    assert response.status_code == 200
    assert "logs" in response.json()

# Test for fetching maintenance status
def test_get_maintenance_status():
    response = client.get("/maintenance")
    assert response.status_code == 200
    assert "maintenance_mode" in response.json()
    assert "maintenance_message" in response.json()

# Test for updating maintenance status
def test_update_maintenance_status():
    response = client.put("/maintenance", json={"maintenance_mode": True, "maintenance_message": "Underhåll pågår"})
    assert response.status_code == 200
    assert response.json()["message"] == "Maintenance status updated successfully"

# Test for fetching SSO configuration
def test_get_sso_config():
    response = client.get("/sso")
    assert response.status_code == 200
    assert "rbac_sso_enabled" in response.json()
    assert "sso_config" in response.json()

# Test for updating SSO configuration
def test_update_sso_config():
    response = client.put("/sso", json={"rbac_sso_enabled": True, "sso_config": {"ad_endpoint": "https://example.com", "client_id": "123", "client_secret": "secret"}})
    assert response.status_code == 200
    assert response.json()["message"] == "SSO configuration updated successfully"

# Test for fetching HTTPS configuration
def test_get_https_config():
    response = client.get("/https")
    assert response.status_code == 200
    assert "https_enabled" in response.json()
    assert "https_cert" in response.json()

# Test for updating HTTPS configuration
def test_update_https_config():
    response = client.put("/https", json={"https_enabled": True, "https_cert": "cert_data"})
    assert response.status_code == 200
    assert response.json()["message"] == "HTTPS configuration updated successfully"

# Test for listing quarantined files
def test_list_quarantined_files():
    response = client.get("/quarantine/files")
    assert response.status_code == 200
    assert "quarantined_files" in response.json()

# Test for deleting a quarantined file
def test_delete_quarantined_file():
    response = client.delete("/quarantine/files/file1")
    assert response.status_code == 200
    assert response.json()["message"] == "Quarantined file file1 deleted successfully"

# Test for fetching real-time logs
def test_get_realtime_logs():
    response = client.get("/logs/realtime")
    assert response.status_code == 200
    assert "logs" in response.json()

# Test for toggling maintenance mode
def test_toggle_maintenance_mode():
    response = client.put("/config/maintenance", json={
        "maintenance_mode": True,
        "maintenance_message": "Scheduled maintenance ongoing."
    })
    assert response.status_code == 200
    assert response.json()["message"] == "Configuration updated successfully"
    assert response.json()["key"] == "maintenance"
    assert response.json()["value"]["maintenance_mode"] is True
    assert response.json()["value"]["maintenance_message"] == "Scheduled maintenance ongoing."

# Test for configuring SSO/RBAC
def test_configure_sso_rbac():
    response = client.put("/config/sso", json={
        "rbac_sso_enabled": True,
        "sso_config": {
            "ad_endpoint": "https://ad.example.com",
            "client_id": "example-client-id",
            "client_secret": "example-client-secret",
            "user_group": "AD_USERS_GROUP",
            "admin_group": "AD_ADMIN_GROUP"
        }
    })
    assert response.status_code == 200
    assert response.json()["message"] == "Configuration updated successfully"
    assert response.json()["key"] == "sso"
    assert response.json()["value"]["rbac_sso_enabled"] is True
    assert "ad_endpoint" in response.json()["value"]["sso_config"]
