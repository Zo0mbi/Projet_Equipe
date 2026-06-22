from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Vehicule(Base):
    """Modele ORM pour la table vehicules."""
    __tablename__ = "vehicules"

    id = Column(Integer, primary_key=True, index=True)
    numero_plaque = Column(String(20), nullable=False, index=True)
    province = Column(String(50), nullable=True)
    marque = Column(String(50), nullable=True)
    modele = Column(String(50), nullable=True)
    owner_id = Column(Integer, ForeignKey("utilisateurs.id"), nullable=True)

    owner = relationship("Utilisateur", back_populates="vehicules")
