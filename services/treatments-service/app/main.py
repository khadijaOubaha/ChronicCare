from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

# CORS — autoriser le frontend React et les autres microservices
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
