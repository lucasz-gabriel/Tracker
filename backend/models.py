from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Date,UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base

class Categoria(Base):
    __tablename__ = "categorias"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    tipo = Column(String, nullable=False) 

    transacoes = relationship("Transacao", back_populates="categoria")
    assinaturas = relationship("Assinatura", back_populates="categoria")


class Transacao(Base):
    __tablename__ = "transacoes"

    id = Column(Integer, primary_key=True, index=True)
    descricao = Column(String, nullable=False)
    valor_centavos = Column(Integer, nullable=False)
    tipo = Column(String, nullable=False) 
    data = Column(Date, nullable=False)
    categoria_id = Column(Integer, ForeignKey("categorias.id"))

    categoria = relationship("Categoria", back_populates="transacoes")

    
class Assinatura(Base):
    __tablename__ = "assinaturas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    valor_centavos = Column(Integer, nullable=False)
    dia_vencimento = Column(Integer, nullable=False)
    ativa = Column(Boolean, default=True)
    categoria_id = Column(Integer, ForeignKey("categorias.id"))

    categoria = relationship("Categoria", back_populates="assinaturas")
    cobrancas = relationship("Cobranca", back_populates="assinatura")

class Cobranca(Base):
    __tablename__="cobrancas"

    __table_args__=(
        UniqueConstraint(
            "assinatura_id",
            "ano",
            "mes",
            name="uq_cobranca_assinatura_mes"
        ),
    )
    id = Column(Integer, primary_key=True, index=True)
    assinatura_id = Column(
        Integer,
        ForeignKey("assinaturas.id"),
        nullable=False
    )
    ano = Column(Integer, nullable=False)
    mes = Column(Integer, nullable=False)
    valor_centavos = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="pendente")
    transacao_id = Column(Integer,ForeignKey("transacoes.id"),nullable=True)

    assinatura = relationship("Assinatura", back_populates="cobrancas")
    transacao = relationship("Transacao")

