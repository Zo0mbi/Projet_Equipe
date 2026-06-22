from sqlalchemy import Column, DateTime, Integer, Numeric, String, Text

from app.core.timezone import now_est_edt
from app.database import Base


class RaisonContravention(Base):
    """Modele ORM pour la table raisons_contravention."""
    __tablename__ = "raisons_contravention"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    montant = Column(Numeric(10, 2), nullable=False, default=30.00)
    date_entrer = Column(DateTime, nullable=False, default=now_est_edt)
    deleted_at = Column(DateTime, nullable=True, index=True)
