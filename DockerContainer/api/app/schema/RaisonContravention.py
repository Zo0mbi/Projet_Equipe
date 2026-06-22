from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class RaisonContraventionCreateRequest(BaseModel):
    """Schema de creation d'une raison de contravention."""

    nom: str = Field(..., min_length=1, max_length=100, description="Nom de la raison")
    description: str | None = Field(default=None, max_length=1000, description="Description de la raison")
    montant: Decimal = Field(default=Decimal("30.00"), ge=0, description="Montant associe a la raison")

    class Config:
        json_schema_extra = {
            "example": {
                "nom": "Stationnement interdit",
                "description": "Vehicule stationne dans une zone interdite.",
                "montant": "30.00",
            }
        }


class RaisonContraventionUpdateRequest(BaseModel):
    """Schema de mise a jour partielle d'une raison de contravention."""

    nom: str | None = Field(default=None, min_length=1, max_length=100, description="Nom de la raison")
    description: str | None = Field(default=None, max_length=1000, description="Description de la raison")
    montant: Decimal | None = Field(default=None, ge=0, description="Montant associe a la raison")

    class Config:
        json_schema_extra = {
            "example": {
                "nom": "Stationnement interdit",
                "description": "Vehicule stationne dans une zone interdite et mise a jour.",
                "montant": "45.00",
            }
        }

# Schema de base pour une raison de contravention, utilisé pour la creation et la mise a jour
class RaisonContraventionResponse(BaseModel):
    """Schema de reponse pour une raison de contravention."""

    id: int = Field(description="ID unique de la raison")
    nom: str = Field(description="Nom de la raison")
    description: str | None = Field(default=None, description="Description de la raison")
    montant: Decimal = Field(description="Montant associe a la raison")
    date_entrer: datetime = Field(description="Date de creation")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "nom": "Frais de stationnement non acquitte",
                "description": "Le vehicule etait stationne sans paiement valide.",
                "montant": "30.00",
                "date_entrer": "2026-04-24T12:35:00",
            }
        }

# Schema de reponse pour la liste des raisons de contravention, incluant les details complets de chaque raison
class RaisonContraventionListResponse(BaseModel):
    raisons_contravention: list[RaisonContraventionResponse] = Field(
        description="Liste des raisons de contravention"
    )

# Schema de reponse pour alimenter un select de formulaire, ne contenant que l'id et le nom de chaque raison
class RaisonContraventionForFormResponse(BaseModel):
    """Schema simplifie pour alimenter un select de formulaire."""

    id: int = Field(description="ID unique de la raison")
    nom: str = Field(description="Nom de la raison")
    montant: Decimal = Field(description="Montant associe a la raison")