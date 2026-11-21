from contextlib import asynccontextmanager

from fastapi import FastAPI

from app import models  # noqa: F401  (enregistre les tables)
from app.api.health import router as health_router
from app.api.notifications import router as notifications_router
from app.core.database import Base, engine
from app.api.events import router as events_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Reminders Service",
    description="Notifications et rappels ChronicCare",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(health_router)
app.include_router(notifications_router)
app.include_router(events_router)