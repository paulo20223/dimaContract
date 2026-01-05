from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import auth, banks, services, clients, contracts


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Contract Generator API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://lexaudit.tenzorro.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(banks.router)
app.include_router(services.router)
app.include_router(clients.router)
app.include_router(contracts.router)

@app.get("/api/health")
async def health():
    return {"status": "ok"}
