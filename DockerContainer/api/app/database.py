from sqlalchemy import URL, create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
import os

DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD", "").strip()
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT", "3306")

db_url = URL.create(
    drivername="mysql+pymysql",
    username=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST"),
    port=int(os.getenv("DB_PORT", 3306)),
    database=os.getenv("DB_NAME"),
    query={"charset": "utf8mb4"},
)
engine = create_engine(
    db_url,
    pool_pre_ping=True,
    pool_recycle=3600,
    connect_args={"connect_timeout": 10},
)
@event.listens_for(engine, "connect")
def set_mysql_timezone(dbapi_connection, connection_record):
    with dbapi_connection.cursor() as cursor:
        cursor.execute("SET time_zone = 'SYSTEM'")
        cursor.execute("SET @@session.time_zone = 'SYSTEM'")
# Crée une session locale pour interagir avec la base de données
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
# Base est la classe de base pour tous les modèles SQLAlchemy
Base = declarative_base()

# Import tardif pour enregistrer les modèles sans créer de boucle d'import.
from app.models.utilisateur import Utilisateur 
from app.models.role import Role
from app.models.contravention import Contravention  
from app.models.vehicule import Vehicule  
from app.models.emplacement import Emplacement
from app.models.raisons_contravention import RaisonContravention
