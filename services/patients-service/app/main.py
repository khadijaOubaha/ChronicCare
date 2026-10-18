from fastapi import FastAPI

app = FastAPI(
    title="ChronicCare - Patients Service",
    description="API REST pour la gestion des patients",
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
