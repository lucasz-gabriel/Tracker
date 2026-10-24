from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import date
from database import engine, Base, SessionLocal
import models
import schemas
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler(timezone="America/Manaus")

def tarefa_gerar_cobrancas():
    db = SessionLocal()

    try:
        criadas = gerar_cobrancas_mensais(db)
        print(f"[Tracker] Cobranças mensais criadas: {criadas}")
    except Exception as erro:
        print(f"[Tracker] Erro ao gerar cobranças: {erro}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(
        tarefa_gerar_cobrancas,
        trigger="cron",
        hour=0,
        minute=5,
        id="gerar_cobrancas_mensais",
        replace_existing=True
    )

    scheduler.start()

    # Verifica também ao iniciar a API, para recuperar cobranças
    # do mês atual que ainda não tenham sido geradas.
    tarefa_gerar_cobrancas()

    try:
        yield
    finally:
        scheduler.shutdown()

app = FastAPI(lifespan=lifespan)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def gerar_cobrancas_mensais(db:Session):
    hoje=date.today()
    assinaturas_ativas=db.query(models.Assinatura).filter(
        models.Assinatura.ativa==True
    ).all()

    criadas=0

    try:
        for assinatura in assinaturas_ativas:
            existente=db.query(models.Cobranca).filter(
                models.Cobranca.assinatura_id==assinatura.id,
                models.Cobranca.ano==hoje.year,
                models.Cobranca.mes==hoje.month
            ).first()

            if existente:
                continue

            cobranca=models.Cobranca(
                assinatura_id=assinatura.id,
                ano=hoje.year,
                mes=hoje.month,
                valor_centavos=assinatura.valor_centavos,
                status="pendente",
                transacao_id=None
            )

            db.add(cobranca)
            criadas+=1

            db.commit()

    except Exception:
            db.rollback()
            raise

    return criadas



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
def deletar_assinatura(
    assinatura_id: int,
    db: Session = Depends(get_db)
):
    assinatura = db.query(models.Assinatura).filter(
        models.Assinatura.id == assinatura_id
    ).first()

    if not assinatura:
        raise HTTPException(
            status_code=404,
            detail="Assinatura não encontrada"
        )

    tem_cobrancas = db.query(models.Cobranca.id).filter(
        models.Cobranca.assinatura_id == assinatura_id
    ).first()

    if tem_cobrancas:
        assinatura.ativa = False
        db.commit()
        return {
            "mensagem": "Assinatura cancelada; histórico preservado"
        }

    db.delete(assinatura)
    db.commit()

    return {"mensagem": "Assinatura deletada"}


#Área das cobranças das assinaturas
@app.get("/cobrancas", response_model=list[schemas.Cobranca])
def listar_cobrancas(db: Session = Depends(get_db)):
    return db.query(models.Cobranca).all()


@app.post("/cobrancas", response_model=schemas.Cobranca)
def criar_cobranca(
    cobranca: schemas.CobrancaCreate,
    db: Session = Depends(get_db)
):
    assinatura = db.query(models.Assinatura).filter(
        models.Assinatura.id == cobranca.assinatura_id
    ).first()

    if not assinatura:
        raise HTTPException(
            status_code=404,
            detail="Assinatura não encontrada"
        )

    if not assinatura.ativa:
        raise HTTPException(
            status_code=400,
            detail="Não é possível cobrar uma assinatura cancelada"
        )

    if not 1 <= cobranca.mes <= 12 or cobranca.ano < 2000:
        raise HTTPException(
            status_code=400,
            detail="Mês ou ano inválido"
        )

    existente = db.query(models.Cobranca).filter(
        models.Cobranca.assinatura_id == cobranca.assinatura_id,
        models.Cobranca.ano == cobranca.ano,
        models.Cobranca.mes == cobranca.mes
    ).first()

    if existente:
        raise HTTPException(
            status_code=409,
            detail="Já existe uma cobrança para esta assinatura neste mês"
        )

    nova = models.Cobranca(
        assinatura_id=cobranca.assinatura_id,
        ano=cobranca.ano,
        mes=cobranca.mes,
        valor_centavos=assinatura.valor_centavos,
        status="pendente",
        transacao_id=None
    )

    db.add(nova)

    try:
        db.commit()
        db.refresh(nova)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Esta cobrança já existe"
        )

    return nova


@app.post("/cobrancas/{cobranca_id}/pagar", response_model=schemas.Cobranca)
def pagar_cobranca(
    cobranca_id: int,
    db: Session = Depends(get_db)
):
    cobranca = db.query(models.Cobranca).filter(
        models.Cobranca.id == cobranca_id
    ).with_for_update().first()

    if not cobranca:
        raise HTTPException(
            status_code=404,
            detail="Cobrança não encontrada"
        )

    if cobranca.status == "paga":
        raise HTTPException(
            status_code=409,
            detail="Esta cobrança já foi paga"
        )

    assinatura = db.query(models.Assinatura).filter(
        models.Assinatura.id == cobranca.assinatura_id
    ).first()

    if not assinatura:
        raise HTTPException(
            status_code=404,
            detail="Assinatura não encontrada"
        )

    nova_transacao = models.Transacao(
        descricao=f"Assinatura: {assinatura.nome}",
        valor_centavos=cobranca.valor_centavos,
        tipo="saida",
        data=date.today(),
        categoria_id=assinatura.categoria_id
    )

    db.add(nova_transacao)
    db.flush()

    cobranca.transacao_id = nova_transacao.id
    cobranca.status = "paga"

    try:
        db.commit()
        db.refresh(cobranca)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Não foi possível registrar o pagamento"
        )

    return cobranca

@app.post("/cobrancas/gerar-mensais")
def gerar_cobrancas_automaticamente(
    db:Session=Depends(get_db)
):
    criadas=gerar_cobrancas_mensais(db)

    return{
        "mensagem": "Verificação mensal concluída",
        "cobranças_criadas":criadas
    }
