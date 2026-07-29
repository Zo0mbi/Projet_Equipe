from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.timezone import now_est_edt
from app.models.contravention import Contravention
from app.models.emplacement import Emplacement
from app.models.raisons_contravention import RaisonContravention
from app.models.utilisateur import Utilisateur
from app.models.vehicule import Vehicule
from app.schema.Contravention import (
    ContraventionCreateRequest,
    ContraventionResponse,
    ContraventionUpdateRequest,
    EmplacementReferenceResponse,
    EmplacementReferenceResponseComplete,
    RaisonContraventionReferenceResponse,
    UtilisateurReferenceResponse,
    VehiculeReferenceResponse,
    VerifierPlaqueResponse,
)
from app.schema.Vehicule import VehiculeUpsertRequest
from app.schema.Log import LogCreate
from app.crud.log import create_log

# Logique de generation du numero de contravention unique et creation de la contravention
# Format du numero de contravention: GES-XXXXXX (X = chiffre)
def generate_unique_contravention_number(db: Session) -> str:
    """Genere un numero de contravention unique du type GES-XXXXXX."""
    prefix = "GES-"
    # Recupere le dernier numero avec le prefix GES- pour incrementer proprement.
    last_contravention = (
        db.query(Contravention.numero_contravention)
        .filter(Contravention.numero_contravention.like(f"{prefix}%"))
        .order_by(Contravention.numero_contravention.desc())
        .first()
    )

    next_number = 1
    if last_contravention:
        suffix = last_contravention[0][len(prefix):]
        if suffix.isdigit():
            next_number = int(suffix) + 1

    # Sanity check pour eviter les collisions en cas de numeros generes en parallele
    for offset in range(1000):
        numero = f"{prefix}{(next_number + offset):06d}"
        exists = (
            db.query(Contravention.id)
            .filter(Contravention.numero_contravention == numero)
            .first()
        )
        if not exists:
            return numero

    raise RuntimeError("Impossible de generer un numero de contravention unique")
# Route pour récupérer un véhicule ou bien le créer si elle n'existe pas déjà, en se basant sur le numéro de plaque et la province. Utile pour éviter les erreurs de formatage de la part du front end et pour simplifier la création de contravention en une seule étape
def get_or_create_vehicle_by_plate(db: Session, payload: ContraventionCreateRequest) -> Vehicule:
    vehicule = (
        db.query(Vehicule)
        .filter(
            Vehicule.numero_plaque == payload.numero_plaque,
            Vehicule.province == payload.province,
        )
        .first()
    )

    if vehicule:
        return vehicule

    vehicule = Vehicule(
        numero_plaque=payload.numero_plaque,
        province=payload.province,
        marque=payload.marque,
        modele=payload.modele,
    )
    db.add(vehicule)
    db.flush()
    return vehicule

# Route cherchant un véhicule existant avec les informations fournies, et le met à jour si les informations sont différentes, ou le crée s'il n'existe pas.
def resolve_vehicle_for_update(db: Session, payload: VehiculeUpsertRequest) -> Vehicule:
    numero_plaque = payload.numero_plaque.strip().upper()
    province = payload.province.strip().upper()
    marque = payload.marque.strip()
    modele = payload.modele.strip()

    vehicule = (
        db.query(Vehicule)
        .filter(
            Vehicule.numero_plaque == numero_plaque,
            Vehicule.province == province,
        )
        .first()
    )

    if vehicule is None:
        vehicule = Vehicule(
            numero_plaque=numero_plaque,
            province=province,
            marque=marque,
            modele=modele,
            owner_id=payload.owner_id,
        )
        db.add(vehicule)
        db.flush()
        return vehicule

    changed = False
    if vehicule.numero_plaque != numero_plaque:
        vehicule.numero_plaque = numero_plaque
        changed = True
    if vehicule.province != province:
        vehicule.province = province
        changed = True
    if vehicule.marque != marque:
        vehicule.marque = marque
        changed = True
    if vehicule.modele != modele:
        vehicule.modele = modele
        changed = True
    if payload.owner_id is not None and vehicule.owner_id != payload.owner_id:
        vehicule.owner_id = payload.owner_id
        changed = True

    if changed:
        db.flush()

    return vehicule

# Logique pour créer une contravention
def create_contravention(db: Session, payload: ContraventionCreateRequest) -> Contravention:
    vehicule = get_or_create_vehicle_by_plate(db, payload)
    numero_contravention = generate_unique_contravention_number(db)
    now = now_est_edt()
    
    date_entree = payload.date_entrer if payload.date_entrer else now

    contravention = Contravention(
        numero_contravention=numero_contravention,
        vehicle_id=vehicule.id,
        attribuer_par=payload.attribuer_par,
        raisons_id=payload.raisons_id,
        raison_custom=payload.raison_custom,
        montant=payload.montant,
        etat_contravention=payload.etat_contravention,
        emplacement_id=payload.emplacement_id,
        date_entrer=payload.date_entrer or now,
        date_modification=now,
    )
    #retirer le T de date_entrer et date_modification pour les rendre plus lisibles dans la base de données
    if isinstance(contravention.date_entrer, str):
        contravention.date_entrer = contravention.date_entrer.replace("T", " ")
    if isinstance(contravention.date_modification, str):
        contravention.date_modification = contravention.date_modification.replace("T", " ")

    db.add(contravention)
    db.flush()
    db.commit()
    return contravention

# Verifier si le vehicule existe deja, sinon le creer, puis creer la contravention associee
# Retourner les informations du vehicules pour eviter au front end de devoir faire une requete supplementaire pour afficher les details du vehicule apres la creation de la contravention
# Retourner les count d'avertissement et d'impayee pour le vehicule pour permettre au front end d'afficher les alertes appropriees
def verifier_plaque(db: Session, numero_plaque: str, province: str) -> VerifierPlaqueResponse | None:
    plaque_normalisee = numero_plaque.strip().upper()
    province_normalisee = province.strip().upper()

    vehicule = (
        db.query(Vehicule)
        .filter(
            Vehicule.numero_plaque == plaque_normalisee,
            Vehicule.province == province_normalisee,
        )
        .first()
    )

    if vehicule is None:
        return None

    count_impayee = (
        db.query(func.count(Contravention.id))
        .filter(
            Contravention.vehicle_id == vehicule.id,
            Contravention.etat_contravention == "impayee",
        )
        .scalar()
        or 0
    )

    count_avertissement = (
        db.query(func.count(Contravention.id))
        .filter(
            Contravention.vehicle_id == vehicule.id,
            Contravention.etat_contravention == "avertissement",
        )
        .scalar()
        or 0
    )

    return VerifierPlaqueResponse(
        numero_plaque=vehicule.numero_plaque,
        marque=vehicule.marque,
        modele=vehicule.modele,
        province=vehicule.province or province_normalisee,
        count_impayee=count_impayee,
        count_avertissement=count_avertissement,
    )


def get_contravention_by_id(db: Session, contravention_id: int) -> Contravention | None:
    return db.query(Contravention).filter(Contravention.id == contravention_id).first()

def get_contravention_by_numero(db: Session, numero_contravention: str) -> Contravention | None:
    return db.query(Contravention).filter(Contravention.numero_contravention == numero_contravention).first()

def get_contravention_by_id(db: Session, contravention_id: int) -> Contravention | None:
    return db.query(Contravention).filter(Contravention.id == contravention_id).first()

#Méthode de sérialisation d'une contravention en incluant les informations liées comme le véhicule, l'employé qui a attribué la contravention,
# l'emplacement et la raison de la contravention.
def serialize_contravention(db: Session, contravention: Contravention) -> ContraventionResponse:
    vehicule = (
        db.query(Vehicule)
        .filter(Vehicule.id == contravention.vehicle_id)
        .first()
    )

    attribuer_par_utilisateur = (
        db.query(Utilisateur)
        .filter(Utilisateur.id == contravention.attribuer_par)
        .first()
    )

    emplacement = (
        db.query(Emplacement)
        .filter(Emplacement.id == contravention.emplacement_id)
        .first()
    )

    raison_contravention = None
    if contravention.raisons_id is not None:
        raison_contravention = (
            db.query(RaisonContravention)
            .filter(RaisonContravention.id == contravention.raisons_id)
            .first()
        )

    return ContraventionResponse.model_validate(
        {
            "numero_contravention": contravention.numero_contravention,
            "raison_custom": contravention.raison_custom,
            "montant": contravention.montant,
            "etat_contravention": contravention.etat_contravention,
            "vehicule": (
                VehiculeReferenceResponse.model_validate(
                    {
                        "numero_plaque": vehicule.numero_plaque,
                        "province": vehicule.province,
                        "marque": vehicule.marque,
                        "modele": vehicule.modele,
                    }
                )
                if vehicule is not None
                else None
            ),
            "attribuer_par_utilisateur": (
                UtilisateurReferenceResponse.model_validate(
                    {"nom": attribuer_par_utilisateur.nom, "prenom": attribuer_par_utilisateur.prenom}
                )
                if attribuer_par_utilisateur is not None
                else None
            ),
            "emplacement": (
                EmplacementReferenceResponseComplete.model_validate(
                    {
                    "nom": emplacement.nom,
                    "adresse": emplacement.adresse,
                    "ville": emplacement.ville,
                    "province": emplacement.province,
                    "code_postal": emplacement.code_postal
                    }
                )
                if emplacement is not None
                else None
            ),
            "raison_contravention": (
                RaisonContraventionReferenceResponse.model_validate(
                    {"nom": raison_contravention.nom}
                )
                if raison_contravention is not None
                else None
            ),
            "date_entrer": contravention.date_entrer,
            "date_modification": contravention.date_modification,
            "modifier_par": contravention.modifier_par,
        }
    )
# Logique de recherche de contraventions par numero de plaque et province, en normalisant les inputs pour eviter les erreurs de formatage
def get_contravention_by_plaque(db: Session, numero_plaque: str, province: str) -> list[Contravention] | None:
    plaque_normalisee = numero_plaque.strip().upper()
    if province is None:
        province_normalisee = "QC"
    else:
        province_normalisee = province.strip().upper()

    vehicule = (
        db.query(Vehicule)
        .filter(
            Vehicule.numero_plaque == plaque_normalisee,
            Vehicule.province == province_normalisee,
        )
        .first()
    )

    if not vehicule:
        return None

    return (
        db.query(Contravention)
        .filter(Contravention.vehicle_id == vehicule.id)
        .order_by(Contravention.date_entrer.desc())
        .all()
    )
# Logique de recherche des 5 dernières contraventions attribuées par un employé donné, triées par date d'entrée décroissante
def get_recent_contravention_by_employe(db: Session, employe_id: int) -> list[Contravention] | None:
    return (
        db.query(Contravention)
        .filter(Contravention.attribuer_par == employe_id)
        .order_by(Contravention.date_entrer.desc())
        .limit(5)
        .all()
    )
# Logique de recherche de toutes les contraventions associées aux véhicules d'un utilisateur donné, triées par date d'entrée décroissante
def get_contraventions_by_user(db: Session, user_id: int) -> list[Contravention] | None:
    # On suppose que les utilisateurs sont proprietaires de vehicules, et on cherche les contraventions associees a leurs vehicules
    contraventions = (
        db.query(Contravention)
        .join(Vehicule, Contravention.vehicle_id == Vehicule.id)
        .filter(Vehicule.owner_id == user_id)
        .order_by(Contravention.date_entrer.desc())
        .all()
    )
    return contraventions

# Logique de mise a jours d'une contravention, avec verification des permissions de l'employe qui effectue la modification
def update_contravention(
    db: Session,
    contravention_id: int,
    contravention_data: dict,
    received_fields: set[str] | None = None,
    modifier_par: int | None = None,
) -> Contravention | None:
    contravention = get_contravention_by_id(db, contravention_id)
    if not contravention:
        return None
    # Champs autorisés à la mise à jour
    if received_fields is not None:
        allowed_fields = {
            "vehicle_id",
            "vehicule",
            "attribuer_par",
            "raisons_id",
            "raison_custom",
            "montant",
            "etat_contravention",
            "emplacement_id",
            "commentaire_admin",
        }

    # On ne met à jour que les champs présents dans contravention_data et qui sont autorisés
    update_data = {}
    for key, value in contravention_data.items():
        if key not in allowed_fields:
            continue # Ignorer les champs qui ne sont pas autorisés à la mise à jour Donc je men sacre
        if received_fields is not None and key not in received_fields:
            continue
        update_data[key] = value

    if not update_data:
        raise ValueError("Au moins un champ valide doit etre fourni pour la mise a jour")

    has_vehicule = "vehicule" in update_data
    has_vehicle_id = "vehicle_id" in update_data
    vehicule_payload = update_data.pop("vehicule", None)
    vehicle_id = update_data.pop("vehicle_id", None)
    # SANITY CHECK ma peter ma coche
    if has_vehicule:
        if vehicule_payload is None:
            raise ValueError("vehicule invalide")
        if not isinstance(vehicule_payload, dict):
            raise ValueError("vehicule invalide")
        vehicule = resolve_vehicle_for_update(db, VehiculeUpsertRequest.model_validate(vehicule_payload))
        if vehicle_id is not None and vehicle_id != vehicule.id:
            raise ValueError("vehicle_id ne correspond pas au vehicule fourni")
        update_data["vehicle_id"] = vehicule.id
    elif has_vehicle_id:
        if vehicle_id is None:
            raise ValueError("Vehicule invalide")
        vehicule = db.query(Vehicule).filter(Vehicule.id == vehicle_id).first()
        if vehicule is None:
            raise ValueError("Vehicule invalide")
        update_data["vehicle_id"] = vehicle_id

    # SANITY CHECK PARCE JE NE TRUST PAS LE FRONT END (ノಠ益ಠ)ノ彡┻━┻
    # THey mess it up once. They mess it up twice. They mess it up 10 times. I am not taking any chances.
    if "raison_custom" in update_data:
        if not update_data["raison_custom"].strip():
            raise ValueError("Raison custom ne peut pas être vide si fournie")
        update_data["raisons_id"] = None  # Si une raison custom est fournie, on ignore la raison standard

    if "emplacement_id" in update_data:
        emplacement = db.query(Emplacement).filter(Emplacement.id == update_data["emplacement_id"]).first()
        if emplacement is None:
            raise ValueError("Emplacement invalide")

    if "vehicle_id" in update_data:
        vehicule = db.query(Vehicule).filter(Vehicule.id == update_data["vehicle_id"]).first()
        if vehicule is None:
            raise ValueError("Vehicule invalide")

    if "attribuer_par" in update_data:
        utilisateur = db.query(Utilisateur).filter(Utilisateur.id == update_data["attribuer_par"]).first()
        if utilisateur is None:
            raise ValueError("Utilisateur attributaire invalide")

    if "raisons_id" in update_data and update_data["raisons_id"] is not None:
        raison = db.query(RaisonContravention).filter(RaisonContravention.id == update_data["raisons_id"]).first()
        if raison is None and update_data["raisons_id"] is None:
            raise ValueError("Raison de contravention invalide")

    for key, value in update_data.items():
        if hasattr(contravention, key):
            setattr(contravention, key, value)
    contravention.modifier_par = modifier_par if modifier_par is not None else contravention.modifier_par
    contravention.date_modification = now_est_edt()
    db.commit()
    db.refresh(contravention)
    return contravention