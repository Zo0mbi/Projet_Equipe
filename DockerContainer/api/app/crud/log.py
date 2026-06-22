from sqlalchemy.orm import Session
from app.models.log import Log
from app.schema.Log import LogCreate
from app.dependencies.db import get_db
from starlette.requests import Request

def create_log(db: Session, payload: LogCreate) -> Log:
    log = Log(
        user_id=payload.user_id,
        categorie=payload.categorie,
        action=payload.action,
        type=payload.type,
    )
    db.add(log)
    db.flush()
    db.commit()
    return log

# Logique de journalisation d'une tentative d'accès non autorisée, avec enregistrement des détails pertinents dans la base de données
# Problème: Les IP ne sont pas toujours fiables, Car Cloudflare ne me permet pas d'avoir l'IP réelle du client, et les utilisateurs peuvent utiliser des VPN ou des proxys pour masquer leur IP.
def log_unauthorized_access_attempt(db: Session,request: Request, data: dict) -> Log:
    # Basic SQL injection check
    for key, value in data.items():
        if isinstance(value, str) and (";" in value or "--" in value or "/*" in value or "*/" in value):
            data[key] = "[REDACTED]"
    
    log = Log(
        user_id=None,
        categorie="auth",
        action="unauthorized_access_attempt",
        ip_address=data.get("ip"),
        path=data.get("path"),
        method=data.get("method"),
        reason=data.get("reason"),
        details=str(data),
    )
    db.add(log)
    db.flush()
    db.commit()
    return log