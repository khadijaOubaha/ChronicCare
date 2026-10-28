
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.database import Base, engine
from app.models.treatment import Treatment  # noqa: F401
from app.routers.treatments import router as treatments_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="ChronicCare - Treatments Service",
    description="API REST de gestion des traitements medicaux.",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/")
def home():
    return {
        "service": "treatments-service",
        "message": "ChronicCare Treatments Service",
        "status": "running",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


app.include_router(treatments_router)

