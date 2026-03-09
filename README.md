# 🌾 AgroSafra — Projeto de Prática Freelancer

Sistema de gestão de safras para produtores rurais.
Stack: **Python (FastAPI) + React (Vite)**

---

## 🚀 Como rodar o projeto

### Backend (Python)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# API rodando em http://localhost:8000
# Docs automáticas em http://localhost:8000/docs
```

### Frontend (React)
```bash
cd frontend
npm create vite@latest . -- --template react
npm install
npm run dev
# App rodando em http://localhost:5173
```

> Copie os arquivos de `frontend/src/` para dentro do projeto Vite criado.

---

## 🗂️ Estrutura do projeto

```
agrosafra/
├── backend/
│   ├── main.py          ← API FastAPI completa
│   └── requirements.txt
└── frontend/
    └── src/
        ├── services/
        │   └── api.js       ← chamadas HTTP para o backend
        └── pages/
            └── Dashboard.jsx ← página principal
```
