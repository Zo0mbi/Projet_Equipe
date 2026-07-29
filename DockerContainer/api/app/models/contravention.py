from sqlalchemy import Column, Integer, String, Text, DateTime, Numeric, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from app.core.timezone import now_est_edt

# Modele ORM pour la table contravention, avec les relations vers les autres tables (vehicules, utilisateurs, raisons_contravention, emplacements)
class Contravention(Base):
    __tablename__ = "contravention"

    id = Column(Integer, primary_key=True, index=True)
    numero_contravention = Column(String(50), unique=True, nullable=False, index=True)

    vehicle_id = Column(Integer, ForeignKey("vehicules.id"), nullable=False, index=True)
    attribuer_par = Column(Integer, ForeignKey("utilisateurs.id"), nullable=False, index=True)
    raisons_id = Column(Integer, ForeignKey("raisons_contravention.id"), nullable=True, index=True)
    raison_custom = Column(Text, nullable=True)
    montant = Column(Numeric(10, 2), nullable=False, default=30.00)
    etat_contravention = Column(
        Enum("impayee", "payee", "contestee", "annulee", "avertissement"),
        nullable=False,
        default="impayee",
    )
    emplacement_id = Column(Integer, ForeignKey("emplacements.id"), nullable=False, index=True)
    date_entrer = Column(DateTime, nullable=False, default=now_est_edt)
    date_modification = Column(DateTime, nullable=True, default=now_est_edt, onupdate=now_est_edt)
    modifier_par = Column(Integer, ForeignKey("utilisateurs.id"), nullable=True, index=True)
    commentaire_admin = Column(Text, nullable=True)

    vehicule = relationship("Vehicule", foreign_keys=[vehicle_id])
    attribuer_par_utilisateur = relationship("Utilisateur", foreign_keys=[attribuer_par])
    emplacement = relationship("Emplacement", foreign_keys=[emplacement_id])
    raison_contravention = relationship("RaisonContravention", foreign_keys=[raisons_id])
    modifier_par_utilisateur = relationship("Utilisateur", foreign_keys=[modifier_par])