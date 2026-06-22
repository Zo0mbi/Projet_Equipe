from datetime import datetime

from pydantic import BaseModel, Field


# Schema de reference pour un utilisateur dans un emplacement
class UtilisateurReferenceResponse(BaseModel):
    """Schema de reference pour un utilisateur."""

    id: int = Field(description="ID unique de l'utilisateur")
    nom: str = Field(description="Nom de l'utilisateur")


# Schema de base pour un emplacement, utilisé pour la creation et la mise a jour
class EmplacementResponse(BaseModel):
    """Schema de reponse pour un emplacement."""

    id: int = Field(description="ID unique de l'emplacement")
    nom: str = Field(description="Nom de l'emplacement")
    adresse: str = Field(description="Adresse complete")
    ville: str | None = Field(default=None, description="Ville")
    province: str | None = Field(default=None, description="Province")
    code_postal: str | None = Field(default=None, description="Code postal")
    description: str | None = Field(default=None, description="Description de l'emplacement")
    created_by_utilisateur: UtilisateurReferenceResponse | None = Field(default=None, description="Utilisateur createur")
    date_entrer: datetime = Field(description="Date de creation")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "nom": "Samson",
                "adresse": "270 rue St-Paul",
                "ville": "Québec",
                "province": "QC",
                "code_postal": "G1K 3W1",
                "description": "Stationnement Samson",
                "created_by_utilisateur": {
                    "id": 1,
                    "nom": "Jean Dupont"
                },
                "date_entrer": "2026-04-24T12:35:00",
            }
        }

# Schema de reponse pour la liste des emplacements, incluant les details complets de chaque emplacement
class EmplacementListResponse(BaseModel):
    emplacements: list[EmplacementResponse] = Field(description="Liste des emplacements")

# Schema de reponse pour alimenter un select de formulaire, ne contenant que l'id et le nom de chaque emplacement
class EmplacementForFormResponse(BaseModel):
    """Schema simplifie pour alimenter un select de formulaire."""

    id: int = Field(description="ID unique de l'emplacement")
    nom: str = Field(description="Nom de l'emplacement")

# Schema de creation d'un emplacement, ne contenant que les champs necessaires pour la creation et les champs optionnels
class EmplacementCreateRequest(BaseModel):
    """Schema de creation d'un emplacement."""

    nom: str = Field(..., min_length=1, max_length=100, description="Nom de l'emplacement")
    adresse: str = Field(..., min_length=1, max_length=255, description="Adresse complete")
    ville: str | None = Field(default=None, max_length=100, description="Ville")
    province: str | None = Field(default=None, min_length=2, max_length=50, description="Province")
    code_postal: str | None = Field(default=None, max_length=20, description="Code postal")
    description: str | None = Field(default=None, max_length=500, description="Description de l'emplacement")

    class Config:
        json_schema_extra = {
            "example": {
                "nom": "Samson",
                "adresse": "270 rue St-Paul",
                "ville": "Québec",
                "province": "QC",
                "code_postal": "G1K 3W1",
                "description": "Stationnement Samson",
            }
        }


class EmplacementUpdateRequest(BaseModel):
    """Schema de mise a jour partielle d'un emplacement."""

    nom: str | None = Field(default=None, min_length=1, max_length=100, description="Nom de l'emplacement")
    adresse: str | None = Field(default=None, min_length=1, max_length=255, description="Adresse complete")
    ville: str | None = Field(default=None, max_length=100, description="Ville")
    province: str | None = Field(default=None, min_length=2, max_length=50, description="Province")
    code_postal: str | None = Field(default=None, max_length=20, description="Code postal")
    description: str | None = Field(default=None, max_length=500, description="Description de l'emplacement")

    class Config:
        json_schema_extra = {
            "example": {
                "nom": "Samson",
                "adresse": "270 rue St-Paul",
                "ville": "Québec",
                "province": "QC",
                "code_postal": "G1K 3W1",
                "description": "Stationnement Samson mis a jour",
            }
        }