
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.models import User  # noqa: F401
from app.routers.auth import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="ChronicCare Auth Service",
    description="Authentification et gestion des comptes ChronicCare.",
    version="1.0.0",
    lifespan=lifespan,
)

# Autoriser le frontend React en développement
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)


@app.get("/")
def root():
    return {"service": "auth-service", "status": "running"}


@app.get("/health")
def health():
    return {"status": "healthy"}
