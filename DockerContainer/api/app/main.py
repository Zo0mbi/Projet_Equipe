from fastapi import FastAPI
from app.database import Base, engine
from app.routes import auth, contravention, emplacements, raisons_contravention, vehicules, admin, utilisateur
from sqlalchemy.exc import OperationalError
from fastapi.middleware.cors import CORSMiddleware
import time
import os
from app.schema.Contravention import ContraventionResponse

# Version securiser 
app = FastAPI(
    title="Gestion Stationnement API",
    description="API pour gérer les stationnements et contraventions",
    version="1.0.0",
    docs_url="/docs", # Désactive la documentation interactive Swagger UI
    redoc_url=None, # Désactive la documentation interactive ReDoc
    openapi_url="/docs/openapi.json" # Désactive l'endpoint OpenAPI
)
# Version securiser
cors_origins = os.getenv("CORS_ORIGINS")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Inclure les routes des différents modules de l'application
app.include_router(auth.router)
app.include_router(contravention.router)
app.include_router(emplacements.router)
app.include_router(raisons_contravention.router)
app.include_router(vehicules.router)
app.include_router(admin.router)
app.include_router(utilisateur.router)


# Au démarrage de l'application, créer les tables dans la base de données avec
# une logique de retry en cas d'échec de connexion
@app.on_event("startup")
def create_tables_with_retry():
    max_attempts = 20
    delay_seconds = 2

    for attempt in range(1, max_attempts + 1):
        try:
            Base.metadata.create_all(bind=engine)
            return
        except OperationalError:
            if attempt == max_attempts:
                raise
            time.sleep(delay_seconds)

# Route disponible depuis n'importe quelle adresse IP pour vérifier que l'API fonctionne correctement
@app.get("/")
def root():
    return {"message": "Bienvenue sur l'API de gestion de stationnement!", "version": "0.1.0"}
