from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base
from app.core.timezone import now_est_edt


class Utilisateur(Base):
    """Modèle ORM pour la table utilisateurs"""
    __tablename__ = "utilisateurs"

    id = Column(Integer, primary_key=True, index=True)
    prenom = Column(String(100), nullable=False)
    nom = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    numero_telephone = Column(String(20), nullable=True)
    mot_de_passe = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True, index=True)
    date_entrer = Column(DateTime, default=now_est_edt, nullable=False)
    est_actif = Column(Boolean, default=True, nullable=False)
    role = relationship("Role", back_populates="utilisateurs")
    vehicules = relationship("Vehicule", back_populates="owner")

    def __repr__(self):
        return f"<Utilisateur(id={self.id}, nom={self.nom}, email={self.email}, role_id={self.role_id})>"
