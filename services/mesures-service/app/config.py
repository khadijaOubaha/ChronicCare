import os
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


APP_TIMEZONE_NAME = os.getenv(
    "APP_TIMEZONE",
    "Africa/Casablanca"
)

try:
    APP_TIMEZONE = ZoneInfo(APP_TIMEZONE_NAME)
except ZoneInfoNotFoundError:
    raise RuntimeError(
        f"Fuseau horaire invalide : {APP_TIMEZONE_NAME}"
    )

PATIENTS_SERVICE_URL = os.getenv(
    "PATIENTS_SERVICE_URL",
    "http://patients-service:8001"
).rstrip("/")

PATIENTS_SERVICE_TIMEOUT = float(
    os.getenv("PATIENTS_SERVICE_TIMEOUT", "3.0")
)

CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173"
    ).split(",")
    if origin.strip()
]