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

---

## 🎯 Roadmap de desafios (do mais fácil ao mais difícil)

### Nível 1 — Fundamentos (1–2 semanas)
- [ ] Rodar o backend e testar os endpoints no `localhost:8000/docs`
- [ ] Conectar o React ao backend e exibir talhões na tela
- [ ] Criar formulário para cadastrar um novo talhão
- [ ] Criar formulário para cadastrar uma safra

### Nível 2 — Funcionalidades reais (2–3 semanas)
- [ ] Tela de detalhe de safra com lista de insumos
- [ ] Formulário para registrar insumos aplicados
- [ ] Cálculo automático de custo total e receita por safra
- [ ] Filtrar safras por status (planejada / em andamento / concluída)

### Nível 3 — Qualidade profissional (2–3 semanas)
- [ ] Autenticação com JWT (login/logout)
- [ ] Gráfico de receita x custo por safra (Recharts)
- [ ] Exportar relatório da safra em PDF
- [ ] Histórico de produtividade por talhão
- [ ] Deploy: backend no Railway, frontend na Vercel

### Nível 4 — Virar produto (opcional)
- [ ] Multi-tenant: cada produtor tem sua conta
- [ ] Alertas de clima via API do INMET
- [ ] App mobile com React Native
- [ ] Dashboard comparativo entre safras

---

## 💼 Como usar isso para conseguir clientes

### Passo 1 — Monte o portfólio
- Finalize o Nível 1 e 2
- Suba no GitHub com README bonito
- Faça um vídeo curto de 2 minutos mostrando funcionando

### Passo 2 — Encontre o primeiro cliente
- Pense em conhecidos ligados ao agro (família, amigos, professores)
- Entre em grupos de produtores no WhatsApp / Facebook
- Ofereça para adaptar o sistema gratuitamente para 1 fazenda

### Passo 3 — Precifique o freelance
| Serviço | Faixa de preço |
|---|---|
| Landing page simples | R$ 500 – 1.500 |
| Sistema de gestão básico | R$ 2.000 – 5.000 |
| Sistema completo com login | R$ 5.000 – 15.000 |
| Manutenção mensal | R$ 300 – 800/mês |

### Passo 4 — Entregue e fidelize
- Documente bem o que entregou
- Ofereça suporte por 30 dias
- Peça indicação após o projeto

---

## 🛠️ Tecnologias usadas

| Camada | Tecnologia | Por quê |
|---|---|---|
| Backend API | FastAPI (Python) | Rápido, moderno, docs automáticas |
| Banco de dados | SQLite (dev) / PostgreSQL (prod) | Simples para começar |
| Frontend | React + Vite | Mercado, componentes reutilizáveis |
| HTTP Client | Fetch nativo | Sem dependência extra |
| Deploy backend | Railway / Render | Grátis para projetos pequenos |
| Deploy frontend | Vercel / Netlify | Grátis, CI/CD automático |
