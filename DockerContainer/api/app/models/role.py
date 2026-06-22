from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Role(Base):
    """Modele ORM pour la table roles."""

    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(50), unique=True, nullable=False)

    utilisateurs = relationship("Utilisateur", back_populates="role")