# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Contract Generator Application (Russian language) - full-stack web app for managing legal contracts, clients, services, and banks with document generation capabilities.

## Tech Stack

- **Backend**: FastAPI 0.109 + Python 3.12, async SQLAlchemy 2.0 with asyncpg, JWT auth
- **Frontend**: Next.js 14.1 + React 18, TypeScript, Tailwind CSS, Radix UI
- **Database**: PostgreSQL 15
- **Documents**: python-docx + docxtpl for Word template generation

## Commands

### Docker (full stack)
```bash
docker-compose up -d              # Start PostgreSQL + backend
docker-compose down               # Stop services
docker-compose logs -f app        # View backend logs
```

### Backend Development
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev                       # Development server (port 3000)
npm run build                     # Production build
npm run lint                      # ESLint
```

## Architecture

```
backend/app/
├── main.py          # FastAPI app, CORS config, router registration
├── config.py        # Settings from env vars (DATABASE_URL, JWT_SECRET, AUTH_PASSWORD)
├── database.py      # AsyncSession setup
├── models.py        # SQLAlchemy ORM: Bank, Service, Client, Contract, contract_services
├── schemas.py       # Pydantic request/response models
├── auth.py          # JWT token creation/verification
├── document.py      # Contract .docx generation from templates
└── routers/         # API endpoints (auth, banks, clients, services, contracts)

frontend/src/
├── app/
│   ├── login/       # Authentication page
│   └── (dashboard)/ # Protected routes: contracts, clients, services, banks
├── components/
│   ├── ui/          # Radix UI + Tailwind components
│   └── layout/      # Sidebar navigation
└── lib/
    ├── api.ts       # Axios instance + API methods (base: localhost:8000/api)
    └── auth.ts      # Token management (localStorage: auth_token)
```

## Data Model

- **Banks**: Financial institutions (name, BIK, correspondent_account)
- **Services**: Billable items (name, price as Decimal, payment_terms)
- **Clients**: Individual entrepreneurs (name, ОГРНИП, ИНН, email, phone, address, bank_id)
- **Contracts**: Agreements (unique number, client_id, date, M:M with services)

## API Authentication

All endpoints except `/api/auth/login` require `Authorization: Bearer <token>` header.
Login with password from `AUTH_PASSWORD` env var (default: "secret123").

## Key Implementation Notes

- CORS configured for `http://localhost:3000` only
- Database tables auto-created on startup via SQLAlchemy metadata
- Contract document generation uses `backend/templates/` directory; falls back to basic doc if template missing
- Frontend uses `@/*` path alias mapping to `./src/*`
- 401 responses automatically redirect to /login and clear token