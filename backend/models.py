from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Date
from sqlalchemy.orm import relationship
from database import Base

class Categoria(Base):
    __tablename__ = "categorias"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    tipo = Column(String, nullable=False)  # "entrada" ou "saida"

    transacoes = relationship("Transacao", back_populates="categoria")
    assinaturas = relationship("Assinatura", back_populates="categoria")


class Transacao(Base):
    __tablename__ = "transacoes"

    id = Column(Integer, primary_key=True, index=True)
    descricao = Column(String, nullable=False)
    valor_centavos = Column(Integer, nullable=False)
    tipo = Column(String, nullable=False)  # "entrada" ou "saida"
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