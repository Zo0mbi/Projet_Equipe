from decimal import Decimal

from pydantic import BaseModel, Field


class AdminLeaderboardItem(BaseModel):
    agent_id: int = Field(description="ID de l'agent")
    agent_prenom: str = Field(description="Prénom de l'agent")
    agent_nom: str = Field(description="Nom de l'agent")
    montant_total: Decimal = Field(description="Montant total des contraventions payees ou impayees attribuees par l'agent")
    contraventions_count: int = Field(description="Nombre de contraventions payees ou impayees attribuees")
    avertissements_count: int = Field(description="Nombre d'avertissements attribues")


class AdminStatsResponse(BaseModel):
    total_contraventions: int = Field(description="Nombre total de contraventions")
    contraventions_aujourdhui: int = Field(description="Nombre de contraventions creees aujourd'hui")
    contraventions_7_derniers_jours: int = Field(description="Nombre de contraventions sur les 7 derniers jours")
    leaderboard_agents: list[AdminLeaderboardItem] = Field(description="Classement des agents par contraventions")
    revenu_mois_courant_total: Decimal = Field(description="Montant total des contraventions du mois courant")
    revenu_mois_courant_paye: Decimal = Field(description="Montant paye des contraventions du mois courant")

    class Config:
        from_attributes = True


class AdminStatsContraventionResponse(BaseModel):
    pourcentage_paye: Decimal = Field(description="Pourcentage de contraventions payees")
    pourcentage_impaye: Decimal = Field(description="Pourcentage de contraventions impayees")
    contravention_par_emplacement: dict[str, int] = Field(description="Nombre de contraventions par emplacement",example={"Samson": 10, "Centre ville": 5})
    contravention_par_raison: dict[str, int] = Field(description="Nombre de contraventions par raison",example={"Stationnement interdit": 8, "Dépassement de durée": 7})
    
    class Config:
        from_attributes = True

class AdminStatsVehiculeContraventionResponse(BaseModel):
    plaque: str = Field(description="Plaque du vehicule")
    nombre_contraventions: int = Field(description="Nombre de contraventions associees")
    nombre_avertissements: int = Field(description="Nombre d'avertissements associes")
    nombre_contraventions_paye: int = Field(description="Nombre de contraventions payees associees")
    heure_moyenne_contravention: str = Field(description="Heure moyenne des contraventions associees")
    
    class Config:
        from_attributes = True
