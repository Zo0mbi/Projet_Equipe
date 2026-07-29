from datetime import datetime
from decimal import Decimal
from typing import Literal
from app.core.timezone import now_est_edt
from app.schema.Vehicule import VehiculeUpsertRequest
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


EtatContravention = Literal["impayee", "payee", "contestee", "annulee", "avertissement"]
code_province = Literal["QC", "ON", "NB", "NS", "PE", "NL", "MB", "SK", "AB", "BC", "YT", "NT", "NU", "Autre"]

# Importation des schemas de reference pour les relations
class EmplacementReferenceResponse(BaseModel):
    """Schema de reference pour un emplacement."""

    nom: str = Field(description="Nom de l'emplacement")
    adresse: str = Field(description="Adresse de l'emplacement")

class EmplacementReferenceResponseComplete(BaseModel):
    """Schema de reference pour un emplacement."""

    nom: str = Field(description="Nom de l'emplacement")
    adresse: str = Field(description="Adresse de l'emplacement")
    ville: str | None = Field(default=None, description="Ville de l'emplacement")
    province: code_province | None = Field(default=None, description="Province de l'emplacement")
    code_postal: str | None = Field(default=None, description="Code postal de l'emplacement")

# Schema de reference pour une raison de contravention
class RaisonContraventionReferenceResponse(BaseModel):
    """Schema de reference pour une raison de contravention."""

    nom: str = Field(description="Nom de la raison")

# Schema de reference pour un vehicule
class VehiculeReferenceResponse(BaseModel):
    """Schema de reference pour un vehicule."""

    numero_plaque: str = Field(description="Numero de plaque")
    province: code_province | None = Field(default=None, description="Province de la plaque")
    marque: str | None = Field(default=None, description="Marque du vehicule")
    modele: str | None = Field(default=None, description="Modele du vehicule")

# Schema de reference pour un utilisateur
class UtilisateurReferenceResponse(BaseModel):
    """Schema de reference pour un utilisateur."""
    prenom: str = Field(description="Prenom de l'utilisateur")
    nom: str = Field(description="Nom de l'utilisateur")

# Schema de creation d'une contravention, utilise pour les requetes POST
class ContraventionCreateRequest(BaseModel):
    """Schema de creation d'une contravention."""

    numero_plaque: str = Field(..., min_length=2, max_length=20, description="Numero de plaque du vehicule")
    province: code_province = Field(default="QC", description="Province de la plaque")
    marque: str = Field(..., min_length=1, max_length=50, description="Marque du vehicule")
    modele: str = Field(..., min_length=1, max_length=50, description="Modele du vehicule")
    attribuer_par: int = Field(..., ge=1, description="ID de l'utilisateur qui attribue la contravention")
    raisons_id: int | None = Field(default=None, ge=1, description="ID d'une raison predefinie")
    raison_custom: str | None = Field(default=None, max_length=2000, description="Raison personnalisee si raisons_id est absent")
    montant: Decimal = Field(default=Decimal("30.00"), ge=0, description="Montant de la contravention")
    etat_contravention: EtatContravention = Field(default="impayee", description="Etat de la contravention")
    emplacement_id: int = Field(..., ge=1, description="ID de l'emplacement")
    date_entrer: datetime | None = Field(default=None, description="Date et heure de la contravention")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "numero_plaque": "ABC123",
                "province": "QC",
                "marque": "Toyota",
                "modele": "Corolla",
                "attribuer_par": 4,
                "raisons_id": 1,
                "raison_custom": None,
                "montant": "30.00",
                "etat_contravention": "impayee",
                "emplacement_id": 1,
                "date_entrer": "2026-04-24T12:35:00",
            }
        }

    @field_validator("numero_plaque", "province", "marque", "modele", mode="before")
    @classmethod
    def strip_string_fields(cls, value):
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("numero_plaque")
    @classmethod
    def normalize_numero_plaque(cls, value: str) -> str:
        return value.upper()

    @field_validator("province")
    @classmethod
    def normalize_province(cls, value: str) -> str:
        if value is not None and isinstance(value, str):
            value = value.strip().upper()
            if value in code_province.__args__:
                return value

    @field_validator("raison_custom", mode="before")
    @classmethod
    def normalize_raison_custom(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value
    
    @field_validator("date_entrer", mode="before")
    @classmethod
    def normalize_date_entrer(cls, value):
        if isinstance(value, str):
            #Transformer la date de format ISO 8601 en datetime
            try:
                return datetime.fromisoformat(value)
            except ValueError:
                #si erreur de format, retourner la date actuelle pour eviter les erreurs de validation
                return now_est_edt()
        if isinstance(value, datetime):
            return value

    @model_validator(mode="after")
    def validate_reason_fields(self):
        has_reason_id = self.raisons_id is not None
        has_custom_reason = self.raison_custom is not None
        if not has_reason_id and not has_custom_reason:
            raise ValueError("raisons_id ou raison_custom est requis")
        return self

# Schema de mise a jour d'une contravention
class ContraventionUpdateRequest(BaseModel):
    """Schema de mise à jour d'une contravention."""

    raisons_id: int | None = Field(default=None, ge=1, description="ID d'une raison prédéfinie")
    raison_custom: str | None = Field(default=None, max_length=2000, description="Raison personnalisée")
    montant: Decimal | None = Field(default=None, ge=0, description="Montant de la contravention")
    emplacement_id: int | None = Field(default=None, ge=1, description="ID de l'emplacement")

    @model_validator(mode="after")
    def validate_at_least_one_field(self):
        fields = [self.raisons_id, self.raison_custom, self.montant, self.emplacement_id]
        if all(f is None for f in fields):
            raise ValueError("Au moins un champ doit être fourni pour la mise à jour")
        return self

# Schema de mise a jour d'une contravention, utilise pour les requetes PUT
class ContraventionResponse(BaseModel):
    """Schema de reponse d'une contravention."""

    numero_contravention: str = Field(description="Numero unique de contravention genere par le backend")
    raison_custom: str | None = Field(default=None, description="Raison personnalisee")
    montant: Decimal = Field(description="Montant de la contravention")
    etat_contravention: EtatContravention = Field(description="Etat courant de la contravention")
    vehicule: VehiculeReferenceResponse | None = Field(default=None, description="Details du vehicule")
    attribuer_par_utilisateur: UtilisateurReferenceResponse | None = Field(
        default=None,
        description="Details de l'utilisateur ayant attribue la contravention",
    )
    emplacement: EmplacementReferenceResponseComplete | None = Field(default=None, description="Details de l'emplacement",)
    raison_contravention: RaisonContraventionReferenceResponse | None = Field(
        default=None,
        description="Details de la raison de contravention",
    )
    modifier_par_utilisateur: UtilisateurReferenceResponse | None = Field(
        default=None,
        description="Details du dernier utilisateur ayant modifie",
    )
    date_entrer: datetime = Field(description="Date de creation")
    date_modification: datetime = Field(description="Date de derniere modification")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "numero_contravention": "GES-000012",
                "raison_custom": None,
                "montant": "30.00",
                "etat_contravention": "impayee",
                "vehicule": {
                    "numero_plaque": "ABC123",
                    "province": "QC",
                    "marque": "Toyota",
                    "modele": "Corolla",
                },
                "attribuer_par_utilisateur": {
                    "prenom": "Jean",
                    "nom": "Dupont",
                },
                "emplacement": {
                    "nom": "Stationnement Samson",
                    "adresse": "270 rue St-Paul",
                },
                "raison_contravention": {
                    "nom": "Stationnement interdit",
                },
                "modifier_par_utilisateur": None,
                "date_entrer": "2026-04-24T12:35:00",
                "date_modification": "2026-04-24T12:35:00",
            }
        }

# Schema de reponse pour la verification d'une plaque, retourne les details du vehicule et le nombre de contraventions impayees associees a cette plaque
class VerifierPlaqueResponse(BaseModel):
    """Schema de reponse pour la verification d'une plaque."""

    numero_plaque: str = Field(description="Numero de plaque")
    marque: str | None = Field(default=None, description="Marque du vehicule")
    modele: str | None = Field(default=None, description="Modele du vehicule")
    province: str = Field(description="Province de la plaque")
    count_impayee: int = Field(description="Nombre de contraventions impayees")
    count_avertissement: int = Field(description="Nombre d'avertissements")

    class Config:
        json_schema_extra = {
            "example": {
                "numero_plaque": "ABC123",
                "marque": "Toyota",
                "modele": "Corolla",
                "province": "QC",
                "count_impayee": 2,
                "count_avertissement": 1,
            }
        }

# Schema de reponse pour la liste des contraventions, incluant les details complets de chaque contravention
class ContraventionListResponse(BaseModel):
    contraventions: list[ContraventionResponse] = Field(description="Liste de toutes les contraventions")
    
# Schema de mise a jour partielle d'une contravention
class UpdateContraventionRequest(BaseModel):
    """Schema de mise a jour partielle d'une contravention."""

    vehicle_id: int | None = Field(default=None, ge=1, description="ID du vehicule")
    vehicule: VehiculeUpsertRequest | None = Field(
        default=None,
        description="Details du vehicule a verifier ou mettre a jour",
    )
    attribuer_par: int | None = Field(default=None, ge=1, description="ID de l'utilisateur attributaire")
    raisons_id: int | None = Field(default=None, ge=1, description="ID de la raison de contravention")
    raison_custom: str | None = Field(default=None, description="Raison personnalisee")
    montant: Decimal | None = Field(default=None, ge=0, description="Montant de la contravention")
    etat_contravention: EtatContravention | None = Field(default=None, description="Etat de la contravention")
    emplacement_id: int | None = Field(default=None, ge=1, description="ID de l'emplacement")

    @field_validator("raison_custom", mode="before")
    @classmethod
    def normalize_raison_custom(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value

    @model_validator(mode="after")
    def validate_at_least_one_field(self):
        update_fields = (
            self.vehicle_id,
            self.vehicule,
            self.attribuer_par,
            self.raisons_id,
            self.raison_custom,
            self.montant,
            self.etat_contravention,
            self.emplacement_id,
        )
        if all(value is None for value in update_fields):
            raise ValueError("Au moins un champ doit etre fourni pour mettre a jour la contravention")
        return self

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "vehicle_id": 12,
                "vehicule": {
                    "numero_plaque": "ABC123",
                    "province": "QC",
                    "marque": "Toyota",
                    "modele": "Corolla",
                },
                "attribuer_par": 4,
                "raisons_id": 3,
                "raison_custom": "Stationnement interdit - zone de demenagement",
                "montant": "50.00",
                "etat_contravention": "impayee",
                "emplacement_id": 2,
            }
        }
    class ValidationErrorResponse(BaseModel):
        error: str = Field(description="Message d'erreur en cas de validation echouee")

# Schema de mise a jour de l'etat d'une contravention
class ContraventionEtatUpdateRequest(BaseModel):
    """Schema de mise a jour de l'etat d'une contravention."""

    new_etat: EtatContravention = Field(description="Nouvel etat de la contravention")

    class Config:
        json_schema_extra = {
            "example": {
                "new_etat": "payee",
            }
        }

# Schema de mise a jour du commentaire admin d'une contravention
class ContraventionCommentaireAdminUpdateRequest(BaseModel):
    """Schema de mise a jour du commentaire admin d'une contravention."""

    commentaire_admin: str | None = Field(default=None, description="Commentaire admin")

    class Config:
        json_schema_extra = {
            "example": {
                "commentaire_admin": "Contravention contestée par le propriétaire du véhicule.",
            }
        }


class ContraventionAdminResponse(BaseModel):
    """Schema de reponse d'une contravention pour l'admin."""

    numero_contravention: str = Field(description="Numero unique de contravention genere par le backend")
    raison_custom: str | None = Field(default=None, description="Raison personnalisee")
    montant: Decimal = Field(description="Montant de la contravention")
    etat_contravention: EtatContravention = Field(description="Etat courant de la contravention")
    vehicule: VehiculeReferenceResponse | None = Field(default=None, description="Details du vehicule")
    attribuer_par_utilisateur: UtilisateurReferenceResponse | None = Field(
        default=None,
        description="Details de l'utilisateur ayant attribue la contravention",
    )
    emplacement: EmplacementReferenceResponseComplete | None = Field(default=None, description="Details de l'emplacement",)
    raison_contravention: RaisonContraventionReferenceResponse | None = Field(
        default=None,
        description="Details de la raison de contravention",
    )
    modifier_par_utilisateur: UtilisateurReferenceResponse | None = Field(
        default=None,
        description="Details du dernier utilisateur ayant modifie",
    )
    date_entrer: datetime = Field(description="Date de creation")
    date_modification: datetime = Field(description="Date de derniere modification")
    commentaire_admin: str | None = Field(default=None, description="Commentaire admin")

    class Config:
        from_attributes = True

class ContraventionAdminListResponse(BaseModel):
    contraventions: list[ContraventionAdminResponse] = Field(description="Liste de toutes les contraventions pour l'admin")

class CommentaireAdminUpdate(BaseModel):
    """Schema de mise a jour du commentaire admin d'une contravention."""

    commentaire_admin: str | None = Field(default=None, description="Commentaire admin")

    class Config:
        json_schema_extra = {
            "example": {
                "commentaire_admin": "Contravention contestée par le propriétaire du véhicule.",
            }
        }