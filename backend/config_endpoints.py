from fastapi import FastAPI, HTTPException

app = FastAPI()

# In-memory configuration storage for demonstration purposes
configurations = {
    "maintenance_mode": False,
    "maintenance_message": "",
    "rbac_sso_enabled": False,
    "sso_config": {},
    "https_enabled": False,
    "https_cert": "",
    "company_logo": ""
}

@app.get("/config")
def get_config():
    return configurations

@app.put("/config/{key}")
def update_config(key: str, value: dict):
    if key not in configurations:
        raise HTTPException(status_code=404, detail="Configuration key not found")
    configurations[key] = value
    return {"message": "Configuration updated successfully", "key": key, "value": value}

@app.post("/config/logo")
def upload_logo(logo: dict):
    if "logo" not in logo:
        raise HTTPException(status_code=422, detail="Missing 'logo' key in request body")
    configurations["company_logo"] = logo["logo"]
    return {"message": "Logo uploaded successfully", "logo": logo["logo"]}

@app.get("/quarantine")
def get_quarantined_files():
    # Placeholder for fetching quarantined files
    return {"quarantined_files": []}

@app.put("/quarantine/{file_id}")
def update_quarantine_status(file_id: str, action: dict):
    if "action" not in action or action["action"] not in ["release", "delete"]:
        raise HTTPException(status_code=422, detail="Invalid or missing 'action' key in request body")
    return {"message": f"File {file_id} {action['action']}d successfully"}

@app.get("/logs")
def get_logs():
    # Placeholder for fetching logs
    return {"logs": ["Log entry 1", "Log entry 2"]}

@app.get("/maintenance")
def get_maintenance_status():
    return {
        "maintenance_mode": configurations["maintenance_mode"],
        "maintenance_message": configurations["maintenance_message"]
    }

@app.put("/maintenance")
def update_maintenance_status(status: dict):
    if "maintenance_mode" not in status or "maintenance_message" not in status:
        raise HTTPException(status_code=422, detail="Missing keys in request body")
    configurations["maintenance_mode"] = status["maintenance_mode"]
    configurations["maintenance_message"] = status["maintenance_message"]
    return {"message": "Maintenance status updated successfully"}

@app.get("/sso")
def get_sso_config():
    return {
        "rbac_sso_enabled": configurations["rbac_sso_enabled"],
        "sso_config": configurations["sso_config"]
    }

@app.put("/sso")
def update_sso_config(config: dict):
    if "rbac_sso_enabled" not in config or "sso_config" not in config:
        raise HTTPException(status_code=422, detail="Missing keys in request body")
    configurations["rbac_sso_enabled"] = config["rbac_sso_enabled"]
    configurations["sso_config"] = config["sso_config"]
    return {"message": "SSO configuration updated successfully"}

@app.get("/https")
def get_https_config():
    return {
        "https_enabled": configurations["https_enabled"],
        "https_cert": configurations["https_cert"]
    }

@app.put("/https")
def update_https_config(config: dict):
    if "https_enabled" not in config or "https_cert" not in config:
        raise HTTPException(status_code=422, detail="Missing keys in request body")
    configurations["https_enabled"] = config["https_enabled"]
    configurations["https_cert"] = config["https_cert"]
    return {"message": "HTTPS configuration updated successfully"}

@app.get("/quarantine/files")
def list_quarantined_files():
    # Placeholder for fetching quarantined files
    return {"quarantined_files": ["file1", "file2"]}

@app.delete("/quarantine/files/{file_id}")
def delete_quarantined_file(file_id: str):
    # Placeholder for deleting a quarantined file
    return {"message": f"Quarantined file {file_id} deleted successfully"}

@app.get("/logs/realtime")
def get_realtime_logs():
    # Placeholder for fetching real-time logs
    return {"logs": ["Log entry 1", "Log entry 2"]}
