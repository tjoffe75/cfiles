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
def upload_logo(logo: str):
    configurations["company_logo"] = logo
    return {"message": "Logo uploaded successfully", "logo": logo}
