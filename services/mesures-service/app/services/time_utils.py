"""Utilitaires de date : tout ce qui touche à la "journée locale".

Règle d'or : on STOCKE en UTC (date_mesure), mais on RAISONNE en jour local
(jour_mesure). Ne jamais comparer des dates UTC pour décider "c'est le même jour".
"""
from datetime import date, datetime, timezone, tzinfo


def utc_now() -> datetime:
    """Instant présent, avec fuseau UTC."""
    return datetime.now(timezone.utc)


def to_local(value: datetime, tz: tzinfo) -> datetime:
    """Convertit un datetime dans le fuseau local.

    Si le datetime est "naïf" (sans fuseau), on suppose qu'il est en UTC.
    """
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(tz)


def local_date(value: datetime, tz: tzinfo) -> date:
    """Jour calendaire local correspondant à un instant."""
    return to_local(value, tz).date()


def local_today(tz: tzinfo, now: datetime | None = None) -> date:
    """Jour local d'aujourd'hui (le paramètre `now` sert aux tests)."""
    return local_date(now or utc_now(), tz)
