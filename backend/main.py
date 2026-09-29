from fastapi import FastAPI
from database import engine, Base
import models

Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.get("/")
def home():
    return {"mensagem": "Tracker API rodando"}