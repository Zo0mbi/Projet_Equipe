from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.crud.admin import (
    admin_contravention_list,
    change_contravention_etat as crud_change_contravention_etat,
    create_emplacement,
    create_reason,
    crud_update_commentaire_admin,
    crud_update_user_actif,
    delete_emplacement,
    delete_reason,
    get_admin_stats,
    get_all_Utilisateurs,
    get_all_contraventions,
    get_all_emplacements,
    get_all_reasons,
    get_all_vehicles,
    update_Utilisateur_role as crud_update_user_role,
    update_emplacement as crud_update_emplacement,
    update_reason as crud_update_reason,
    delete_Utilisateur as crud_delete_user,
    get_contravention_stats,
    get_vehicule_contravention_stats,
)
from app.crud.user import crud_update_user
from app.crud.vehicule import create_vehicule, upsert_vehicule_by_plate
from app.crud.contravention import serialize_contravention
from app.schema.Admin import AdminStatsResponse, AdminStatsContraventionResponse, AdminStatsVehiculeContraventionResponse
from app.schema.Contravention import CommentaireAdminUpdate, ContraventionAdminResponse, ContraventionEtatUpdateRequest, ContraventionResponse
from app.schema.Emplacement import EmplacementCreateRequest, EmplacementResponse, EmplacementUpdateRequest
from app.schema.RaisonContravention import RaisonContraventionCreateRequest, RaisonContraventionResponse, RaisonContraventionUpdateRequest
from app.schema.Utilisateur import UtilisateurActivationResponse, UtilisateurReferenceResponse, UtilisateurRoleUpdateRequest, UtilisateurRoleUpdateResponse, UtilisateurUpdateRequest
from app.schema.Vehicule import (
    VehiculeCreateRequest,
    VehiculeListResponse,
    VehiculeResponse,
    VehiculeUpsertRequest,
    VehiculeUpsertResponse,
)
from app.dependencies.current_user import get_current_user
from app.dependencies.db import get_db
from app.models.vehicule import Vehicule

def verify_admin_user(current_user=Depends(get_current_user)):
    """
    Vérifie que l'utilisateur connecté est administrateur.
    Lève une HTTPException si l'utilisateur n'a pas les permissions.
    """
    user_role_id = getattr(current_user, "role_id", None)

    # Vérifier si l'utilisateur a role_id = 3 (admin)
    if user_role_id != 3:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé."
        )

    return current_user

#Création du router pour les routes d'administration, avec une dépendance pour vérifier que l'utilisateur est connecté et a les permissions nécessaires pour accéder à ces routes.
router = APIRouter(prefix="/admin", tags=["admin"])
#, dependencies=[Depends(verify_admin_user)]
# Route de base
@router.get("/dashboard")
def admin_dashboard():
    return {"message": "Bienvenue sur le tableau de bord de l'administrateur!"}

'''
Routes pour recevoir les stats des contraventions
- Ces routes sont protégées et nécessitent que l'utilisateur soit un administrateur pour y accéder
'''
@router.get("/stats", response_model=AdminStatsResponse)
def admin_stats(db: Session = Depends(get_db)):
    stats = get_admin_stats(db)
    if isinstance(stats, dict) and "error" in stats:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=stats["error"])
    return stats

'''
Routes pour recevoir les stats des contraventions
- Ces routes sont protégées et nécessitent que l'utilisateur soit un administrateur pour y accéder
'''
@router.get("/stats/contraventions", response_model=AdminStatsContraventionResponse)
def contravention_stats(db: Session = Depends(get_db)):
    stats = get_contravention_stats(db)
    if isinstance(stats, dict) and "error" in stats:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=stats["error"])
    return stats

@router.get("/stats/vehicules", response_model=list[AdminStatsVehiculeContraventionResponse])
def vehicule_contravention_stats(db: Session = Depends(get_db)):
    stats = get_vehicule_contravention_stats(db)
    if isinstance(stats, dict) and "error" in stats:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=stats["error"])
    return stats

# Routes Get pour admins
@router.get("/liste-utilisateurs",
            summary="Lister les utilisateurs",
            description="Retourne la liste de tous les utilisateurs enregistrés dans la base de données.",
            response_model=list[UtilisateurReferenceResponse])
def list_utilisateurs(db: Session = Depends(get_db)):
    liste_utilisateurs = get_all_Utilisateurs(db)
    if isinstance(liste_utilisateurs, dict) and "error" in liste_utilisateurs:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=liste_utilisateurs["error"])
    return liste_utilisateurs


# Route pour lister tous les emplacements 
@router.get(
        "/liste-emplacements",
        summary="Lister les emplacements",
        description="Retourne la liste de tous les emplacements disponibles dans la base de données.",
        response_model=list[EmplacementResponse])
def list_emplacements(db: Session = Depends(get_db)):
    emplacements = get_all_emplacements(db)
    if isinstance(emplacements, dict) and "error" in emplacements:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=emplacements["error"])
    return [EmplacementResponse(id=item.id, nom=item.nom, adresse=item.adresse, ville=item.ville, province=item.province, code_postal=item.code_postal, description=item.description, created_by=item.created_by, date_entrer=item.date_entrer) for item in emplacements]    


@router.get(
        "/liste-raisons-contravention",
        summary="Lister les raisons de contravention",
        description="Retourne la liste de toutes les raisons de contravention disponibles dans la base",
        response_model=list[RaisonContraventionResponse])
def list_raisons_contravention(db: Session = Depends(get_db)):
    raisons = get_all_reasons(db)
    if isinstance(raisons, dict) and "error" in raisons:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=raisons["error"])
    return [RaisonContraventionResponse(id=item.id, nom=item.nom, description=item.description, montant=item.montant, date_entrer=item.date_entrer) for item in raisons]

@router.get(
        "/liste-vehicules",
        summary="Lister les véhicules",
        description="Retourne la liste de tous les véhicules disponibles dans la base de données.",
        response_model=VehiculeListResponse)
def list_vehicules(db: Session = Depends(get_db)):
    vehicules = get_all_vehicles(db)
    if isinstance(vehicules, dict) and "error" in vehicules:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=vehicules["error"])
    return VehiculeListResponse(vehicules=[VehiculeResponse.model_validate(item) for item in vehicules])

@router.get(
        "/liste-contraventions",
        summary="Lister les contraventions",
        description="Retourne la liste de toutes les contraventions disponibles dans la base de données.",
        response_model=list[ContraventionAdminResponse])
def list_contraventions(db: Session = Depends(get_db)):
    contraventions = admin_contravention_list(db)
    if isinstance(contraventions, dict) and "error" in contraventions:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=contraventions["error"])
    return [serialize_contravention(db, item) for item in contraventions]


############# POST CRÉATION ##############

# Route pour créer une nouvelle emplacement
@router.post(
    "/emplacements",
    response_model=EmplacementResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Créer un emplacement",
    description="Crée un nouvel emplacement utilisé par les contraventions.",
)
def create_new_emplacement(emplacement_data: EmplacementCreateRequest, db: Session = Depends(get_db)):
    try:
        emplacement = create_emplacement(db, emplacement_data.model_dump(exclude_unset=True))
        if isinstance(emplacement, dict) and "error" in emplacement:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=emplacement["error"])
        return emplacement
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

# Route pour créer une nouvelle raison de contravention
@router.post(
    "/raisons-contravention",
    response_model=RaisonContraventionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Créer une raison de contravention",
    description="Crée une raison de contravention réutilisable lors de la création de contraventions.",
)
def create_new_raison_contravention(raison_data: RaisonContraventionCreateRequest, db: Session = Depends(get_db)):
    try:
        raison = create_reason(db, raison_data.model_dump(exclude_unset=True))
        if isinstance(raison, dict) and "error" in raison:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=raison["error"])
        return raison
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    

# Route pour créer un nouveau vehicule
@router.post(
    "/vehicules",
    response_model=VehiculeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Créer un vehicule",
    description="Crée un véhicule et l'associe éventuellement à un propriétaire.",
)
def create_new_vehicule(vehicule_data: VehiculeCreateRequest, db: Session = Depends(get_db)):
    try:
        vehicule = create_vehicule(db, **vehicule_data.model_dump(exclude_unset=True))
        return vehicule
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


############### PUT MISE A JOUR ##############


# Route pour mettre à jour un emplacement
@router.put(
    "/emplacements/{emplacement_id}",
    response_model=EmplacementResponse,
    summary="Mettre a jour un emplacement",
    description="Mise a jour partielle d'un emplacement. Les champs envoyes sont les seuls modifies.",
)
def update_emplacement_route(emplacement_id: int, emplacement_data: EmplacementUpdateRequest, db: Session = Depends(get_db)):
    try:
        emplacement = crud_update_emplacement(db, emplacement_id, emplacement_data.model_dump(exclude_unset=True))
        if isinstance(emplacement, dict) and "error" in emplacement:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=emplacement["error"])
        if emplacement is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emplacement non trouvé")
        return emplacement
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    
# Route pour mettre à jour une raison de contravention
@router.put(
    "/raisons-contravention/{raison_id}",
    response_model=RaisonContraventionResponse,
    summary="Mettre a jour une raison de contravention",
    description="Mise a jour partielle d'une raison de contravention.",
)
def update_raison_contravention_route(raison_id: int, raison_data: RaisonContraventionUpdateRequest, db: Session = Depends(get_db)):
    try:
        raison = crud_update_reason(db, raison_id, raison_data.model_dump(exclude_unset=True))
        if isinstance(raison, dict) and "error" in raison:
            raise HTTPException(
                status_code=raison.get("status_code", status.HTTP_400_BAD_REQUEST),
                detail=raison["error"],
            )
        if raison is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Raison de contravention non trouvée")
        return raison
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.delete(
    "/emplacements/{emplacement_id}",
    summary="Supprimer logiquement un emplacement",
    description="Marque un emplacement comme supprime sans le retirer de la base.",
)
def delete_emplacement_route(emplacement_id: int, db: Session = Depends(get_db)):
    emplacement = delete_emplacement(db, emplacement_id)
    if emplacement is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emplacement non trouvé")
    if isinstance(emplacement, dict) and "error" in emplacement:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=emplacement["error"])
    return {"message": "Emplacement supprimé avec succès", "emplacement_id": emplacement_id}


@router.delete(
    "/raisons-contravention/{raison_id}",
    summary="Supprimer logiquement une raison de contravention",
    description="Marque une raison comme supprimee sans la retirer de la base.",
)
def delete_raison_contravention_route(raison_id: int, db: Session = Depends(get_db)):
    raison = delete_reason(db, raison_id)
    if raison is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Raison de contravention non trouvée")
    if isinstance(raison, dict) and "error" in raison:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=raison["error"])
    return {"message": "Raison supprimée avec succès", "raison_id": raison_id}
    
    
# Route pour mettre à jour un vehicule
@router.put(
    "/vehicules/{vehicule_id}",
    response_model=VehiculeUpsertResponse,
    summary="Mettre a jour ou creer un vehicule",
    description="Met a jour le vehicule si la plaque existe deja, sinon cree un nouveau vehicule.",
)
def update_vehicule_route(vehicule_id: int, vehicule_data: VehiculeUpsertRequest, db: Session = Depends(get_db)):
    try:
        vehicule = db.query(Vehicule).filter(Vehicule.id == vehicule_id).first()

        if vehicule is None:
            vehicule, action = upsert_vehicule_by_plate(
                db,
                numero_plaque=vehicule_data.numero_plaque,
                marque=vehicule_data.marque,
                modele=vehicule_data.modele,
                province=vehicule_data.province,
                owner_id=vehicule_data.owner_id,
            )
        else:
            normalized_plate = vehicule_data.numero_plaque.strip().upper()
            normalized_province = vehicule_data.province.strip().upper()
            normalized_marque = vehicule_data.marque.strip()
            normalized_modele = vehicule_data.modele.strip()

            changed = False
            if vehicule.numero_plaque != normalized_plate:
                vehicule.numero_plaque = normalized_plate
                changed = True
            if vehicule.province != normalized_province:
                vehicule.province = normalized_province
                changed = True
            if vehicule.marque != normalized_marque:
                vehicule.marque = normalized_marque
                changed = True
            if vehicule.modele != normalized_modele:
                vehicule.modele = normalized_modele
                changed = True
            if vehicule_data.owner_id is not None and vehicule.owner_id != vehicule_data.owner_id:
                vehicule.owner_id = vehicule_data.owner_id
                changed = True

            db.commit()
            db.refresh(vehicule)
            action = "updated" if changed else "confirmed"

        if action == "created":
            message = "Vehicule cree avec succes"
        elif action == "updated":
            message = "Vehicule mis a jour avec succes"
        else:
            message = "Vehicule deja existant, informations confirmees"

        return VehiculeUpsertResponse(
            action=action,
            message=message,
            vehicule=VehiculeResponse.model_validate(vehicule),
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

# Update du role d'un utilisateur (Par exemple, pour promouvoir un utilisateur public en employé ou un employé en admin)
@router.put(
    "/utilisateurs/{utilisateur_id}/role",
    response_model=UtilisateurRoleUpdateResponse,
    summary="Mettre a jour le role d'un utilisateur",
    description="Change le role d'un utilisateur admin, employe ou public.",
)
def update_utilisateur_role(
    utilisateur_id: int,
    role_data: UtilisateurRoleUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if role_data.role_id not in [1, 2, 3]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role_id invalide. Doit être 1 (public), 2 (employé) ou 3 (admin).")

    user = crud_update_user_role(db, utilisateur_id, role_data.role_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur non trouvé")
    if isinstance(user, dict) and "error" in user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=user["error"])

    return {
        "message": "Rôle utilisateur modifié avec succès",
        "utilisateur_id": utilisateur_id,
        "role_id": role_data.role_id,
    }


@router.put(
        "/utilisateurs/{utilisateur_id}/activation",
        response_model=UtilisateurActivationResponse,
        summary="Activer ou désactiver un utilisateur",
        description="Permet de reactiver un utilisateur désactivé ou de désactiver un utilisateur actif. Utile pour gérer les comptes sans les supprimer définitivement.",
)
def update_user_activation(
    utilisateur_id: int,
    db: Session = Depends(get_db),
):
    user = crud_update_user_actif(db, utilisateur_id)
    if user is None:
        print(f"Utilisateur avec ID {utilisateur_id} non trouvé pour mise à jour de l'activation.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur non trouvé")
    if isinstance(user, dict) and "error" in user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=user["error"])
    return {
        "message": "Etat de l'utilisateur modifié avec succès",
        "utilisateur_id": utilisateur_id,
        "est_actif": user.est_actif,
    }
@router.delete(
    "/utilisateurs/{utilisateur_id}",
    response_model=UtilisateurActivationResponse,
    summary="Désactiver un utilisateur",
    description="Remplace la suppression physique par une désactivation logique via est_actif.",
)
def delete_utilisateur(
    utilisateur_id: int,
    db: Session = Depends(get_db),
):
    user = crud_delete_user(db, utilisateur_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur non trouvé")
    if isinstance(user, dict) and "error" in user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=user["error"])

    return {
        "message": "Utilisateur désactivé avec succès",
        "utilisateur_id": utilisateur_id,
        "est_actif": user["est_actif"],
    }



@router.put(
    "/contraventions_changer_etat/{contravention_id}",
    response_model=ContraventionResponse,
    summary="Changer l'etat d'une contravention",
    description="Met a jour uniquement l'etat de la contravention.",
)
def change_contravention_etat_route(
    contravention_id: int,
    etat_data: ContraventionEtatUpdateRequest,
    db: Session = Depends(get_db),
):
    contravention = crud_change_contravention_etat(db, contravention_id, etat_data.new_etat)
    if isinstance(contravention, dict) and "error" in contravention:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=contravention["error"])
    if contravention is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contravention non trouvée")
    return serialize_contravention(db, contravention)


@router.put(
    "/utilisateurs/{utilisateur_id}",
    response_model=UtilisateurReferenceResponse,
    summary="Mettre a jour un utilisateur",
    description="Mise a jour partielle d'un utilisateur. Les champs envoyes sont les seuls modifies.",
)
def update_utilisateur_route(utilisateur_id: int, utilisateur_data: UtilisateurUpdateRequest, db: Session = Depends(get_db)):
    try:
        # Only send the fields that were actually provided in the request so omitted fields stay unchanged.
        payload = utilisateur_data.model_dump(exclude_unset=True, exclude_none=True)
        user = crud_update_user(db, utilisateur_id, payload)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur non trouvé")
        if isinstance(user, dict) and "error" in user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=user["error"])
        return user
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc



@router.put(
    "/contraventions/{contravention_id}/commentaire",
    response_model=ContraventionAdminResponse,
    summary="Mettre à jour le commentaire admin d'une contravention",
    description="Met à jour uniquement le commentaire admin de la contravention."
)
def update_contravention_commentaire(
    contravention_id: int,
    payload: CommentaireAdminUpdate,
    db: Session = Depends(get_db),
):
    contravention = crud_update_commentaire_admin(
        db,
        contravention_id,
        commentaire_admin=payload.commentaire_admin
    )

    if isinstance(contravention, dict) and "error" in contravention:
        raise HTTPException(status_code=400, detail=contravention["error"])

    if contravention is None:
        raise HTTPException(status_code=404, detail="Contravention non trouvée")

    return contravention