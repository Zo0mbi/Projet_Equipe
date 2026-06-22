from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.vehicule import Vehicule


def get_vehicule_by_owner(db: Session, owner_id: int) -> list[Vehicule]:
    return db.query(Vehicule).filter(Vehicule.owner_id == owner_id).all()


def get_vehicule_by_plate(db: Session, numero_plaque: str) -> Vehicule | None:
    normalized_plate = numero_plaque.strip().upper()
    return db.query(Vehicule).filter(Vehicule.numero_plaque == normalized_plate).first()


def create_vehicule(
    db: Session,
    numero_plaque: str,
    marque: str,
    modele: str,
    province: str,
    owner_id: int | None = None,
) -> Vehicule:
    vehicule = Vehicule(
        numero_plaque=numero_plaque.strip().upper(),
        marque=marque.strip(),
        modele=modele.strip(),
        province=province.strip().upper(),
        owner_id=owner_id,
    )

    db.add(vehicule)
    db.commit()
    db.refresh(vehicule)
    return vehicule

# Logique de mise à jour d'un véhicule, avec possibilité de mettre à jour tous les champs sauf l'ID, et de spécifier un nouvel utilisateur propriétaire ou de le laisser inchangé si non spécifié
def upsert_vehicule_by_plate(
    db: Session,
    numero_plaque: str,
    marque: str,
    modele: str,
    province: str,
    owner_id: int | None = None,
) -> tuple[Vehicule, str]:
    normalized_plate = numero_plaque.strip().upper()
    normalized_province = province.strip().upper()
    normalized_marque = marque.strip()
    normalized_modele = modele.strip()
    
    vehicule = get_vehicule_by_plate(db, normalized_plate)
    if vehicule is None:
        vehicule = Vehicule(
            numero_plaque=normalized_plate,
            marque=normalized_marque,
            modele=normalized_modele,
            province=normalized_province,
            owner_id=owner_id,
        )
        db.add(vehicule)
        db.commit()
        db.refresh(vehicule)
        return vehicule, "created"

    changed = False
    if vehicule.province != normalized_province:
        vehicule.province = normalized_province
        changed = True
    if vehicule.marque != normalized_marque:
        vehicule.marque = normalized_marque
        changed = True
    if vehicule.modele != normalized_modele:
        vehicule.modele = normalized_modele
        changed = True
    if owner_id is not None and vehicule.owner_id != owner_id:
        vehicule.owner_id = owner_id
        changed = True

    db.commit()
    db.refresh(vehicule)
    return vehicule, "updated" if changed else "confirmed"