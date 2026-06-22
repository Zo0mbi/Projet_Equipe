from pydantic import BaseModel, Field
from typing import Literal


# Schema de reference pour un utilisateur proprietaire
class UtilisateurReferenceResponse(BaseModel):
    """Schema de reference pour un utilisateur."""

    id: int = Field(description="ID unique de l'utilisateur")
    nom: str = Field(description="Nom de l'utilisateur")

    class Config:
        from_attributes = True


# Schema de creation d'un vehicule, utilisé pour les requetes POST
class VehiculeCreateRequest(BaseModel):
    """Schema de creation d'un vehicule."""

    numero_plaque: str = Field(..., min_length=2, max_length=20, description="Numero de plaque du vehicule")
    province: str = Field(default="QC", min_length=2, max_length=50, description="Province de la plaque")
    marque: str = Field(..., min_length=1, max_length=50, description="Marque du vehicule")
    modele: str = Field(..., min_length=1, max_length=50, description="Modele du vehicule")
    owner_id: int | None = Field(default=None, ge=1, description="ID du proprietaire du vehicule")

    class Config:
        json_schema_extra = {
            "example": {
                "numero_plaque": "ABC123",
                "province": "QC",
                "marque": "Toyota",
                "modele": "Corolla",
                "owner_id": 1,
            }
        }


# Schema de mise a jour d'un vehicule, utilisé pour les requetes PUT
class VehiculeUpdateRequest(BaseModel):
    """Schema de mise a jour d'un vehicule."""

    numero_plaque: str | None = Field(default=None, min_length=2, max_length=20, description="Numero de plaque du vehicule")
    province: str | None = Field(default=None, min_length=2, max_length=50, description="Province de la plaque")
    marque: str | None = Field(default=None, min_length=1, max_length=50, description="Marque du vehicule")
    modele: str | None = Field(default=None, min_length=1, max_length=50, description="Modele du vehicule")
    owner_id: int | None = Field(default=None, ge=1, description="ID du proprietaire du vehicule")

    class Config:
        json_schema_extra = {
            "example": {
                "numero_plaque": "ABC123",
                "province": "QC",
                "marque": "Toyota",
                "modele": "Corolla",
                "owner_id": 1,
            }
        }


class VehiculeUpsertRequest(BaseModel):
    """Schema pour mettre a jour ou creer un vehicule selon la plaque."""

    numero_plaque: str = Field(..., min_length=2, max_length=20, description="Numero de plaque du vehicule")
    province: str = Field(default="QC", min_length=2, max_length=50, description="Province de la plaque")
    marque: str = Field(..., min_length=1, max_length=50, description="Marque du vehicule")
    modele: str = Field(..., min_length=1, max_length=50, description="Modele du vehicule")
    owner_id: int | None = Field(default=None, ge=1, description="ID du proprietaire du vehicule")

    class Config:
        json_schema_extra = {
            "example": {
                "numero_plaque": "ABC123",
                "province": "QC",
                "marque": "Toyota",
                "modele": "Corolla",
                "owner_id": 1,
            }
        }


# Schema de reponse pour un vehicule avec tous les details
class VehiculeResponse(BaseModel):
    """Schema de reponse complet d'un vehicule."""

    id: int = Field(description="ID unique du vehicule")
    numero_plaque: str = Field(description="Numero de plaque")
    province: str | None = Field(default=None, description="Province de la plaque")
    marque: str | None = Field(default=None, description="Marque du vehicule")
    modele: str | None = Field(default=None, description="Modele du vehicule")
    owner: UtilisateurReferenceResponse | None = Field(default=None, description="Proprietaire du vehicule")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "numero_plaque": "ABC123",
                "province": "QC",
                "marque": "Toyota",
                "modele": "Corolla",
                "owner": {
                    "id": 1,
                    "nom": "Jean Dupont"
                },
            }
        }


# Schema simplifie pour alimenter un select de formulaire
class VehiculeForFormResponse(BaseModel):
    """Schema simplifie pour alimenter un select de formulaire."""

    id: int = Field(description="ID unique du vehicule")
    numero_plaque: str = Field(description="Numero de plaque")
    marque: str | None = Field(default=None, description="Marque du vehicule")
    modele: str | None = Field(default=None, description="Modele du vehicule")

    class Config:
        from_attributes = True


# Schema de reponse pour la liste des vehicules
class VehiculeListResponse(BaseModel):
    """Schema de reponse pour la liste des vehicules."""

    vehicules: list[VehiculeResponse] = Field(description="Liste des vehicules")


class VehiculeUpsertResponse(BaseModel):
    """Schema de reponse pour une creation ou une mise a jour par plaque."""

    action: Literal["created", "updated", "confirmed"] = Field(description="Type d'action effectuee")
    message: str = Field(description="Message de retour pour le client")
    vehicule: VehiculeResponse = Field(description="Vehicule final en base")