import logging

from fastapi import HTTPException, status
from starlette.requests import Request
from app.crud.log import log_unauthorized_access_attempt as save_log_unauthorized_access_attempt
from app.dependencies.db import get_db
from sqlalchemy.orm import Session

#Message d'erreur générique pour les accès non autorisés
AUTH_UNAUTHORIZED_DETAIL = "Accès refusé"

logger = logging.getLogger(__name__)


def raise_unauthorized_auth_error(db: Session, request: Request, reason: str) -> None:
    client_host = request.client.host if request.client else "unknown"
    logger.warning(
        "Auth failure | reason=%s | ip=%s | method=%s | path=%s | user_agent=%s",
        reason,
        client_host,
        request.method,
        request.url.path,
        request.headers.get("user-agent", "unknown"),
    )
    save_unauthorized_access_attempt(db, request, reason)
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=AUTH_UNAUTHORIZED_DETAIL,
        headers={"WWW-Authenticate": "Bearer"},
    )

def save_unauthorized_access_attempt(db: Session, request: Request, reason: str) -> None:
    client_host = request.client.host if request.client else "unknown"
    data = {
        "reason": reason,
        "ip": client_host,
        "method": request.method,
        "path": request.url.path,
        "user_agent": request.headers.get("user-agent", "unknown"),
    }
    save_log_unauthorized_access_attempt(db, request, data)