# ============================================================
#  AgroSafra API — Backend FastAPI
#  Pratique: adicione autenticação, novos endpoints, relatórios
# ============================================================

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import date
import sqlite3, json

app = FastAPI(title="AgroSafra API", version="1.0.0")

# CORS — permite o React se comunicar com a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Banco de dados SQLite (simples para dev) ──────────────────
def get_db():
    conn = sqlite3.connect("agrosafra.db")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    db = get_db()
    db.executescript("""
        CREATE TABLE IF NOT EXISTS talhoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            area_ha REAL NOT NULL,
            solo TEXT,
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

# ── Schemas Pydantic ──────────────────────────────────────────
class TalhaoCreate(BaseModel):
    nome: str
    area_ha: float
    solo: Optional[str] = None

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

# ── Rotas: Talhões ────────────────────────────────────────────
@app.get("/talhoes")
def listar_talhoes():
    db = get_db()
    rows = db.execute("SELECT * FROM talhoes ORDER BY id DESC").fetchall()
    db.close()
    return [dict(r) for r in rows]

@app.post("/talhoes", status_code=201)
def criar_talhao(t: TalhaoCreate):
    db = get_db()
    cur = db.execute(
        "INSERT INTO talhoes (nome, area_ha, solo) VALUES (?, ?, ?)",
        (t.nome, t.area_ha, t.solo)
    )
    db.commit()
    novo = db.execute("SELECT * FROM talhoes WHERE id=?", (cur.lastrowid,)).fetchone()
    db.close()
    return dict(novo)

@app.delete("/talhoes/{id}")
def deletar_talhao(id: int):
    db = get_db()
    db.execute("DELETE FROM talhoes WHERE id=?", (id,))
    db.commit()
    db.close()
    return {"ok": True}

# ── Rotas: Safras ─────────────────────────────────────────────
@app.get("/safras")
def listar_safras():
    db = get_db()
    rows = db.execute("""
        SELECT s.*, t.nome as talhao_nome, t.area_ha
        FROM safras s JOIN talhoes t ON s.talhao_id = t.id
        ORDER BY s.id DESC
    """).fetchall()
    db.close()
    return [dict(r) for r in rows]

@app.post("/safras", status_code=201)
def criar_safra(s: SafraCreate):
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

# ── Rotas: Insumos ────────────────────────────────────────────
@app.get("/safras/{safra_id}/insumos")
def listar_insumos(safra_id: int):
    db = get_db()
    rows = db.execute(
        "SELECT * FROM insumos WHERE safra_id=? ORDER BY id DESC", (safra_id,)
    ).fetchall()
    db.close()
    return [dict(r) for r in rows]

@app.post("/insumos", status_code=201)
def criar_insumo(i: InsumoCreate):
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

# ── Rota: Dashboard (resumo) ──────────────────────────────────
@app.get("/dashboard")
def dashboard():
    db = get_db()

    total_talhoes = db.execute("SELECT COUNT(*) FROM talhoes").fetchone()[0]
    total_area    = db.execute("SELECT COALESCE(SUM(area_ha),0) FROM talhoes").fetchone()[0]
    total_safras  = db.execute("SELECT COUNT(*) FROM safras").fetchone()[0]
    total_insumos = db.execute("SELECT COALESCE(SUM(custo_total),0) FROM insumos").fetchone()[0]

    # Receita estimada das safras com dados completos
    receita = db.execute("""
        SELECT COALESCE(SUM(produtividade_sc_ha * preco_saca * area_ha), 0)
        FROM safras s JOIN talhoes t ON s.talhao_id = t.id
        WHERE produtividade_sc_ha IS NOT NULL AND preco_saca IS NOT NULL
    """).fetchone()[0]

    safras_status = db.execute("""
        SELECT status, COUNT(*) as total FROM safras GROUP BY status
    """).fetchall()

    db.close()
    return {
        "total_talhoes": total_talhoes,
        "total_area_ha": total_area,
        "total_safras": total_safras,
        "custo_insumos": total_insumos,
        "receita_estimada": receita,
        "lucro_estimado": receita - total_insumos,
        "safras_por_status": [dict(r) for r in safras_status],
    }

# ── 🎯 DESAFIOS PARA VOCÊ IMPLEMENTAR ────────────────────────
# 1. POST /auth/login  — autenticação com JWT
# 2. GET  /relatorio/safra/{id} — PDF com resumo financeiro
# 3. POST /safras/{id}/fechar — marca safra como concluída
# 4. GET  /talhoes/{id}/historico — todas safras de um talhão
# 5. Middleware de log de requisições
