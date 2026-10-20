from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.database import Base, engine
from app import models
from app.routers.patients import router as patients_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="ChronicCare - Patients Service",
    description="API REST de gestion des patients",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/")
def home():
    return {
        "service": "patients-service",
        "message": "Bienvenue dans ChronicCare",
        "status": "running",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


app.include_router(patients_router)
