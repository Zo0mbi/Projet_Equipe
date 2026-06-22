/**
 * Rôles disponibles dans l'application ParkFlow.
 */
export type Role = 'Admin' | 'Employé' | 'Client';

/**
 * Représente un utilisateur enregistré dans le système.
 */
export interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  role: {id: number, nom: string};
  date_inscription: string; // ISO String: Date de création du compte
  date_modification?: string; // ISO String: Date de création du compte
  est_actif?: boolean;
}

/**
 * Informations techniques sur un véhicule.
 */
export interface Vehicule {
  id: number;
  marque: string;
  modele: string;
  numero_plaque: string;
  province: string;
}

/**
 * Différents états possibles pour le cycle de vie d'un ticket.
 */
export type EtatContravention = 'Impayée' | 'Payée' | 'Contestée' | 'Annulée' | 'Avertissement';

/**
 * Représente une contravention (ticket) émise par un agent.
 */
export interface Contravention {
  attribuer_par_utilisateur: { nom: string, prenom: string }; // ID de l'Utilisateur (Employé) qui a créé le ticket
  date_entrer: string;
  date_modification: string;
  emplacement: { id: number; nom: string; adresse?: string, ville?: string, province?: string, code_postal?: string }; // Localisation (nom + adresse)
  etat_contravention: string;
  id: number;
  montant: number;
  numero_contravention: string; // Identifiant unique (ex: TKT-12345)
  raison_contravention: { id: number; nom: string } | null; // La raison choisie
  raison_custom: string | null
  vehicule: {id: number, marque: string, modele: string, numero_plaque: string, province: string};
}

export interface EmplacementContravention {
  id: number;
  nom: string;
  adresse?: string;
}

/**
 * Raisons prédéfinies pour les contraventions (ex: Stationnement interdit).
 */
export interface RaisonContravention {
  id: number;
  nom: string;
  description?: string;
  montant: number;
}

/**
 * Demande de contestation d'un client pour un ticket.
 */
export interface Contestation {
  id: number;
  ticket_id: number;
  user_id: number;
  raison: string;
  etat_contestation: 'en attente' | 'acceptée' | 'rejetée';
  date_entrer: string;
}

/**
 * Historique des actions effectuées dans le système.
 */
export interface Log {
  id: number;
  user_id: number;
  action: string;
  date_entrer: string;
}

