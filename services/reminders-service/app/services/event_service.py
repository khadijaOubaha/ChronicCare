
from uuid import UUID

from sqlalchemy.orm import Session

from app.repositories import event_repository, notification_repository
from app.schemas.notification import NotificationCreate


EVENT_TEMPLATES = {
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


def process_event(
    db: Session,
    data,
    patient_user_id: UUID,
):
    template = EVENT_TEMPLATES.get(data.event_type)

    if template is None:
        raise UnknownEventType(data.event_type)

    try:
        # 1. Enregistrer l'événement
        event = event_repository.create(db, data)

        # 2. Préparer la notification
        notification_type, title, message = template

        notification_data = NotificationCreate(
            patient_id=data.patient_id,
            doctor_id=data.doctor_id,
            type=notification_type,
            title=title,
            message=message,
        )

        # 3. Créer la notification et ses destinataires
        notification = notification_repository.create(
            db=db,
            data=notification_data,
            patient_user_id=patient_user_id,
            source_event_id=event.id,
        )

        # 4. Marquer l'événement comme traité
        event_repository.mark_processed(db, event)

        # Une seule validation de transaction
        db.commit()
        db.refresh(event)
        db.refresh(notification)

        return event, notification

    except Exception:
        db.rollback()
        raise