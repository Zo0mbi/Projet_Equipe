from sqlalchemy import Column, Integer, String, Text, DateTime

from app.core.timezone import now_est_edt
from app.database import Base


class Emplacement(Base):
    """Modele ORM pour la table emplacements."""
    __tablename__ = "emplacements"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False, index=True)
    adresse = Column(String(255), nullable=False)
    ville = Column(String(100), nullable=True, default="Québec")
    province = Column(String(50), nullable=True, default="QC")
    code_postal = Column(String(10), nullable=True)
    description = Column(Text, nullable=True)
    created_by = Column(Integer, nullable=True, index=True)
    date_entrer = Column(DateTime, nullable=False, default=now_est_edt)
    deleted_at = Column(DateTime, nullable=True, index=True)
