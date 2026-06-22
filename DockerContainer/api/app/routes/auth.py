from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app.schema import RegisterRequest, LoginRequest, TokenResponse, RegistrationResponse, UserPublic
from app.schema.Auth import PageAccessCheckRequest, PageAccessCheckResponse, ModifierPasswordRequest
from app.crud.user import verify_password, update_user_password
from app.crud.user import (
    create_user,
    authenticate_user,
    user_exists_by_email,
    get_user_by_id,
    role_name_from_id,
    get_users,
)
from app.dependencies.db import get_db
from app.core.auth import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from app.dependencies.current_user import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

PAGE_ACCESS_RULES: dict[str, set[int]] = {
    "Utilisateurs" : {1, 2, 3},  #Tout le monde peut accéder à la page des utilisateurs
    "Employe" : {2, 3},        #Seuls les admins et les employés peuvent accéder à la page des employés
    "Admin" : {3},             #Seuls les admins peuvent accéder à la page d'administration
}


@router.post("/register", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """
    Endpoint pour créer un nouveau compte utilisateur.
    - **prenom**: Prénom de l'utilisateur (max 100 caractères)
    - **nom**: Nom complet (2-100 caractères)
    - **email**: Email unique
    - **mot_de_passe**: Mot de passe (min 8 caractères)

    """
    # Vérifier si l'email existe déjà
    if user_exists_by_email(db, request.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un compte avec cet email existe déjà"
        )
    
    # Créer le nouvel utilisateur
    user = create_user(
        db=db,
        prenom=request.prenom,
        nom=request.nom,
        email=request.email,
        mot_de_passe=request.mot_de_passe.get_secret_value(),
        role="public"  # Par défaut, les nouveaux utilisateurs sont "public"
    )
    
    return RegistrationResponse(
        id=user.id,
        prenom=user.prenom,
        nom=user.nom,
        email=user.email,

        role=role_name_from_id(user.role_id),
        message="Utilisateur créé avec succès"
    )


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Endpoint pour se connecter et obtenir un token JWT.
    
    - **email**: Email de l'utilisateur
    - **mot_de_passe**: Mot de passe
    
    Retourne un token JWT valide pendant 30 minutes.
    """
    # Authentifier l'utilisateur
    user = authenticate_user(db, request.email, request.mot_de_passe.get_secret_value())
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect"
        )
    if not user.est_actif:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Compte utilisateur désactivé. Veuillez contacter l'administrateur."
        )
    
    # Créer le token JWT
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )
    
    # Préparer la réponse avec les données utilisateur
    user_public = UserPublic(
        id=user.id,
        prenom=user.prenom,
        nom=user.nom,
        email=user.email,
        numero_telephone=user.numero_telephone,
        role=user.role,
        date_inscription=user.date_entrer,
        est_actif=user.est_actif,
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_public
    )


@router.get("/me", response_model=UserPublic)
def get_me(current_user = Depends(get_current_user)):
    """
    Endpoint pour récupérer les infos de l'utilisateur connecté.
    Requiert un token JWT valide dans l'en-tête Authorization.
    
    Exemple header:
    ```
    Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    ```
    """
    return UserPublic(
        id=current_user.id,
        prenom=current_user.prenom,
        nom=current_user.nom,
        email=current_user.email,
        numero_telephone=current_user.numero_telephone,
        role=current_user.role,
        date_inscription=current_user.date_entrer,
        est_actif=current_user.est_actif,
    )


@router.post("/check-page-access", response_model=PageAccessCheckResponse)
def check_page_access(
    request: PageAccessCheckRequest,
    current_user=Depends(get_current_user),
):
    allowed_roles = PAGE_ACCESS_RULES.get(request.page) 
    if allowed_roles is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Page inconnue.",
        )

    if current_user.role_id not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Accès non autorisé pour cette page.",
        )

    return PageAccessCheckResponse(
        success=True,
        page=request.page,
        role=role_name_from_id(current_user.role_id),
    )
#Route pour modifier un mot de passe
@router.post("/ModifierPassword")
def modifier_password(
    request: ModifierPasswordRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Vérifier que le mot de passe actuel est correct
    if not verify_password(request.ancien_mot_de_passe.get_secret_value(), current_user.mot_de_passe):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le mot de passe actuel est incorrect."
        )

    # Mettre à jour le mot de passe
    update_user_password(
        db,
        current_user.id,
        request.ancien_mot_de_passe.get_secret_value(),
        request.nouveau_mot_de_passe.get_secret_value(),
    )

    return {"message": "Le mot de passe a été modifié avec succès."}
