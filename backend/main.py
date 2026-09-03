from fastapi import FastAPI, HTTPException
from sqlmodel import Field, Session, SQLModel, create_engine, select
from pydantic import BaseModel
import httpx
from readability import Document
from bs4 import BeautifulSoup

# 1. Configuração do Banco de Dados SQLite Local
sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
engine = create_engine(sqlite_url, echo=False)

# 2. Definição da Tabela/Modelo (SQLModel faz o trabalho duplo de BD e Validação)
class Article(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    url: str
    title: str
    content: str
    reading_time_minutes: int

# 3. Modelo para receber a requisição do usuário (Pydantic padrão)
class ArticleRequest(BaseModel):
    url: str

# 4. Inicializa o FastAPI e cria as tabelas
app = FastAPI(title="Lector API")

@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)

# 5. A Rota Mágica que extrai e salva no banco
@app.post("/articles/extract", response_model=Article)
def extract_and_save_article(request: ArticleRequest):
    headers = {
         "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    try:
        # Extração
        response = httpx.get(request.url, headers=headers, follow_redirects=True)
        response.raise_for_status()
        
        doc = Document(response.text)
        titulo = doc.title()
        html_limpo = doc.summary()
        texto_puro = BeautifulSoup(html_limpo, "html.parser").get_text(separator="\n\n", strip=True)
        
        # Cálculo de tempo estimado (200 palavras por min)
        qtd_palavras = len(texto_puro.split())
        tempo_leitura = max(1, round(qtd_palavras / 200)) # Pelo menos 1 min
        
        # Criação do objeto do banco
        new_article = Article(
            url=request.url,
            title=titulo,
            content=texto_puro,
            reading_time_minutes=tempo_leitura
        )
        
        # Salva no banco SQLite
        with Session(engine) as session:
            session.add(new_article)
            session.commit()
            session.refresh(new_article)
            
        return new_article
        
    except Exception as e:
         raise HTTPException(status_code=400, detail=f"Erro ao extrair artigo: {str(e)}")

# 6. Rota para listar os artigos salvos
@app.get("/articles", response_model=list[Article])
def list_articles():
    with Session(engine) as session:
        articles = session.exec(select(Article)).all()
        return articles