from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies.current_user import get_current_user
from app.schema.Vehicule import VehiculeResponse, VehiculeUpsertRequest
from app.crud.vehicule import get_vehicule_by_owner, upsert_vehicule_by_plate
from app.dependencies.db import get_db


router = APIRouter(prefix="/vehicules", tags=["vehicules"])


@router.get("/mes-vehicules", response_model=list[VehiculeResponse])
def get_vehicules_by_owner_token(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Retourne tous les vehicules associes a l'utilisateur connecte.
    """
    if current_user is None:
        raise HTTPException(status_code=401, detail="Utilisateur non autorisé")
    vehicules = get_vehicule_by_owner(db, current_user.id)
    return [VehiculeResponse.model_validate(vehicule) for vehicule in vehicules]


# Ajouter ou mettre a jour un vehicule pour l'utilisateur connecte en utilisant le body JSON.
# Problème possible: Un utilisateurs peut modifier son véhicule avec sa plaque pour faire perdre la trace du véhicule en modifiant son modèle / marque
# Ne peut rien faire contre cela car si quelqu'un change de véhicule, mais garde sa plaque. Il faut pas tout changer. (Une méthode pour éviter cela aurait été de changer le comportement de la base de données pour prendre ce cas limite.)
@router.post("/upsert", response_model=VehiculeResponse)
def upsert_vehicule_for_current_user(
    vehicule_data: VehiculeUpsertRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Cree ou met a jour un vehicule pour l'utilisateur connecte.
    Les informations du vehicule sont lues depuis le body de la requete.
    """
    if current_user is None:
        raise HTTPException(status_code=401, detail="Utilisateur non autorisé")
    if vehicule_data.owner_id is not None and vehicule_data.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Interdit de creer ou modifier un vehicule pour un autre utilisateur")

    vehicule, _ = upsert_vehicule_by_plate(
        db,
        vehicule_data.numero_plaque,
        vehicule_data.marque,
        vehicule_data.modele,
        vehicule_data.province,
        current_user.id,
    )

    return VehiculeResponse.model_validate(vehicule)
