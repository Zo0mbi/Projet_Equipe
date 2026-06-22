from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from app.core.timezone import now_est_edt

class Log(Base):
    '''
    Modèle ORM pour la table logs.
    '''
    __tablename__ = "logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=True)
    categorie = Column(String(50), nullable=False, index=True)  # auth, stationnement, contravention, system
    action = Column(String(100), nullable=False, index=True)  # unauthorized_access_attempt, login_success, etc.
    ip_address = Column(String(45), nullable=True)  # IPv6 can be 45 chars
    path = Column(String(255), nullable=True)
    method = Column(String(10), nullable=True)  # GET, POST, etc.
    reason = Column(String(255), nullable=True)
    details = Column(Text, nullable=True)  # For any extra JSON data
    date_entrer = Column(DateTime, default=now_est_edt, index=True)