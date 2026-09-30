from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import engine, Base, SessionLocal
import models
import schemas

Base.metadata.create_all(bind=engine)

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def home():
    return {"mensagem": "Tracker API rodando"}

@app.get("/transacoes", response_model=list[schemas.Transacao])
def listar_transacoes(db: Session = Depends(get_db)):
    return db.query(models.Transacao).all()

@app.post("/transacoes", response_model=schemas.Transacao)
def criar_transacao(transacao: schemas.TransacaoCreate, db: Session = Depends(get_db)):
    nova = models.Transacao(**transacao.model_dump())
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return nova

@app.delete("/transacoes/{transacao_id}")
def deletar_transacao(transacao_id: int, db: Session = Depends(get_db)):
    transacao = db.query(models.Transacao).filter(models.Transacao.id == transacao_id).first()
    if not transacao:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    db.delete(transacao)
    db.commit()
    return {"mensagem": "Transação deletada"}