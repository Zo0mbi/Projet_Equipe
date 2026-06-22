from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.crud.contravention import (
    create_contravention,
    verifier_plaque,
    get_contravention_by_numero as crud_get_contravention_by_numero,
    get_contravention_by_plaque as crud_get_contravention_by_plaque,
    get_recent_contravention_by_employe,
    serialize_contravention,
    get_contraventions_by_user,
    update_contravention as crud_update_contravention,
    get_contravention_by_id as crud_get_contravention_by_id,
)
from app.dependencies.db import get_db
from app.dependencies.current_user import get_current_user, get_current_user_optional, verifierPermissionsEmployes
from app.core.timezone import ensure_eastern_timezone, now_est_edt
from app.schema.Contravention import (
    ContraventionCreateRequest,
    ContraventionResponse,
    UpdateContraventionRequest,
    VerifierPlaqueResponse,
)

router = APIRouter(prefix="/contraventions", tags=["contraventions"])


@router.post("", response_model=ContraventionResponse, status_code=status.HTTP_201_CREATED)
def create_contravention_endpoint(
    request: ContraventionCreateRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Crée une nouvelle contravention à partir du formulaire en vérifiant d'abord si le véhicule existe déjà, sinon en créant un nouveau véhicule.
    Le numéro de contravention est généré automatiquement de manière unique.
    """
    #Verifier que demande viens d'un employe ou d'un admin
    if not verifierPermissionsEmployes(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès interdit: permissions insuffisantes")
    try:
        contravention = create_contravention(db, request)
        return serialize_contravention(db, contravention)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insertion impossible: verifiez les cles etrangeres et les donnees envoyees",
        ) from exc

# Route proteger pour les employés et les administrateurs pour voir les details d'une contravention par son numero de contravention
@router.get("/verifier-plaque/{numero_plaque}", response_model=VerifierPlaqueResponse)
def verifier_plaque_endpoint(
    numero_plaque: str,
    province: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Vérifie si un véhicule avec le numéro de plaque donné existe et retourne le nombre de contraventions impayées associées à ce véhicule.
    - **numero_plaque**: Le numéro de plaque à vérifier (ex: ABC123)
    - **province**: La province de la plaque (optionnel, par défaut "QC")
    - Retourne les détails du véhicule et le nombre de contraventions impayées si trouvé, sinon une erreur 404.
    """
    if not verifierPermissionsEmployes(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès interdit: permissions insuffisantes")
    resultat = verifier_plaque(db, numero_plaque, province)
    if resultat is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
              detail="Plaque non trouvée"
        )
    return resultat

'''
route protégée pour les employés et les administrateurs pour voir les details d'une contravention par son numero de plaque et sa province
- Seuls les employés et les administrateurs peuvent accéder à cette route
'''
@router.get("/plaque/{numero_plaque}", response_model=list[ContraventionResponse])
def get_contravention_by_plaque_endpoint(numero_plaque: str, province: str,current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Cherche les contraventions associées à un numéro de plaque et une province donnés.
    - **numero_plaque**: Numero de plaque à rechercher (ex: ABC123)
    - **province**: Province de la plaque (optionnel, par défaut "QC")
    Retourne les détails de la contravention si trouvée, sinon une erreur 404.
    """
    # Check de securite: Seuls les employés et les administrateurs peuvent accéder à cette route
    if not verifierPermissionsEmployes(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès interdit: permissions insuffisantes")
    contraventions = crud_get_contravention_by_plaque(db, numero_plaque, province)
    if not contraventions:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contravention non trouvée")
    return [serialize_contravention(db, contravention) for contravention in contraventions]

'''
route protégée pour les employés et les administrateurs pour voir les 5 contraventions les plus récentes attribuées par l'utilisateur connecté
- Seuls les employés et les administrateurs peuvent accéder à cette route
'''
@router.get("/recentes", response_model=list[ContraventionResponse])
def get_recent_contravention_by_employe_endpoint(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retourne les 5 contraventions les plus récentes attribuées par l'utilisateur connecté.
    """
    if not verifierPermissionsEmployes(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès interdit: permissions insuffisantes")
    return [
        serialize_contravention(db, contravention)
        for contravention in get_recent_contravention_by_employe(db, current_user.id)
    ]

# Retourner une liste de contravention que l'utilisateur connecter a recu 
@router.get("/mes-contraventions", response_model=list[ContraventionResponse])
def get_contraventions_by_user_endpoint(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retourne toutes les contraventions associées aux véhicules de l'utilisateur connecté.
    """
    if current_user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utilisateur non authentifié")
    return [
        serialize_contravention(db, contravention)
        for contravention in get_contraventions_by_user(db, current_user.id)
    ]


'''
Route pour obtenir les details d'une contravention par son numero de contravention
- Les utilisateurs publics peuvent accéder à cette route, mais les informations sensibles sont masquées
- Les employés et les administrateurs peuvent voir toutes les informations de la contravention
'''
@router.get("/numero/{numero_contravention}", response_model=ContraventionResponse)
def get_contravention(
    numero_contravention: str,
    current_user=Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    contravention = crud_get_contravention_by_numero(db, numero_contravention)

    if not contravention:
        raise HTTPException(status_code=404, detail="Contravention non trouvée")

    contravention_data = serialize_contravention(db, contravention).model_dump()
    if not current_user or current_user.role_id == 1:  # Si l'utilisateur n'est pas connecté ou est un utilisateur public
        attribuer_par_utilisateur = contravention_data.get("attribuer_par_utilisateur")
        if attribuer_par_utilisateur and attribuer_par_utilisateur.get("nom"):
            # Retourne seulement le prénom de l'employé qui a attribué la contravention pour les utilisateurs publics
            contravention_data["attribuer_par_utilisateur"]["nom"] = attribuer_par_utilisateur["nom"].split()[0]
            #TODO: CHANGER NOM PAR PRENOM QUAND ON VA ETRE PRET. 

        contravention_data["modifier_par_utilisateur"] = None

        vehicule = contravention_data.get("vehicule")
        if vehicule and vehicule.get("numero_plaque"):
            numero_plaque = vehicule["numero_plaque"]
            vehicule["numero_plaque"] = numero_plaque[:-3] + "***" if len(numero_plaque) > 3 else "***"
    return ContraventionResponse.model_validate(contravention_data)

"""
Route pour mettre a jour une contravention
Seuls les employés et les administrateurs peuvent accéder à cette route.
- Les employés peuvent seulement modifier les contraventions qu'ils ont attribuées et uniquement dans les 30 minutes suivant la création de la contravention.
- Les administrateurs peuvent modifier n'importe quelle contravention à tout moment.
"""
@router.put(
    "/{numero_contravention}",
    response_model=ContraventionResponse,
    summary="Mettre a jour une contravention",
    description="Mise a jour partielle d'une contravention par un employe ou un administrateur. Seuls les champs envoyes sont modifies. modifier_par et date_modification sont definis cote serveur.",
)
def update_contravention_endpoint(
    numero_contravention: str,
    contravention_data: UpdateContraventionRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not verifierPermissionsEmployes(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès interdit: permissions insuffisantes")
    # Verifier que la contravention existe
    current_contravention = crud_get_contravention_by_numero(db, numero_contravention)
    if current_contravention is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contravention non trouvée")
    # Verifier les permissions de modification en fonction du role de l'utilisateur
    if current_user.role_id == 2:
        #verifier que la modification est dans les 30 minutes suivant la creation de la contravention & Permission adéquate
        if current_contravention.attribuer_par != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès interdit: vous ne pouvez modifier que les contraventions que vous avez attribuées")
        date_entrer = ensure_eastern_timezone(current_contravention.date_entrer) if current_contravention.date_entrer else None
        # Si la date d'entrée existe et que plus de 30 minutes se sont écoulées depuis la création de la contravention, refuser la modification
        if date_entrer and now_est_edt() > date_entrer + timedelta(minutes=30):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès interdit: la modification est autorisée uniquement dans les 30 minutes suivant la création de la contravention")
    # Si l'utilisateur est un administrateur (role_id == 3), il peut modifier n'importe quelle contravention à tout moment, donc aucune vérification supplémentaire n'est nécessaire
    try:
        contravention = crud_update_contravention(
            db,
            current_contravention.id,
            contravention_data.model_dump(exclude_unset=True),
            contravention_data.model_fields_set, # Passer les champs qui ont été envoyés dans la requête pour la mise à jour partielle
            current_user.id,
        )
    # Gérer les erreurs potentielles lors de la mise à jour de la contravention, comme les violations d'intégrité ou les données invalides
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    # Vérifier que la contravention a été mise à jour avec succès et retourner les données mises à jour, sinon retourner une erreur 404 si la contravention n'existe pas
    if contravention is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contravention non trouvée")

    return serialize_contravention(db, contravention)