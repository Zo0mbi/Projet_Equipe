from datetime import datetime, timedelta

from sqlalchemy import case, func
from sqlalchemy.orm import Session, joinedload

from app.core.timezone import now_est_edt
from app.models.utilisateur import Utilisateur
from app.models.contravention import Contravention
from app.models.vehicule import Vehicule
from app.models.raisons_contravention import RaisonContravention
from app.models.emplacement import Emplacement

# ============ Utilisateur ROLE OPERATIONS ============
# Modifier le rôle d'un utilisateur
def update_Utilisateur_role(db: Session, Utilisateur_id: int, new_role: str):
    """Modifier le rôle d'un utilisateur"""
    try:
        user = db.query(Utilisateur).filter(Utilisateur.id == Utilisateur_id).first()
        if user is None:
            return None

        user.role_id = new_role
        db.commit()
        db.refresh(user)
        return user
    except Exception as e:
        db.rollback()
        return {"error": f"Erreur lors de la modification du rôle: {str(e)}"}
# Activer ou désactiver un utilisateur
def crud_update_user_actif(db: Session, Utilisateur_id: int):
    """Activer ou désactiver un utilisateur"""
    try:
        user = db.query(Utilisateur).filter(Utilisateur.id == Utilisateur_id).first()
        if user is None:
            return None
        # Flip the est_actif status
        if user.est_actif == None:
            user.est_actif = True
        user.est_actif = not user.est_actif
        if user.est_actif == False:
            user.email = f"desactive_{user.id}_{user.email}"
            user.role_id = None  # Retirer les rôles pour éviter tout accès
        if user.est_actif == True:
            user.email = user.email.replace(f"desactive_{user.id}_", "", 1) 
            user.role_id = 1
        db.commit()
        db.refresh(user)
        return user
    except Exception as e:
        db.rollback()
        return {"error": f"Erreur lors de la modification de l'état actif: {str(e)}"}
# Récupérer tous les utilisateurs avec pagination du plus recent au plus ancien
def get_all_Utilisateurs(db: Session, skip: int = 0, limit: int = 100):
    """Récupérer tous les utilisateurs avec pagination"""
    try:
        Utilisateurs = (
            db.query(Utilisateur)
            .options(joinedload(Utilisateur.role))
            .order_by(Utilisateur.id.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return Utilisateurs
    except Exception as e:
        return {"error": f"Erreur lors de la récupération des utilisateurs: {str(e)}"}

# Faire un soft delete d'un utilisateur en le désactivant et en modifiant son email pour éviter les conflits futurs
def delete_Utilisateur(db: Session, Utilisateur_id: int):
    """Désactiver un utilisateur au lieu de le supprimer physiquement"""
    try:
        user = db.query(Utilisateur).filter(Utilisateur.id == Utilisateur_id).first()
        if user is None:
            return None
        if user.est_actif == False:
            return {"message": "Utilisateur déjà désactivé", "Utilisateur_id": Utilisateur_id, "est_actif": user.est_actif}

        user.est_actif = False
        user.email = f"desactive_{user.id}_{user.email}"
        user.role_id = None  # Retirer les rôles pour éviter tout accès
        db.commit()
        db.refresh(user)
        return {"message": "Utilisateur désactivé avec succès", "Utilisateur_id": Utilisateur_id, "est_actif": user.est_actif}
    except Exception as e:
        db.rollback()
        return {"error": f"Erreur lors de la suppression: {str(e)}"}


# ============ CONTRAVENTIONS OPERATIONS ============
# Modifier les informations d'une contravention
def update_contravention(db: Session, contravention_id: int, update_data: dict):
    """Modifier une contravention"""
    try:
        contravention = db.query(Contravention).filter(Contravention.id == contravention_id).first()
        if contravention is None:
            return None

        for key, value in update_data.items():
            if value is not None and hasattr(contravention, key):
                setattr(contravention, key, value)

        db.commit()
        db.refresh(contravention)
        return contravention
    except Exception as e:
        db.rollback()
        return {"error": f"Erreur lors de la modification: {str(e)}"}

# Supprimer une contravention
def delete_contravention(db: Session, contravention_id: int):
    """Supprimer une contravention"""
    try:
        stmt = db.query(Contravention).where(Contravention.id == contravention_id)
        db.execute(stmt)
        db.commit()
        return {"message": "Contravention supprimée avec succès", "contravention_id": contravention_id}
    except Exception as e:
        db.rollback()
        return {"error": f"Erreur lors de la suppression: {str(e)}"}

# Récupérer toutes les contraventions avec pagination du plus recent au plus ancien
def get_all_contraventions(db: Session, skip: int = 0, limit: int = 100):
    """Récupérer toutes les contraventions avec pagination"""
    try:
        contraventions = db.query(Contravention).order_by(Contravention.id.desc()).offset(skip).limit(limit).all()
        return contraventions
    except Exception as e:
        return {"error": f"Erreur lors de la récupération: {str(e)}"}

# ============ GET STATISTICS ============
def get_admin_stats(db: Session):
    """Retourne les statistiques principales pour le tableau de bord admin."""
    try:
        now = now_est_edt()
        start_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        start_7_days = start_today - timedelta(days=6)
        start_month = start_today.replace(day=1)
        next_month = (
            start_month.replace(year=start_month.year + 1, month=1)
            if start_month.month == 12
            else start_month.replace(month=start_month.month + 1)
        )

        total_contraventions = db.query(func.count(Contravention.id)).scalar() or 0

        contraventions_aujourdhui = (
            db.query(func.count(Contravention.id))
            .filter(
                Contravention.date_entrer >= start_today,
                Contravention.date_entrer < start_today + timedelta(days=1),
            )
            .scalar()
            or 0
        )

        contraventions_7_derniers_jours = (
            db.query(func.count(Contravention.id))
            .filter(
                Contravention.date_entrer >= start_7_days,
                Contravention.date_entrer < start_today + timedelta(days=1),
            )
            .scalar()
            or 0
        )

        leaderboard_rows = (
            db.query(
                Utilisateur.id.label("agent_id"),
                Utilisateur.prenom.label("agent_prenom"),
                Utilisateur.nom.label("agent_nom"),
                func.coalesce(
                    func.sum(
                        case(
                            (
                                Contravention.etat_contravention.in_(["payee", "impayee"]),
                                Contravention.montant,
                            ),
                            else_=0,
                        )
                    ),
                    0,
                ).label("montant_total"),
                func.coalesce(
                    func.sum(
                        case(
                            (
                                Contravention.etat_contravention.in_(["payee", "impayee"]),
                                1,
                            ),
                            else_=0,
                        )
                    ),
                    0,
                ).label("contraventions_count"),
                func.coalesce(
                    func.sum(case((Contravention.etat_contravention == "avertissement", 1), else_=0)),
                    0,
                ).label("avertissements_count"),
            )
            .join(Contravention, Contravention.attribuer_par == Utilisateur.id)
            .group_by(Utilisateur.id, Utilisateur.nom, Utilisateur.prenom)
            .order_by(
                func.sum(
                    case(
                        (
                            Contravention.etat_contravention.in_(["payee", "impayee"]),
                            1,
                        ),
                        else_=0,
                    )
                ).desc(),
                Utilisateur.nom.asc(),
            )
            .all()
        )

        revenu_mois_courant_total = (
            db.query(func.coalesce(func.sum(Contravention.montant), 0))
            .filter(
                Contravention.date_entrer >= start_month,
                Contravention.date_entrer < next_month,
            )
            .scalar()
            or 0
        )

        revenu_mois_courant_paye = (
            db.query(func.coalesce(func.sum(Contravention.montant), 0))
            .filter(
                Contravention.date_entrer >= start_month,
                Contravention.date_entrer < next_month,
                Contravention.etat_contravention == "payee",
            )
            .scalar()
            or 0
        )

        return {
            "total_contraventions": total_contraventions,
            "contraventions_aujourdhui": contraventions_aujourdhui,
            "contraventions_7_derniers_jours": contraventions_7_derniers_jours,
            "leaderboard_agents": [
                {
                    "agent_id": row.agent_id,
                    "agent_prenom": row.agent_prenom,
                    "agent_nom": row.agent_nom,
                    "montant_total": row.montant_total,
                    "contraventions_count": row.contraventions_count,
                    "avertissements_count": row.avertissements_count,
                }
                for row in leaderboard_rows
            ],
            "revenu_mois_courant_total": revenu_mois_courant_total,
            "revenu_mois_courant_paye": revenu_mois_courant_paye,
        }
    except Exception as e:
        return {"error": f"Erreur lors de la recuperation des statistiques: {str(e)}"}


# ============ VEHICULES OPERATIONS ============
# Modifier les informations d'un véhicule
def update_vehicle(db: Session, vehicle_id: int, update_data: dict):
    """Modifier un véhicule"""
    try:
        vehicle = db.query(Vehicule).filter(Vehicule.id == vehicle_id).first()
        if vehicle is None:
            return None

        if "numero_plaque" in update_data and update_data["numero_plaque"] is not None:
            vehicle.numero_plaque = update_data["numero_plaque"].strip().upper()
        if "province" in update_data and update_data["province"] is not None:
            vehicle.province = update_data["province"].strip().upper()
        if "marque" in update_data and update_data["marque"] is not None:
            vehicle.marque = update_data["marque"].strip()
        if "modele" in update_data and update_data["modele"] is not None:
            vehicle.modele = update_data["modele"].strip()
        if "owner_id" in update_data:
            vehicle.owner_id = update_data["owner_id"]

        db.commit()
        db.refresh(vehicle)
        return vehicle
    except Exception as e:
        db.rollback()
        return {"error": f"Erreur lors de la modification: {str(e)}"}


# Récupérer tous les véhicules avec pagination du plus recent au plus ancien
def get_all_vehicles(db: Session, skip: int = 0, limit: int = 100):
    """Récupérer tous les véhicules avec pagination"""
    try:
        vehicles = db.query(Vehicule).order_by(Vehicule.id.desc()).offset(skip).limit(limit).all()
        return vehicles
    except Exception as e:
        return {"error": f"Erreur lors de la récupération: {str(e)}"}


# ============ RAISONS / EMPLACEMENTS OPERATIONS ============
# Ajouter une nouvelle raison de contravention
def create_reason(db: Session, reason_data: dict):
    """Ajouter une nouvelle raison de contravention"""
    try:
        new_reason = RaisonContravention(**reason_data, date_entrer=now_est_edt())
        db.add(new_reason)
        db.commit()
        db.refresh(new_reason)
        return new_reason
    except Exception as e:
        db.rollback()
        return {"error": f"Erreur lors de l'ajout de la raison: {str(e)}"}
    

# Mise à jour d'une raison de contravention
def update_reason(db: Session, reason_id: int, update_data: dict):
    """Modifier une raison de contravention"""
    try:
        reason = db.query(RaisonContravention).filter(RaisonContravention.id == reason_id).first()
        if reason is None:
            return None

        if "nom" in update_data and update_data["nom"] is not None:
            new_name = update_data["nom"].strip()
            duplicate_reason = (
                db.query(RaisonContravention)
                .filter(
                    RaisonContravention.nom == new_name,
                    RaisonContravention.id != reason_id,
                    RaisonContravention.deleted_at.is_(None),
                )
                .first()
            )
            if duplicate_reason is not None:
                return {
                    "error": "Une raison avec ce nom existe déjà.",
                    "status_code": 409,
                }
            reason.nom = new_name
        if "description" in update_data:
            reason.description = update_data["description"]
        if "montant" in update_data and update_data["montant"] is not None:
            reason.montant = update_data["montant"]

        reason.deleted_at = None

        db.commit()
        db.refresh(reason)
        return reason
    except Exception as e:
        db.rollback()
        return {"error": f"Erreur lors de la modification: {str(e)}"}


# Récupérer toutes les raisons de contravention
def get_all_reasons(db: Session):
    """Récupérer toutes les raisons"""
    try:
        reasons = db.query(RaisonContravention).all()
        return reasons
    except Exception as e:
        return {"error": f"Erreur lors de la récupération: {str(e)}"}

# effectuer un soft delete d'une raison de contravention en la marquant comme supprimée sans la retirer physiquement de la base de données
def delete_reason(db: Session, reason_id: int):
    """Supprimer logiquement une raison de contravention."""
    try:
        reason = db.query(RaisonContravention).filter(
            RaisonContravention.id == reason_id,
            RaisonContravention.deleted_at.is_(None),
        ).first()
        if reason is None:
            return None

        reason.deleted_at = now_est_edt()
        db.commit()
        db.refresh(reason)
        return reason
    except Exception as e:
        db.rollback()
        return {"error": f"Erreur lors de la suppression: {str(e)}"}

# Creer une nouvelle emplacement
def create_emplacement(db: Session, location_data: dict):
    """Ajouter un nouvel emplacement"""
    try:
        new_location = Emplacement(**location_data, date_entrer=now_est_edt())
        db.add(new_location)
        db.commit()
        db.refresh(new_location)
        return new_location
    except Exception as e:
        db.rollback()
        return {"error": f"Erreur lors de l'ajout de l'emplacement: {str(e)}"}

# Mise à jour d'un emplacement
def update_emplacement(db: Session, emplacement_id: int, update_data: dict):
    """Modifier un emplacement"""
    try:
        emplacement = db.query(Emplacement).filter(Emplacement.id == emplacement_id).first()
        if emplacement is None:
            return None

        if "nom" in update_data and update_data["nom"] is not None:
            emplacement.nom = update_data["nom"].strip()
        if "adresse" in update_data and update_data["adresse"] is not None:
            emplacement.adresse = update_data["adresse"].strip()
        if "ville" in update_data:
            emplacement.ville = update_data["ville"]
        if "province" in update_data:
            emplacement.province = update_data["province"]
        if "code_postal" in update_data:
            emplacement.code_postal = update_data["code_postal"]
        if "description" in update_data:
            emplacement.description = update_data["description"]

        emplacement.deleted_at = None

        db.commit()
        db.refresh(emplacement)
        return emplacement
    except Exception as e:
        db.rollback()
        return {"error": f"Erreur lors de la modification: {str(e)}"}

# Changer l'etat d'une contravention (payee, contestee, en_attente, impayee)
def change_contravention_etat(db: Session, contravention_id: int, new_etat: str):
    """Modifier l'etat d'une contravention."""
    try:
        contravention = db.query(Contravention).filter(Contravention.id == contravention_id).first()
        if contravention is None:
            return None

        contravention.etat_contravention = new_etat
        db.commit()
        db.refresh(contravention)
        return contravention
    except Exception as e:
        db.rollback()
        return {"error": f"Erreur lors de la modification de l'etat: {str(e)}"}

# Récupérer tous les emplacements
def get_all_emplacements(db: Session):
    """Récupérer tous les emplacements"""
    try:
        locations = db.query(Emplacement).filter(Emplacement.deleted_at.is_(None)).all()
        return locations
    except Exception as e:
        return {"error": f"Erreur lors de la récupération: {str(e)}"}

# effectuer un soft delete d'un emplacement en le marquant comme supprimé sans le retirer physiquement de la base de données
def delete_emplacement(db: Session, emplacement_id: int):
    """Supprimer logiquement un emplacement."""
    try:
        emplacement = db.query(Emplacement).filter(
            Emplacement.id == emplacement_id,
            Emplacement.deleted_at.is_(None),
        ).first()
        if emplacement is None:
            return None

        emplacement.deleted_at = now_est_edt()
        db.commit()
        db.refresh(emplacement)
        return emplacement
    except Exception as e:
        db.rollback()
        return {"error": f"Erreur lors de la suppression: {str(e)}"}
# Récupérer tous les raisons de contravention
def get_contravention_stats(db: Session):
    """Retourne les statistiques détaillées sur les contraventions pour le tableau de bord admin."""
    try:
        total_contraventions = db.query(func.count(Contravention.id)).scalar() or 0
        payee_count = (
            db.query(func.count(Contravention.id))
            .filter(Contravention.etat_contravention == "payee")
            .scalar()
            or 0
        )
        impayee_count = (
            db.query(func.count(Contravention.id))
            .filter(Contravention.etat_contravention == "impayee")
            .scalar()
            or 0
        )

        pourcentage_paye = (payee_count / total_contraventions * 100) if total_contraventions > 0 else 0
        pourcentage_impaye = (impayee_count / total_contraventions * 100) if total_contraventions > 0 else 0

        contravention_par_emplacement = dict(
            db.query(Emplacement.nom, func.count(Contravention.id))
            .join(Contravention, Contravention.emplacement_id == Emplacement.id)
            .group_by(Emplacement.nom)
            .all()
        )

        contravention_par_raison = dict(
            db.query(RaisonContravention.nom, func.count(Contravention.id))
            .join(Contravention, Contravention.raisons_id == RaisonContravention.id)
            .group_by(RaisonContravention.nom)
            .all()
        )

        return {
            "pourcentage_paye": pourcentage_paye,
            "pourcentage_impaye": pourcentage_impaye,
            "contravention_par_emplacement": contravention_par_emplacement,
            "contravention_par_raison": contravention_par_raison,
        }
    except Exception as e:
        return {"error": f"Erreur lors de la recuperation des statistiques: {str(e)}"}
# Récupérer les 10 véhicules avec le plus de contraventions pour le tableau de bord admin
def get_vehicule_contravention_stats(db: Session):
    """Retourne les 10 vehicules avec le plus de contraventions pour le tableau de bord admin."""
    try:
        stats = (
            db.query(
                Vehicule.numero_plaque,
                func.count(Contravention.id).label("nombre_contraventions"),
                func.sum(case((Contravention.etat_contravention == "avertissement", 1), else_=0)).label("nombre_avertissements"),
                func.sum(case((Contravention.etat_contravention == "payee", 1), else_=0)).label("nombre_contraventions_paye"),
                func.avg(func.unix_timestamp(Contravention.date_entrer)).label("heure_moyenne_contravention")
            )
            .join(Contravention, Contravention.vehicle_id == Vehicule.id)
            .group_by(Vehicule.numero_plaque)
            .order_by(func.count(Contravention.id).desc())
            .limit(10)
            .all()
        )

        return [
            {
                "plaque": row.numero_plaque,
                "nombre_contraventions": row.nombre_contraventions,
                "nombre_avertissements": row.nombre_avertissements,
                "nombre_contraventions_paye": row.nombre_contraventions_paye,
                "heure_moyenne_contravention": (
                    datetime.utcfromtimestamp(float(row.heure_moyenne_contravention)).strftime("%H:%M:%S")
                    if row.heure_moyenne_contravention is not None else None
                ),
            }
            for row in stats
        ]
    except Exception as e:
        return {"detail": f"Erreur lors de la recuperation des statistiques: {str(e)}"}


def crud_update_commentaire_admin(db: Session, contravention_id: int, commentaire_admin: str):
    """Met à jour le commentaire admin d'une contravention."""
    try:
        contravention = db.query(Contravention).filter(Contravention.id == contravention_id).first()
        if contravention is None:
            return None

        contravention.commentaire_admin = commentaire_admin
        db.commit()
        db.refresh(contravention)
        return contravention
    except Exception as e:
        db.rollback()
        return {"error": f"Erreur lors de la mise à jour du commentaire admin: {str(e)}"}

def admin_contravention_list(db: Session, skip: int = 0, limit: int = 100):
    """Récupère la liste de toutes les contraventions pour l'admin avec pagination."""
    try:
        contraventions = (
            db.query(Contravention)
            .options(
                joinedload(Contravention.vehicule),
                joinedload(Contravention.attribuer_par_utilisateur),
                joinedload(Contravention.emplacement),
                joinedload(Contravention.raison_contravention),
                joinedload(Contravention.modifier_par_utilisateur),
            )
            .order_by(Contravention.id.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return contraventions
    except Exception as e:
        return {"error": f"Erreur lors de la récupération des contraventions: {str(e)}"}