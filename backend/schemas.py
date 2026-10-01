from pydantic import BaseModel
from datetime import date
from typing import Optional

class TransacaoBase(BaseModel):
    descricao: str
    valor_centavos: int
    tipo: str
    data: date
    categoria_id: Optional[int] = None

    
class CategoriaBase(BaseModel):
    nome: str
    tipo: str 

class CategoriaCreate(CategoriaBase):
    pass

class Categoria(CategoriaBase):
    id: int

    class Config:
        from_attributes = True


class TransacaoCreate(TransacaoBase):
    pass

class Transacao(TransacaoBase):
    id: int

    class Config:
        from_attributes = True