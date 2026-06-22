from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import os

from app.core.timezone import now_est_edt

# Configuration JWT
# Chargés les valeurs de configurations à partirs des variables d'environnement.
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is required")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Crée un token JWT"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = now_est_edt() + expires_delta
    else:
        expire = now_est_edt() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """Décode et valide un token JWT"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            user_id = payload.get("user_id")

        if user_id is None:
            return None

        try:
            user_id = int(user_id)
        except (TypeError, ValueError):
            return None

        return {"user_id": user_id}
    
    except JWTError:
        return None


def get_current_user_id(token: str) -> Optional[int]:
    """Extrait l'ID utilisateur d'un token JWT"""
    payload = decode_token(token)
    
    if payload is None:
        return None
    
    return payload.get("user_id")
