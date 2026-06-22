from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.raisons_contravention import RaisonContravention

# ===============================
# CREATE
# ===============================

def create_raison_contravention(
    db: Session,
    nom: str,
    description: str | None = None,
    montant: Decimal = Decimal("30.00"),
) -> RaisonContravention:
    raison = RaisonContravention(
        nom=nom,
        description=description,
        montant=montant,
    )

    db.add(raison)
    db.commit()
    db.refresh(raison)
    return raison

# ===============================
# GET
# ===============================

def get_raison_contravention_by_id(db: Session, raison_id: int) -> RaisonContravention | None:
    return db.query(RaisonContravention).filter(RaisonContravention.id == raison_id).first()


def get_all_raisons_contravention(db: Session) -> list[RaisonContravention]:
    return db.query(RaisonContravention).order_by(RaisonContravention.nom).all()

def get_raisons_contravention_for_form(db: Session) -> list[RaisonContravention]:
    return (
        db.query(RaisonContravention.id, RaisonContravention.nom, RaisonContravention.montant)
        .filter(RaisonContravention.deleted_at.is_(None))
        .order_by(RaisonContravention.nom)
        .all()
    )

# ===============================
# UPDATE
# ===============================

def update_raison_contravention(
    db: Session,
    raison_id: int,
    nom: str | None = None,
    description: str | None = None,
    montant: Decimal | None = None,
) -> RaisonContravention | None:
    raison = get_raison_contravention_by_id(db, raison_id)
    if raison is None:
        return None

    if nom is not None:
        raison.nom = nom
    if description is not None:
        raison.description = description
    if montant is not None:
        raison.montant = montant

    db.commit()
    db.refresh(raison)
    return raison

# ===============================
# DELETE
# ===============================

def delete_raison_contravention(db: Session, raison_id: int) -> bool:
    raison = get_raison_contravention_by_id(db, raison_id)
    if raison is None:
        return False

    db.delete(raison)
    db.commit()
    return True
