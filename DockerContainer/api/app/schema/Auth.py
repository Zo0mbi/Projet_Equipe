from pydantic import BaseModel, EmailStr, Field, SecretStr, field_validator
from typing import Optional
from datetime import datetime


# =========================
# SCHEMAS DE REFERENCE
# =========================

# Schema de reference pour un rôle
class RoleResponse(BaseModel):
    """Schema de reponse pour un rôle"""
    id: int = Field(description="ID unique du rôle")
    nom: str = Field(description="Nom du rôle")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "nom": "public"
            }
        }


# =========================
# REQUEST SCHEMAS
# =========================

# Créer un nouveau compte utilisateur
class RegisterRequest(BaseModel):
    """Schema pour l'inscription d'un nouvel utilisateur"""
    prenom: str | None = Field(default=None, max_length=100, description="Prénom de l'utilisateur")
    nom: str = Field(..., min_length=2, max_length=100, description="Nom complet de l'utilisateur")
    email: EmailStr = Field(..., description="Adresse email unique")
    mot_de_passe: SecretStr = Field(..., description="Mot de passe (min 8 caractères)")

    @field_validator("nom")
    @classmethod
    def validate_nom(cls, value: str) -> str:
        # Faire un trie et vérifier que le nom contient au moins un espace (prénom et nom) A chaque nouvelle erreur le message d'erreur doit être plus précis pour aider l'utilisateur à comprendre ce qui ne va pas
        error = ""
        if len(value.strip()) < 2:
            error += "Le nom doit contenir au moins 2 caractères."
        if len(value.strip()) > 100:
            error += "\nLe nom ne doit pas dépasser 100 caractères."
        if error != "":
            raise ValueError(error)
        return value.strip()

    @field_validator("mot_de_passe")
    @classmethod
    def validate_password(cls, value: SecretStr) -> SecretStr:
        if len(value.get_secret_value()) < 8:
            raise ValueError("Le mot de passe doit contenir au moins 8 caractères.")
        return value
    
    @field_validator("email")
    @classmethod
    def validate_email(cls, value: EmailStr) -> EmailStr:
        return value.lower()
    
    @field_validator("prenom")
    @classmethod
    def validate_prenom(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            return None
        if len(value) > 100:
            raise ValueError("Le prénom ne doit pas dépasser 100 caractères.")
        return value

    class Config:
        json_schema_extra = {
            "example": {
                "prenom": "Jean",
                "nom": "Jean Dupont",
                "email": "jean@example.com",
                "mot_de_passe": "MonMotDePasse123!"
            }
        }

# Se connecter avec un compte existant
# Prend un email et un mot de passe, et retourne un token JWT si les informations sont correctes
class LoginRequest(BaseModel):
    """Schema pour la connexion"""
    email: EmailStr = Field(..., description="Adresse email")
    mot_de_passe: SecretStr = Field(..., description="Mot de passe")

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: EmailStr) -> EmailStr:
        return value.lower()
    
    @field_validator("mot_de_passe")
    @classmethod
    def validate_password(cls, value: SecretStr) -> SecretStr:
        if len(value.get_secret_value()) < 8:
            raise ValueError("Le mot de passe doit contenir au moins 8 caractères.")
        return value

    class Config:
        json_schema_extra = {
            "example": {
                "email": "jean@example.com",
                "mot_de_passe": "MonMotDePasse123!"
            }
        }


class PageAccessCheckRequest(BaseModel):
    """Schema pour verifier si un utilisateur peut acceder a une page."""

    page: str = Field(..., min_length=1, max_length=100, description="Nom de la page cible")

    class Config:
        json_schema_extra = {
            "example": {
                "page": "Employe"
            }
        }


class PageAccessCheckResponse(BaseModel):
    """Schema de reponse pour la verification d'acces a une page."""

    success: bool = Field(description="Indique si l'acces est autorise")


    class Config:
        json_schema_extra = {
            "example": {
                "success": True
            }
        }


# =========================
# RESPONSE SCHEMAS
# =========================


# Ces schémas sont utilisés pour structurer les réponses de l'API, notamment après une inscription ou une connexion réussie.
class UserPublic(BaseModel):
    """Schema publique d'un utilisateur (sans données sensibles)"""
    id: int
    prenom: str
    nom: str
    email: str
    numero_telephone: str | None = None
    role: RoleResponse | None = Field(default=None, description="Rôle de l'utilisateur")
    date_inscription: datetime
    est_actif: bool = Field(default=True, description="Indique si le compte est actif")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "prenom": "Jean",
                "nom": "Jean Dupont",
                "email": "jean@example.com",
                "numero_telephone": "4185551234",
                "role": {
                    "id": 1,
                    "nom": "public"
                },
                "date_inscription": "2026-04-17T10:30:00",
                "est_actif": True
            }
        }

# Schema de réponse pour la connexion, incluant le token JWT et les données utilisateur
class TokenResponse(BaseModel):
    """Schema de réponse avec token JWT"""
    access_token: str
    token_type: str = "bearer"
    user: UserPublic

    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user": {
                    "id": 1,
                    "nom": "Jean Dupont",
                    "email": "jean@example.com",
                    "role": {
                        "id": 1,
                        "nom": "public"
                    },
                    "date_inscription": "2026-04-17 10:30:00",
                    "est_actif": True
                }
            }
        }

# Schema de réponse pour l'inscription, confirmant la création de l'utilisateur
class RegistrationResponse(BaseModel):
    """Schema de réponse après inscription réussie"""
    id: int
    prenom: str
    nom: str
    email: str
    numero_telephone: str | None = None
    role: str
    message: str = "Utilisateur créé avec succès"

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "prenom": "Jean",
                "nom": "Jean Dupont",
                "email": "jean@example.com",
                "numero_telephone": "4185551234",
                "role": "public",
                "message": "Utilisateur créé avec succès"
            }
        }

class PaginatedUsersResponse(BaseModel):
    """Schema de réponse paginée pour les utilisateurs"""
    items: list[UserPublic]
    total: int
    skip: int
    limit: int

class ModifierPasswordRequest(BaseModel):
    """Schema pour modifier le mot de passe d'un utilisateur"""
    ancien_mot_de_passe: SecretStr = Field(..., description="Ancien mot de passe")
    nouveau_mot_de_passe: SecretStr = Field(..., description="Nouveau mot de passe (min 8 caractères)")

    @field_validator("nouveau_mot_de_passe")
    @classmethod
    def validate_new_password(cls, value: SecretStr) -> SecretStr:
        if len(value.get_secret_value()) < 8:
            raise ValueError("Le nouveau mot de passe doit contenir au moins 8 caractères.")
        
        return value