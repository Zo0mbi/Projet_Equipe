from fastapi import Depends, HTTPException, status
from starlette.requests import Request
from app.core.auth import decode_token
from app.core.auth_errors import raise_unauthorized_auth_error
from app.dependencies.db import get_db
from app.crud.user import get_user_by_id
from app.models.utilisateur import Utilisateur
from sqlalchemy.orm import Session
from typing import Optional

async def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Dépendance pour récupérer l'utilisateur courant à partir du token JWT.
    À utiliser sur les routes protégées.
    """
    # Extraire le token du header Authorization
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise_unauthorized_auth_error(db,request, "missing_authorization_header")
    
    # Vérifier que le header commence par "Bearer "
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise_unauthorized_auth_error(db,request, "invalid_authorization_header_format")
    
    token = parts[1]
    
    payload = decode_token(token)
    
    if payload is None:
        raise_unauthorized_auth_error(db,request, "invalid_or_expired_token")
    
    user_id = payload.get("user_id")
    
    if user_id is None:
        raise_unauthorized_auth_error(db,request, "token_missing_user_id")
    
    user = get_user_by_id(db, user_id)
    
    if user is None:
        raise_unauthorized_auth_error(db,request, "user_not_found")

    if not user.est_actif:
        raise_unauthorized_auth_error(db,request, "user_inactive")
    
    return user

async def get_current_user_optional(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[Utilisateur]:

    auth_header = request.headers.get("Authorization")
    
    if not auth_header:
        return None

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    token = parts[1]
    payload = decode_token(token)

    if payload is None:
        return None

    user_id = payload.get("user_id")
    if user_id is None:
        return None

    user = get_user_by_id(db, user_id)

    if user is None:
        return None

    if not user.est_actif:
        return None

    return user


def verifierPermissionsEmployes(current_user: Utilisateur):
    if current_user is None:
        return False
    if current_user.role_id not in [2, 3]: # 2 = employe, 3 = admin
        return False
    return True
