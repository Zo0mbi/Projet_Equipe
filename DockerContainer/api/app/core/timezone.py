from datetime import datetime
from zoneinfo import ZoneInfo


EASTERN_TZ = ZoneInfo("America/Toronto")


def now_est_edt() -> datetime:
    """Retourne l'heure courante locale EST/EDT."""
    return datetime.now(EASTERN_TZ)


def ensure_eastern_timezone(value: datetime) -> datetime:
    """Normalise un datetime en timezone America/Toronto."""
    if value.tzinfo is None:
        return value.replace(tzinfo=EASTERN_TZ)
    return value.astimezone(EASTERN_TZ)