from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

from app.schema.Auth import RoleResponse

class UtilisateurBase(BaseModel):
    prenom: str = None
    nom: str
    email: EmailStr
    numero_telephone: Optional[str] = None
    role_id: Optional[int] = None
    est_actif: bool = True

class UtilisateurReferenceResponse(BaseModel):
    id: int
    prenom: str = None
    nom: str
    email: EmailStr
    numero_telephone: Optional[str] = None
    role_id: Optional[int] = None
    role: RoleResponse | None = None
    est_actif: bool = True
    date_entrer: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }


class UtilisateurUpdateRequest(BaseModel):
    prenom: str | None = None
    nom: str | None = None
    email: EmailStr | None = None
    numero_telephone: str | None = None
    role_id: int | None = None
    est_actif: bool | None = None

class UtilisateurActivationResponse(BaseModel):
    message: str
    utilisateur_id: int
    est_actif: bool


class UtilisateurRoleUpdateRequest(BaseModel):
    """Schema de mise a jour du role d'un utilisateur."""

    role_id: int = Field(..., ge=1, le=3, description="ID du role cible")

    class Config:
        json_schema_extra = {
            "example": {
                "role_id": 2,
            }
        }


class UtilisateurRoleUpdateResponse(BaseModel):
    message: str
    utilisateur_id: int
    role_id: int