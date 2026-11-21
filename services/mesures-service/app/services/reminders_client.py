
import logging

import httpx

from app import config

logger = logging.getLogger(__name__)


class RemindersClient:
    def __init__(self):
        self.base_url = config.REMINDERS_SERVICE_URL.rstrip("/")
        self.timeout = config.REMINDERS_SERVICE_TIMEOUT

    def send_abnormal_measurement(
        self,
        event: dict,
        access_token: str,
    ) -> bool:
        url = f"{self.base_url}/api/v1/events/measurements/abnormal"

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

        try:
            response = httpx.post(
                url,
                json=event,
                headers=headers,
                timeout=self.timeout,
            )
            response.raise_for_status()

            logger.info(
                "Événement de mesure anormale envoyé : %s",
                event["event_id"],
            )
            return True

        except httpx.HTTPError:
            logger.exception(
                "Échec de l'envoi de l'événement vers Reminders."
            )
            return False
