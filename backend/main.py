# ============================================================
#  SafraTerra API — Backend FastAPI com JWT
# ============================================================

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import sqlite3

# ── Configurações JWT ─────────────────────────────────────────
SECRET_KEY = "safraterra-secret-key-troque-em-producao-123"
ALGORITHM  = "HS256"
TOKEN_EXPIRE_HOURS = 24

app = FastAPI(title="SafraTerra API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://safraterra.vercel.app",
        "https://safraterra-kgeuh88a2-jpalmdas-projects.vercel.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# ── Banco de dados ────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect("agrosafra.db")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    db = get_db()
    db.executescript("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            senha_hash TEXT NOT NULL,
            criado_em TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS talhoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER REFERENCES usuarios(id),
            nome TEXT NOT NULL,
            area_ha REAL NOT NULL,
            solo TEXT,
            latitude REAL,
            longitude REAL,
            criado_em TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS safras (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            talhao_id INTEGER REFERENCES talhoes(id),
            cultura TEXT NOT NULL,
            ciclo TEXT,
            data_plantio TEXT,
            data_colheita TEXT,
            produtividade_sc_ha REAL,
            preco_saca REAL,
            status TEXT DEFAULT 'planejada'
        );

        CREATE TABLE IF NOT EXISTS insumos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            safra_id INTEGER REFERENCES safras(id),
            descricao TEXT NOT NULL,
            quantidade REAL,
            unidade TEXT,
            custo_total REAL,
            data_aplicacao TEXT
        );
    """)
    db.commit()
    db.close()

init_db()

# ── Schemas ───────────────────────────────────────────────────
class UsuarioCreate(BaseModel):
    nome: str
    email: str
    senha: str

class TalhaoCreate(BaseModel):
    nome: str
    area_ha: float
    solo: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class SafraCreate(BaseModel):
    talhao_id: int
    cultura: str
    ciclo: Optional[str] = None
    data_plantio: Optional[str] = None
    data_colheita: Optional[str] = None
    produtividade_sc_ha: Optional[float] = None
    preco_saca: Optional[float] = None
    status: Optional[str] = "planejada"

class InsumoCreate(BaseModel):
    safra_id: int
    descricao: str
    quantidade: Optional[float] = None
    unidade: Optional[str] = None
    custo_total: float
    data_aplicacao: Optional[str] = None

# ── JWT helpers ───────────────────────────────────────────────
def criar_token(data: dict):
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def get_usuario_atual(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario_id = payload.get("sub")
        if not usuario_id:
            raise HTTPException(status_code=401, detail="Token inválido")
        return int(usuario_id)
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")

# ── Auth ──────────────────────────────────────────────────────
@app.post("/auth/cadastro", status_code=201)
def cadastro(u: UsuarioCreate):
    db = get_db()
    existe = db.execute("SELECT id FROM usuarios WHERE email=?", (u.email,)).fetchone()
    if existe:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    senha_hash = pwd_context.hash(u.senha)
    cur = db.execute(
        "INSERT INTO usuarios (nome, email, senha_hash) VALUES (?,?,?)",
        (u.nome, u.email, senha_hash)
    )
    db.commit()
    usuario_id = cur.lastrowid
    db.close()
    token = criar_token({"sub": str(usuario_id)})
    return {"access_token": token, "token_type": "bearer", "nome": u.nome}

@app.post("/auth/login")
def login(form: OAuth2PasswordRequestForm = Depends()):
    db = get_db()
    user = db.execute("SELECT * FROM usuarios WHERE email=?", (form.username,)).fetchone()
    db.close()
    if not user or not pwd_context.verify(form.password, user["senha_hash"]):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    token = criar_token({"sub": str(user["id"])})
    return {"access_token": token, "token_type": "bearer", "nome": user["nome"]}

@app.get("/auth/me")
def me(usuario_id: int = Depends(get_usuario_atual)):
    db = get_db()
    user = db.execute("SELECT id, nome, email FROM usuarios WHERE id=?", (usuario_id,)).fetchone()
    db.close()
    return dict(user)

# ── Talhões ───────────────────────────────────────────────────
@app.get("/talhoes")
def listar_talhoes(usuario_id: int = Depends(get_usuario_atual)):
    db = get_db()
    rows = db.execute(
        "SELECT * FROM talhoes WHERE usuario_id=? ORDER BY id DESC", (usuario_id,)
    ).fetchall()
    db.close()
    return [dict(r) for r in rows]

@app.post("/talhoes", status_code=201)
def criar_talhao(t: TalhaoCreate, usuario_id: int = Depends(get_usuario_atual)):
    db = get_db()
    cur = db.execute(
        "INSERT INTO talhoes (usuario_id, nome, area_ha, solo, latitude, longitude) VALUES (?,?,?,?,?,?)",
        (usuario_id, t.nome, t.area_ha, t.solo, t.latitude, t.longitude)
    )
    db.commit()
    novo = db.execute("SELECT * FROM talhoes WHERE id=?", (cur.lastrowid,)).fetchone()
    db.close()
    return dict(novo)

@app.delete("/talhoes/{id}")
def deletar_talhao(id: int, usuario_id: int = Depends(get_usuario_atual)):
    db = get_db()
    db.execute("DELETE FROM talhoes WHERE id=? AND usuario_id=?", (id, usuario_id))
    db.commit()
    db.close()
    return {"ok": True}

# ── Safras ────────────────────────────────────────────────────
@app.get("/safras")
def listar_safras(usuario_id: int = Depends(get_usuario_atual)):
    db = get_db()
    rows = db.execute("""
        SELECT s.*, t.nome as talhao_nome, t.area_ha
        FROM safras s JOIN talhoes t ON s.talhao_id = t.id
        WHERE t.usuario_id = ?
        ORDER BY s.id DESC
    """, (usuario_id,)).fetchall()
    db.close()
    return [dict(r) for r in rows]

@app.post("/safras", status_code=201)
def criar_safra(s: SafraCreate, usuario_id: int = Depends(get_usuario_atual)):
    db = get_db()
    cur = db.execute(
        """INSERT INTO safras
           (talhao_id, cultura, ciclo, data_plantio, data_colheita,
            produtividade_sc_ha, preco_saca, status)
           VALUES (?,?,?,?,?,?,?,?)""",
        (s.talhao_id, s.cultura, s.ciclo, s.data_plantio,
         s.data_colheita, s.produtividade_sc_ha, s.preco_saca, s.status)
    )
    db.commit()
    novo = db.execute("SELECT * FROM safras WHERE id=?", (cur.lastrowid,)).fetchone()
    db.close()
    return dict(novo)

# ── Insumos ───────────────────────────────────────────────────
@app.get("/safras/{safra_id}/insumos")
def listar_insumos(safra_id: int, usuario_id: int = Depends(get_usuario_atual)):
    db = get_db()
    rows = db.execute(
        "SELECT * FROM insumos WHERE safra_id=? ORDER BY id DESC", (safra_id,)
    ).fetchall()
    db.close()
    return [dict(r) for r in rows]

@app.post("/insumos", status_code=201)
def criar_insumo(i: InsumoCreate, usuario_id: int = Depends(get_usuario_atual)):
    db = get_db()
    cur = db.execute(
        """INSERT INTO insumos
           (safra_id, descricao, quantidade, unidade, custo_total, data_aplicacao)
           VALUES (?,?,?,?,?,?)""",
        (i.safra_id, i.descricao, i.quantidade, i.unidade,
         i.custo_total, i.data_aplicacao)
    )
    db.commit()
    novo = db.execute("SELECT * FROM insumos WHERE id=?", (cur.lastrowid,)).fetchone()
    db.close()
    return dict(novo)

# ── Dashboard ─────────────────────────────────────────────────
@app.get("/dashboard")
def dashboard(usuario_id: int = Depends(get_usuario_atual)):
    db = get_db()
    total_talhoes = db.execute("SELECT COUNT(*) FROM talhoes WHERE usuario_id=?", (usuario_id,)).fetchone()[0]
    total_area    = db.execute("SELECT COALESCE(SUM(area_ha),0) FROM talhoes WHERE usuario_id=?", (usuario_id,)).fetchone()[0]
    total_safras  = db.execute("""
        SELECT COUNT(*) FROM safras s
        JOIN talhoes t ON s.talhao_id=t.id WHERE t.usuario_id=?
    """, (usuario_id,)).fetchone()[0]
    total_insumos = db.execute("""
        SELECT COALESCE(SUM(i.custo_total),0) FROM insumos i
        JOIN safras s ON i.safra_id=s.id
        JOIN talhoes t ON s.talhao_id=t.id WHERE t.usuario_id=?
    """, (usuario_id,)).fetchone()[0]
    receita = db.execute("""
        SELECT COALESCE(SUM(s.produtividade_sc_ha * s.preco_saca * t.area_ha), 0)
        FROM safras s JOIN talhoes t ON s.talhao_id=t.id
        WHERE t.usuario_id=? AND s.produtividade_sc_ha IS NOT NULL AND s.preco_saca IS NOT NULL
    """, (usuario_id,)).fetchone()[0]
    db.close()
    return {
        "total_talhoes": total_talhoes,
        "total_area_ha": total_area,
        "total_safras": total_safras,
        "custo_insumos": total_insumos,
        "receita_estimada": receita,
        "lucro_estimado": receita - total_insumos,
    }