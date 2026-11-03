from fastapi import FastAPI

app = FastAPI(
    title="ChronicCare - Mesures Service",
    description="API REST de gestion des mesures des patients",
    version="1.0.0"
)

@app.get("/")
def home():
    return {
        "service": "mesures-service",
        "message": "Bienvenue dans ChronicCare",
        "status": "running"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}