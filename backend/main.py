from fastapi import FastAPI
from config_endpoints import app as config_app
from database import models
from database.database import engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI()
app.mount("/config", config_app)

@app.get("/")
def root():
    return {"message": "Backend is running"}
