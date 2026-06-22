from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud.emplacement import get_emplacements_for_form
from app.dependencies.db import get_db
from app.schema.Emplacement import EmplacementForFormResponse

router = APIRouter(prefix="/emplacements", tags=["emplacements"])


@router.get("/form", response_model=list[EmplacementForFormResponse])
def search_emplacements_for_form(db: Session = Depends(get_db)):
    emplacements = get_emplacements_for_form(db)
    return [EmplacementForFormResponse(id=item.id, nom=item.nom) for item in emplacements]