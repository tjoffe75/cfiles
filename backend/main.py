from fastapi import FastAPI
from config_endpoints import app as config_app

app = FastAPI()
app.mount("/config", config_app)
