from app.core.auth import get_current_user_id
from sqlalchemy.orm import Session

from app.models.emplacement import Emplacement
from app.models.utilisateur import Utilisateur
from app.schema.Emplacement import EmplacementResponse, UtilisateurReferenceResponse

# ===============================
# CREATE
# ===============================
# Logique de création d'un emplacement, avec possibilité de spécifier l'utilisateur créateur ou de le déduire du token JWT si non spécifié
def create_emplacement(
    db: Session,
    nom: str,
    adresse: str,
    ville: str | None = "Québec",
    province: str | None = "QC",
    code_postal: str | None = None,
    description: str | None = None,
    created_by: int | None = None,
) -> Emplacement:
    emplacement = Emplacement(
        nom=nom,
        adresse=adresse,
        ville=ville,
        province=province,
        code_postal=code_postal,
        description=description,
        created_by=created_by,
    )
    if created_by is None:
        emplacement.created_by = get_current_user_id()
    db.add(emplacement)
    db.commit()
    db.refresh(emplacement)
    return emplacement

# ===============================
# GET
# ===============================
# Logique de recherche d'un emplacement par son ID
def get_emplacement_by_id(db: Session, emplacement_id: int) -> Emplacement | None:
    return db.query(Emplacement).filter(Emplacement.id == emplacement_id).first()

# Logique de recherche de tous les emplacements, triés par ville et nom
def get_all_emplacements(db: Session) -> list[Emplacement]:
    return db.query(Emplacement).order_by(Emplacement.ville, Emplacement.nom).all()
# Logique de recherche de tous les emplacements pour les formulaires, ne retournant que l'ID et le nom, et triés par ville et nom
def get_emplacements_for_form(db: Session) -> list[Emplacement]:
    return (
        db.query(Emplacement.id, Emplacement.nom)
        .filter(Emplacement.deleted_at.is_(None))
        .order_by(Emplacement.ville, Emplacement.nom)
        .all()
    )
# ===============================
# UPDATE
# ===============================
# Logique de mise à jour d'un emplacement, avec possibilité de mettre à jour tous les champs sauf l'ID, et de spécifier un nouvel utilisateur créateur ou de le laisser inchangé si non spécifié
def update_emplacement(
    db: Session,
    emplacement_id: int,
    nom: str | None = None,
    adresse: str | None = None,
    ville: str | None = None,
    province: str | None = None,
    code_postal: str | None = None,
    description: str | None = None,
    created_by: int | None = None,
) -> Emplacement | None:
    emplacement = get_emplacement_by_id(db, emplacement_id)
    if emplacement is None:
        return None

    if nom is not None:
        emplacement.nom = nom
    if adresse is not None:
        emplacement.adresse = adresse
    if ville is not None:
        emplacement.ville = ville
    if province is not None:
        emplacement.province = province
    if code_postal is not None:
        emplacement.code_postal = code_postal
    if description is not None:
        emplacement.description = description
    if created_by is not None:
        emplacement.created_by = created_by

    db.commit()
    db.refresh(emplacement)
    return emplacement

# ===============================
# DELETE
# ===============================
# Logique de suppression d'un emplacement par son ID, avec suppression physique de la base de données
def delete_emplacement(db: Session, emplacement_id: int) -> bool:
    emplacement = get_emplacement_by_id(db, emplacement_id)
    if emplacement is None:
        return False

    db.delete(emplacement)
    db.commit()
    return True

# ===============================
# SERIALIZATION
# ===============================

def serialize_emplacement(db: Session, emplacement: Emplacement) -> EmplacementResponse:
    """Serializie un emplacement en incluant l'utilisateur createur complet au lieu de juste l'ID."""
    created_by_utilisateur = None
    if emplacement.created_by is not None:
        created_by_utilisateur = (
            db.query(Utilisateur)
            .filter(Utilisateur.id == emplacement.created_by)
            .first()
        )

    return EmplacementResponse.model_validate(
        {
            "id": emplacement.id,
            "nom": emplacement.nom,
            "adresse": emplacement.adresse,
            "ville": emplacement.ville,
            "province": emplacement.province,
            "code_postal": emplacement.code_postal,
            "description": emplacement.description,
            "created_by_utilisateur": (
                UtilisateurReferenceResponse.model_validate(
                    {"id": created_by_utilisateur.id, "nom": created_by_utilisateur.nom}
                )
                if created_by_utilisateur is not None
                else None
            ),
            "date_entrer": emplacement.date_entrer,
        }
    )