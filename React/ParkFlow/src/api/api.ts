import {
  Utilisateur,
  Vehicule,
  Contravention,
  EmplacementContravention,
  RaisonContravention,
} from '../types/database';
import api from './client';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Service API (Échafaudage)
 * À remplir au fur et à mesure du développement backend.
 */
export const ApiService = {
  // AUTHENTIFICATION
  getCaptcha: async (): Promise<{image: string, token: string}> => {
    const response = await api.get('/auth/captcha');
    return response.data;
  },

  login: async (email: string, mdp: string, captcha_answer?: string, captcha_token?: string): Promise<Utilisateur> => {
    const response = await api.post('/auth/login', {
      email: email,
      mot_de_passe: mdp,
      captcha_answer: captcha_answer || null,
      captcha_token: captcha_token || null
    });

    const data = response.data;

    if (Platform.OS === 'web') {
      localStorage.setItem('token', data.access_token);
    } else {
      await SecureStore.setItemAsync('token', data.access_token);
    }

    return data.user;
  },

  logout: async (): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem('token');
    } else {
      await SecureStore.deleteItemAsync('token');
    }
  },

  register: async (email: string, mdp: string, nom: string, prenom: string): Promise<Utilisateur> => {
    const reponse = await api.post('/auth/register', {
      email: email,
      mot_de_passe: mdp,
      nom: nom,
      prenom: prenom
    });

    return reponse.data;
  },

  checkPageAccess: async (page: string): Promise<boolean> => {
    try {
      const response = await api.post('/auth/check-page-access', {
        page,
      });

      return response.data.success;
    } catch (error) {
      return false;
    }
  },

  getMe: async (): Promise<Utilisateur> => {
    const reponse = await api.get("/auth/me");
    return reponse.data;
  },

  updateUtilisateur: async (id: number, data: Partial<Utilisateur>): Promise<Utilisateur> => {
    const reponse = await api.put(`/utilisateur/${id}`, data);
    return reponse.data;
  },

  modifierPassword: async (mot_de_passe_actuel: string, nouveau_mot_de_passe: string): Promise<any> => {
    const reponse = await api.post('/auth/ModifierPassword', {
      ancien_mot_de_passe: mot_de_passe_actuel,
      nouveau_mot_de_passe: nouveau_mot_de_passe
    });
    return reponse.data;
  },

  // CONTRAVENTIONS
  getContraventionsParPlaque: async (plaque: string, province: string): Promise<Contravention[]> => {
    const reponse = await api.get(`/contraventions/plaque/${plaque}`, {
      params: {province}
    });

    return reponse.data;
  },

  getContraventionsParNumero: async (numeroContravention: string): Promise<Contravention> => {
    const reponse = await api.get(`/contraventions/numero/${numeroContravention}`);

    return reponse.data;
  },

  getContraventionsRecentes: async (): Promise<Contravention[]> => {
    const reponse = await api.get("/contraventions/recentes");
    return reponse.data;
  },

  getContraventionsUtilisateur: async (): Promise<Contravention[]> => {
    const reponse = await api.get("/contraventions/mes-contraventions");
    return reponse.data;
  },

  // VÉHICULES
  getMesVehicules: async (): Promise<Vehicule[]> => {
    const reponse = await api.get('/vehicules/mes-vehicules');
    return reponse.data;
  },

  getVehicle: async (plate: string): Promise<Vehicule | null> => { return null; },

  verifierPlaque: async (plaque: string, province: string): Promise<{
    numero_plaque: string,
    marque: string | undefined,
    modele: string | undefined,
    province: string,
    count_impayee: number, // count == avant
    count_avertissement: number // avant null
  }> => {
    const reponse = await api.get(`/contraventions/verifier-plaque/${plaque}`, {
      params: { province }
    });
    return reponse.data;
  },

  // GESTION ADMINISTRATEUR
  getLogs: async (): Promise<any[]> => { return []; },
  
  getUsers: async (skip: number = 0, limit: number = 10, role_id?: number, search?: string): Promise<{items: Utilisateur[], total: number, skip: number, limit: number}> => {
    const reponse = await api.get('/admin/liste-utilisateurs');
    let allUsers: Utilisateur[] = reponse.data.map((u: any) => ({
      ...u,
      date_inscription: u.date_entrer || u.date_inscription || null,
      telephone: u.numero_telephone || u.telephone || ''
    }));
    
    if (role_id !== undefined) {
      allUsers = allUsers.filter(u => u.role.id === role_id);
    }
    
    if (search) {
      const s = search.toLowerCase();
      allUsers = allUsers.filter(u => 
        u.nom.toLowerCase().includes(s) || 
        u.email.toLowerCase().includes(s)
      );
    }
    
    const total = allUsers.length;
    const items = allUsers.slice(skip, skip + limit);
    
    return { items, total, skip, limit };
  },

  createContravention: async (data: {
    attribuer_par: number;
    emplacement_id: number;
    date_entrer: string;
    etat_contravention: string;
    marque: string;
    modele: string;
    montant: number;
    numero_plaque: string;
    province: string;
    raisons_id: number | null;
    raison_custom: string | null;
  }) => {
    const reponse = await api.post('/contraventions', data);
    return reponse.data;
  },

  getEmplacementsForForm: async (): Promise<EmplacementContravention[]> => {
    const reponse = await api.get('/emplacements/form');
    return reponse.data;
  },

  getRaisonsForForm: async (): Promise<RaisonContravention[]> => {
    const reponse = await api.get('/raisons-contravention/form');
    return reponse.data;
  },

  updateContravention: async (numero_contravention: string, data: {
    attribuer_par?: number;
    emplacement_id?: number;
    etat_contravention?: string;
    montant?: number;
    raison_custom?: string | null;
    raisons_id?: number | null;
    vehicle_id?: number;
    vehicule?: {
      marque?: string;
      modele?: string;
      numero_plaque?: string;
      province?: string;
    };
  }) => {
    const reponse = await api.put(`/contraventions/${numero_contravention}`, data);
    return reponse.data;
  },

  changerEtatContravention: async (numero_contravention: string, data: {
    etat_contravention?: string;
  }) => {
    const reponse = await api.put(`/contraventions/${numero_contravention}`, data);
    return reponse.data;
  },

  // TABLEAU DE BORD ADMIN
  getAdminStats: async (): Promise<{
    total_contraventions: number;
    contraventions_aujourdhui: number;
    contraventions_7_derniers_jours: number;
    leaderboard_agents: any[];
    revenu_mois_courant_total: number;
    revenu_mois_courant_paye: number;
  }> => {
    const reponse = await api.get('/admin/stats');
    return reponse.data;
  },

  getContraventionStats: async (): Promise<{
    pourcentage_paye: string;
    pourcentage_impaye: string;
    contravention_par_emplacement: Record<string, number>;
    contravention_par_raison: Record<string, number>;
  }> => {
    const reponse = await api.get('/admin/stats/contraventions');
    return reponse.data;
  },

  getVehiculeStats: async (): Promise<{
    plaque: string;
    nombre_contraventions: number;
    nombre_avertissements: number;
    nombre_contraventions_paye: number;
    heure_moyenne_contravention: string;
  }[]> => {
    const reponse = await api.get('/admin/stats/vehicules');
    return reponse.data;
  },


  // ACTIONS ADMINISTRATEUR
  adminGetUsers: async (): Promise<Utilisateur[]> => {
    const reponse = await api.get('/admin/liste-utilisateurs');
    return reponse.data;
  },

  adminGetEmplacements: async (): Promise<any[]> => {
    const reponse = await api.get('/admin/liste-emplacements');
    return reponse.data;
  },

  adminGetRaisons: async (): Promise<any[]> => {
    const reponse = await api.get('/admin/liste-raisons-contravention');
    return reponse.data;
  },

  adminGetVehicules: async () => {
    const reponse = await api.get('/admin/liste-vehicules');
    return reponse.data;
  },

  adminGetContraventions: async (): Promise<any[]> => {
    const reponse = await api.get('/admin/liste-contraventions');
    return reponse.data;
  },

  adminCreateEmplacement: async (data: any): Promise<any> => {
    const reponse = await api.post('/admin/emplacements', data);
    return reponse.data;
  },

  adminCreateRaison: async (data: any): Promise<any> => {
    const reponse = await api.post('/admin/raisons-contravention', data);
    return reponse.data;
  },

  adminCreateVehicule: async (data: any): Promise<any> => {
    const reponse = await api.post('/admin/vehicules', data);
    return reponse.data;
  },

  adminUpdateEmplacement: async (id: number, data: any): Promise<any> => {
    const reponse = await api.put(`/admin/emplacements/${id}`, data);
    return reponse.data;
  },

  adminDeleteEmplacement: async (id: number): Promise<any> => {
    const reponse = await api.delete(`/admin/emplacements/${id}`);
    return reponse.data;
  },

  adminRestoreUser: async (id: number): Promise<any> => {
    // Gardé par rétrocompatibilité temporaire, mais remplacé par adminUpdateUserActif
    const reponse = await api.put(`/admin/utilisateurs/${id}/reactiver`);
    return reponse.data;
  },

  adminUpdateUserActif: async (id: number): Promise<any> => {
    // Route implémentée par le collègue (bascule/toggle)
    const reponse = await api.put(`/admin/utilisateurs/${id}/activation`, {});
    return reponse.data;
  },

  adminUpdateUtilisateur: async (id: number, data: { nom?: string; prenom?: string; email?: string; numero_telephone?: string }): Promise<Utilisateur> => {
    const reponse = await api.put(`/admin/utilisateurs/${id}`, data);
    return reponse.data;
  },

  adminUpdateRaison: async (id: number, data: any): Promise<any> => {
    const reponse = await api.put(`/admin/raisons-contravention/${id}`, data);
    return reponse.data;
  },

  adminDeleteRaison: async (id: number): Promise<any> => {
    const reponse = await api.delete(`/admin/raisons-contravention/${id}`);
    return reponse.data;
  },

  adminUpdateVehicule: async (id: number, data: any): Promise<any> => {
    const reponse = await api.put(`/admin/vehicules/${id}`, data);
    return reponse.data;
  },

  adminUpdateUserRole: async (utilisateurId: number, roleId: number): Promise<any> => {
    const reponse = await api.put(`/admin/utilisateurs/${utilisateurId}/role`, {
      role_id: roleId
    });
    return reponse.data;
  },

  adminDeleteUser: async (utilisateurId: number): Promise<any> => {
    const reponse = await api.delete(`/admin/utilisateurs/${utilisateurId}`);
    return reponse.data;
  },

  adminChangerEtatContravention: async (id: number, etat: string): Promise<any> => {
    const reponse = await api.put(`/admin/contraventions_changer_etat/${id}`, {
      new_etat: etat
    });
    return reponse.data;
  },

};
