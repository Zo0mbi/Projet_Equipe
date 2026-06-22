from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies.db import get_db
from app.schema.Utilisateur import UtilisateurUpdateRequest
from app.crud.user import crud_update_user
from app.dependencies.current_user import get_current_user

router = APIRouter(prefix="/utilisateur", tags=["utilisateur"])
# Route pour modifier un utilisateur
@router.put(
    "/{user_id}",
    response_model=dict,
    summary="Modifier les informations d'un utilisateur",
    description="Permet à un utilisateur de modifier ses propres informations. Seuls les champs fournis seront mis à jour."
)
def mettre_a_jour_utilisateur(
    user_id: int,
    user_data: UtilisateurUpdateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
    ):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Permission refusée")
    user = crud_update_user(db, user_id, user_data.model_dump(exclude_unset=True))
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return {"message": "Utilisateur mis à jour avec succès"}