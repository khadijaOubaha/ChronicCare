from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.repositories import event_repository, notification_repository
from app.schemas.event import EventCreate
from app.schemas.notification import NotificationCreate

# Types d'événements connus -> (type, titre, message) de la notification.
# La liste exacte est à valider avec l'équipe.
EVENT_TEMPLATES: dict[str, tuple[str, str, str]] = {
    "measurement.abnormal": (
        "alert",
        "Mesure à vérifier",
        "Une de vos mesures nécessite votre attention. Consultez votre suivi.",
    ),
    "treatment.updated": (
        "info",
        "Traitement mis à jour",
        "Votre traitement a été mis à jour. Consultez les détails.",
    ),
    "teleconsultation.scheduled": (
        "info",
        "Téléconsultation planifiée",
        "Une téléconsultation a été planifiée. Consultez votre agenda.",
    ),
}


class UnknownEventType(Exception):
    pass


def process_event(db: Session, data: EventCreate) -> tuple:
    template = EVENT_TEMPLATES.get(data.event_type)
    if template is None:
        raise UnknownEventType(data.event_type)

    event = event_repository.create(db, data)

    notif_type, title, message = template
    notification: Notification = notification_repository.create(
        db,
        NotificationCreate(
            patient_id=data.patient_id,
            doctor_id=data.doctor_id,
            type=notif_type,
            title=title,
            message=message,
        ),
        source_event_id=event.id,
    )

    event_repository.mark_processed(db, event)
    return event, notification