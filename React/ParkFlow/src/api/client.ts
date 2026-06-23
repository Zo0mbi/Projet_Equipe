import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const api = axios.create({
  baseURL: 'http://localhost:8000', // URL de l'API FastAPI (à changer selon l'environnement)
  headers: {
    'Content-Type': 'application/json',
  },
});

//Intercepteur pour vérifier l'identité à chaque requête avec le JWT
api.interceptors.request.use(
  async (requete) => {

    let token = null;

    //Vérifie la platforme utilisée puisqu'il y a des problèmes avec SecureStore en Web
    if (Platform.OS === 'web') {
      token = localStorage.getItem('token');
    } else {
      //Retourne le token à partir du SecureStore
      token = await SecureStore.getItemAsync('token');
    }

    //Vérifie que le token existe (utilisateur est connecté)
    if (token) {
      //S'il existe, donne l'autorisation, sinon non
      requete.headers.Authorization = `Bearer ${token}`;
    }

    return requete;
  },
  (erreur) => Promise.reject(erreur)
);

export default api;
