# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Contract Generator Application (Russian language) - full-stack web app for managing legal contracts, clients, services, and banks with document generation capabilities.

## Tech Stack

- **Backend**: FastAPI 0.109 + Python 3.12, async SQLAlchemy 2.0 with asyncpg, JWT auth
- **Frontend**: Next.js 14.1 + React 18, TypeScript, TailwindCSS, Radix UI, TanStack Query
- **Database**: PostgreSQL 15
- **Documents**: python-docx + docxtpl for Word template generation, LibreOffice for PDF

## Commands

### Task Runner (recommended)
Requires [Task](https://taskfile.dev/) CLI installed.
```bash
task up                           # Start all services (docker-compose up -d)
task down                         # Stop services
task logs                         # View logs (add service name: task logs app)
task build                        # Rebuild containers
task db:up                        # Apply all migrations
task db:rev -- "migration name"   # Create new migration
task db:down                      # Rollback one migration
task db:history                   # Show migration history
task template                     # Generate contract template
task invoice                      # Generate invoice template
```

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
pnpm install                      # or npm install
pnpm dev                          # Development server (port 3000)
pnpm build                        # Production build
pnpm lint                         # ESLint
pnpm generate-api                 # Generate TypeScript types from OpenAPI (requires backend running)
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
├── document/        # Contract document generation module
│   ├── generator.py       # Main doc generation logic
│   ├── replacements.py    # Placeholder replacement
│   ├── tables.py          # Service table filling
│   └── pdf_generator.py   # PDF conversion via LibreOffice
└── routers/         # API endpoints (auth, banks, clients, services, contracts)

frontend/src/
├── app/
│   ├── login/       # Authentication page
│   └── (dashboard)/ # Protected routes: contracts, clients, services, banks
├── components/
│   ├── ui/          # Radix UI + Tailwind components
│   └── layout/      # Sidebar navigation
├── lib/
│   ├── api-client.ts    # openapi-fetch client with auth interceptor
│   ├── api-types.ts     # Generated from OpenAPI (gitignored)
│   └── auth.ts          # Token management (localStorage: auth_token)
└── middleware.ts    # Route protection
```

## Data Model

- **Banks**: Financial institutions (name, BIK, correspondent_account)
- **Services**: Billable items (name, price as Decimal(12,2), payment_terms)
- **Clients**: Legal entities and individuals with auto-generated names based on type
- **Contracts**: Agreements (unique number, client_id, date, M:M with services)

### Client Types
```python
CLIENT_TYPES = {
    "ip": "ИП",       # Individual entrepreneur
    "ooo": "ООО",     # LLC
    "ao": "АО",       # JSC
    "pao": "ПАО",     # Public JSC
    "nko": "НКО",     # Non-profit
    "fl": "Физлицо",  # Individual
}
```

Client `name` field is auto-generated from type + company_name/FIO (e.g., "ИП Иванов Иван Иванович", "ООО «Компания»").

## API Authentication

All endpoints except `/api/auth/login` require `Authorization: Bearer <token>` header.
Login with password from `AUTH_PASSWORD` env var (default: "secret123").

## Key Implementation Notes

- CORS configured for `http://localhost:3000` and `https://lexaudit.tenzorro.com`
- Database migrations via Alembic (use `task db:*` commands)
- Contract document generation uses `backend/templates/` directory; falls back to basic doc if template missing
- Frontend uses `@/*` path alias mapping to `./src/*`
- 401 responses automatically redirect to /login and clear token
- Frontend API types generated from backend OpenAPI spec via `pnpm generate-api`
