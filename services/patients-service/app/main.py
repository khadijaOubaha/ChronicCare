
from fastapi import FastAPI

from app.routers.patients import router as patients_router


app = FastAPI(
    title="ChronicCare - Patients Service",
    description="API REST de gestion des patients",
    version="1.0.0",
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
