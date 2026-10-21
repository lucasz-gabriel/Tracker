from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import engine, Base, SessionLocal
import models
import schemas

Base.metadata.create_all(bind=engine)

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

#Área das transações de entrada e saída
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

#Área das categorias
@app.get("/categorias", response_model=list[schemas.Categoria])
def listar_categorias(db: Session = Depends(get_db)):
    return db.query(models.Categoria).all()

@app.post("/categorias", response_model=schemas.Categoria)
def criar_categoria(categoria: schemas.CategoriaCreate, db: Session = Depends(get_db)):
    nova = models.Categoria(**categoria.model_dump())
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return nova

@app.delete("/categorias/{categoria_id}")
def deletar_categoria(categoria_id: int, db: Session = Depends(get_db)):
    categoria = db.query(models.Categoria).filter(models.Categoria.id == categoria_id).first()
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    db.delete(categoria)
    db.commit()
    return {"mensagem": "Categoria deletada"}

#Área das Assinaturas
@app.get("/assinaturas", response_model=list[schemas.Assinatura])
def listar_assinaturas(db: Session = Depends(get_db)):
    return db.query(models.Assinatura).all()

@app.post("/assinaturas", response_model=schemas.Assinatura)
def criar_assinatura(assinatura: schemas.AssinaturaCreate, db: Session = Depends(get_db)):
    nova = models.Assinatura(**assinatura.model_dump())
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return nova

@app.delete("/assinaturas/{assinatura_id}")
def deletar_assinatura(assinatura_id: int, db: Session = Depends(get_db)):
    assinatura = db.query(models.Assinatura).filter(models.Assinatura.id == assinatura_id).first()
    if not assinatura:
        raise HTTPException(status_code=404, detail="Assinatura não encontrada")
    db.delete(assinatura)
    db.commit()
    return {"mensagem": "Assinatura deletada"}
