from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud.raison_contravention import get_raisons_contravention_for_form
from app.dependencies.db import get_db
from app.schema.RaisonContravention import RaisonContraventionForFormResponse

router = APIRouter(prefix="/raisons-contravention", tags=["raisons_contravention"])


@router.get("/form", response_model=list[RaisonContraventionForFormResponse])
def search_raisons_contravention_for_form(db: Session = Depends(get_db)):
    raisons = get_raisons_contravention_for_form(db)
    return [RaisonContraventionForFormResponse(id=item.id, nom=item.nom, montant=item.montant) for item in raisons]