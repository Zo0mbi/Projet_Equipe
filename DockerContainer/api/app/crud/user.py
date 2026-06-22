from sqlalchemy.orm import Session
from app.models.utilisateur import Utilisateur
from passlib.context import CryptContext

# Configuration du contexte de cryptage pour les mots de passe
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

ROLE_NAME_TO_ID = {
    "public": 1,
    "employe": 2,
    "admin": 3,
    "system": 4,
}

ROLE_ID_TO_NAME = {value: key for key, value in ROLE_NAME_TO_ID.items()}


# =========================
# Utilitaires de sécurité
# =========================

def hash_password(password: str) -> str:
    """Hash un mot de passe en clair en bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie qu'un mot de passe en clair correspond au hash"""
    return pwd_context.verify(plain_password, hashed_password)


# =========================
# Opérations CRUD - Utilisateurs
# =========================

def create_user(
    db: Session,
    prenom: str | None,
    nom: str,
    email: str,
    mot_de_passe: str,
    role: str = "public"
) -> Utilisateur:
    """
    Crée un nouvel utilisateur et le stocke en base de données.
    Le mot de passe est hashé avant le stockage.
    """
    hashed_password = hash_password(mot_de_passe)

    role_id = ROLE_NAME_TO_ID.get(role, ROLE_NAME_TO_ID["public"])

    db_user = Utilisateur(
        prenom=prenom,
        nom=nom,
        email=email,
        mot_de_passe=hashed_password,
        role_id=role_id,
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


def get_user_by_email(db: Session, email: str) -> Utilisateur | None:
    """Récupère un utilisateur par son email"""
    return db.query(Utilisateur).filter(Utilisateur.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> Utilisateur | None:
    """Récupère un utilisateur par son ID"""
    return db.query(Utilisateur).filter(Utilisateur.id == user_id).first()


def authenticate_user(db: Session, email: str, mot_de_passe: str) -> Utilisateur | None:
    """
    Authentifie un utilisateur.
    Retourne l'utilisateur si email et mot de passe sont corrects, None sinon.
    Met à jour la dernière connexion.
    """

    user = get_user_by_email(db, email)

    if not user:
        return None

    if not verify_password(mot_de_passe, user.mot_de_passe):
        return None

    return user


def user_exists_by_email(db: Session, email: str) -> bool:
    """Vérifie si un utilisateur avec cet email existe déjà"""
    return db.query(Utilisateur).filter(Utilisateur.email == email).first() is not None


def role_name_from_id(role_id: int | None) -> str:
    """Retourne le nom de rôle à partir de son ID."""
    return ROLE_ID_TO_NAME.get(role_id, "public")

def get_users(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    role_id: int | None = None,
    search: str | None = None
) -> tuple[list[Utilisateur], int]:
    """Récupère la liste des utilisateurs avec filtres et pagination, et le nombre total."""
    query = db.query(Utilisateur)
    
    if role_id is not None:
        query = query.filter(Utilisateur.role_id == role_id)
        
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Utilisateur.nom.ilike(search_filter)) | 
            (Utilisateur.email.ilike(search_filter))
        )
        
    total = query.count()
    users = query.order_by(Utilisateur.date_entrer.desc()).offset(skip).limit(limit).all()
    
    return users, total


validate_email = lambda email: "@" in email and "." in email and len(email) >= 5
validate_numero_telephone = lambda numero: numero is None or (isinstance(numero, str) and len(numero) <= 20) and all(c.isdigit() or c in "+- ()" for c in numero)
# methode de mise a jours d'un utilisateurs
# Aucun champ n'est obligatoire, mais au moins un doit être fourni pour que la mise à jour ait lieu
def crud_update_user(
    db: Session,
    user_id: int,
    data: dict
) -> Utilisateur | None:
    """Met à jour les informations d'un utilisateur existant."""
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    if not data:
        return {"error": "Au moins un champ doit être fourni"}
    # Verifier les champs envoyers et leur validité
    if "email" in data and not validate_email(data["email"]):
        return {"error": "Email invalide"}
    if "role_id" in data and data["role_id"] not in ROLE_ID_TO_NAME:
        return {"error": "ID de rôle invalide"}
    if "est_actif" in data and not isinstance(data["est_actif"], bool):
        return {"error": "Le champ est_actif doit être un booléen"}
    if "prenom" in data and (not isinstance(data["prenom"], str) or len(data["prenom"]) > 100):
        return {"error": "Le prénom doit être une chaîne de caractères de maximum 100 caractères"}
    if "nom" in data and (not isinstance(data["nom"], str) or len(data["nom"]) > 100):
        return {"error": "Le nom doit être une chaîne de caractères de maximum 100 caractères"}
    if "numero_telephone" in data and not validate_numero_telephone(data["numero_telephone"]):
        return {"error": "Le numéro de téléphone est invalide"}
    # Mettre à jour les champs fournis
    if "prenom" in data:
        user.prenom = data["prenom"]
    if "nom" in data:
        user.nom = data["nom"]
    if "email" in data:
        user.email = data["email"]
    if "numero_telephone" in data:
        user.numero_telephone = data["numero_telephone"]
    if "role_id" in data:
        user.role_id = data["role_id"]
    if "est_actif" in data and current_user.role_id == ROLE_NAME_TO_ID["admin"]:
        user.est_actif = data["est_actif"]
    
    db.commit()
    db.refresh(user)
    
    return user

def update_user_password(db: Session, user_id: int, ancien_mot_de_passe: str, nouveau_mot_de_passe: str) -> bool:
    """Met à jour le mot de passe d'un utilisateur après vérification de l'ancien mot de passe."""
    user = get_user_by_id(db, user_id)
    if not user:
        return False
    if not verify_password(ancien_mot_de_passe, user.mot_de_passe):
        return False
    
    user.mot_de_passe = hash_password(nouveau_mot_de_passe)
    db.commit()
    return True