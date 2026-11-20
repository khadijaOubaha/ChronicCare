from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import config
from app.errors import register_exception_handlers
from app.routers.mesures import router as mesures_router


app = FastAPI(
    title="ChronicCare - Mesures Service",
    description="API REST de gestion des mesures des patients",
    version="1.0.0"
)


# Configuration CORS pour autoriser le frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


# Enregistrement des gestionnaires d'erreurs
register_exception_handlers(app)


# Route d'accueil
@app.get("/")
def home():
    return {
        "service": "mesures-service",
        "message": "Bienvenue dans ChronicCare",
        "status": "running"
    }


# Route de vérification de disponibilité
@app.get("/health")
def health():
    return {"status": "healthy"}


# Connexion du routeur Mesures
app.include_router(mesures_router)