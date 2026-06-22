import requests
import pytest


lien = "https://parkflow.zo0mbi.com"
def get_token_admin():
    # Simulate getting a token (in real tests, you would call the actual login endpoint)
    response = requests.post(f"{lien}/auth/login", json={"email": "bossman@hotmail.com", "mot_de_passe": "lune3211"})
    print(response.json())
    return response.json().get("access_token")

def get_headers_admin():
    token = get_token_admin()
    headers = {"Authorization": f"Bearer {token}"}
    return headers

def get_token_employee():
    # Simulate getting a token for an employee (in real tests, you would call the actual login endpoint)
    response = requests.post(f"{lien}/auth/login", json={"email": "ti-coune@gmail.com", "mot_de_passe": "soleil123"})
    return response.json().get("access_token")

def get_headers_employee():
    token = get_token_employee()
    headers = {"Authorization": f"Bearer {token}"}
    return headers

token_admin = get_token_admin()
headers_admin = get_headers_admin()
token_employee = get_token_employee()
headers_employee = get_headers_employee()

# Route Dashboard Admin
def test_route_admin_defaut():
    response = requests.get(f"{lien}/admin/dashboard", headers=headers_admin)
    assert response.status_code == 200
    assert response.json() == {"message": "Bienvenue sur le tableau de bord de l'administrateur!"}

def test_route_admin_non_connecter():
    response = requests.get(f"{lien}/admin/dashboard")
    assert response.status_code == 401

def test_route_admin_employee():
    response = requests.get(f"{lien}/admin/dashboard", headers=headers_employee)
    assert response.status_code == 403

# Route stats
def test_route_stats_admin():
    response = requests.get(f"{lien}/admin/stats", headers=headers_admin)
    #Verifier que la requete a réussi vue qu'on est connecter en tant qu'admin
    assert response.status_code == 200, f"Code expecter 200, reçu: {response.status_code}"
    # verifier que la réponse contient les clés attendues
    expected_keys = {
        "total_contraventions",
        "contraventions_aujourdhui",
        "contraventions_7_derniers_jours",
        "leaderboard_agents",
        "revenu_mois_courant_total",
        "revenu_mois_courant_paye"
    }
    assert set(response.json().keys()) == expected_keys, f"Clés manquantes dans la réponse: {response.json().keys()}"
    # verifier que les données des agents contiennent les clés attendues
    agents_keys = {
        "agent_id",
        "agent_prenom",
        "agent_nom",
        "montant_total",
        "contraventions_count",
        "avertissements_count"
    }
    for agent in response.json().get("leaderboard_agents", []):
        assert set(agent.keys()) == agents_keys, f"Mauvaise reception des clés pour l'agent: {agent.keys()} pour: {len(agent)} agents"
        # Assert que les valeurs des agents sont du bon type
        assert isinstance(agent.get("agent_id"), int), f"agent_id doit être un int, reçu: {type(agent.get('agent_id'))}"
        assert isinstance(agent.get("agent_prenom"), str), f"agent_prenom doit être une str, reçu: {type(agent.get('agent_prenom'))}"
        assert isinstance(agent.get("agent_nom"), str), f"agent_nom doit être une str, reçu: {type(agent.get('agent_nom'))}"
        # Dans ce cas le montant total est retourné en string. Je sais pas ou j'ai fait cela Mais ca marche comme ca.
        assert isinstance(agent.get("montant_total"), str), f"montant_total doit être une str, reçu: {type(agent.get('montant_total'))}"
        assert isinstance(agent.get("contraventions_count"), int), f"contraventions_count doit être un int, reçu: {type(agent.get('contraventions_count'))}"
        assert isinstance(agent.get("avertissements_count"), int), f"avertissements_count doit être un int, reçu: {type(agent.get('avertissements_count'))}"
    assert isinstance(response.json().get("total_contraventions"), int), f"total_contraventions doit être un int, reçu: {type(response.json().get('total_contraventions'))}"
    assert isinstance(response.json().get("contraventions_aujourdhui"), int), f"contraventions_aujourdhui doit être un int, reçu: {type(response.json().get('contraventions_aujourdhui'))}"
    assert isinstance(response.json().get("contraventions_7_derniers_jours"), int), f"contraventions_7_derniers_jours doit être un int, reçu: {type(response.json().get('contraventions_7_derniers_jours'))}"
    assert isinstance(response.json().get("leaderboard_agents"), list), f"leaderboard_agents doit être une liste, reçu: {type(response.json().get('leaderboard_agents'))}"

def test_route_stats_admin_donnees():
    response = requests.get(f"{lien}/admin/stats", headers=headers_admin)
    assert response.status_code == 200, f"Code expecter 200, reçu: {response.status_code}"
    data = response.json()
    # Vérifier que les données sont cohérentes (ex: total_contraventions doit être >= contraventions_aujourdhui)
    assert data["total_contraventions"] >= data["contraventions_aujourdhui"], "total_contraventions doit être supérieur ou égal à contraventions_aujourdhui"
    assert data["total_contraventions"] >= data["contraventions_7_derniers_jours"], "total_contraventions doit être supérieur ou égal à contraventions_7_derniers_jours"

def test_route_stats_employee():
    response = requests.get(f"{lien}/admin/stats", headers=headers_employee)
    assert response.status_code == 403, f"Code expecter 403, reçu: {response.status_code}"

def test_route_stats_non_connecter():
    response = requests.get(f"{lien}/admin/stats")
    assert response.status_code == 401, f"Code expecter 401, reçu: {response.status_code}"

# Route /admin/stats/contraventions
def test_route_stats_contraventions_admin():
    response = requests.get(f"{lien}/admin/stats/contraventions", headers=headers_admin)
    
    # Verifier que la requete a réussi vue qu'on est connecter en tant qu'admin
    assert response.status_code == 200, f"Code expecter 200, reçu: {response.status_code}"
    
    # Parse le JSON de la réponse
    data = response.json()
    
    # Verifier que la réponse est un dictionnaire
    assert isinstance(data, dict), f"Reponse doit être un dictionnaire, reçu: {type(data)}"
    
    # Les clés attendues dans la réponse
    expected_keys = {
        "pourcentage_paye",
        "pourcentage_impaye",
        "contravention_par_emplacement",
        "contravention_par_raison"
    }
    
    # Verifier que les clés attendues sont présentes dans la réponse
    assert set(data.keys()) == expected_keys, f"Expected keys {expected_keys}, but got {data.keys()}"
    
    # Valider les types des données retournées
    assert isinstance(data["pourcentage_paye"], str), f"pourcentage_paye doit être un float, reçu: {type(data['pourcentage_paye'])}"
    assert isinstance(data["pourcentage_impaye"], str), f"pourcentage_impaye doit être un float, reçu: {type(data['pourcentage_impaye'])}"

    # Valider la structure et le contenu de contravention_par_emplacement
    emplacements = data.get("contravention_par_emplacement", {})
    assert isinstance(emplacements, dict), f"contravention_par_emplacement doit être un dictionnaire, reçu: {type(emplacements)}"
    for key, value in emplacements.items():
        assert isinstance(key, str), f"Keys dans contravention_par_emplacement doivent être des strings, mais trouvé {key}"
        assert isinstance(value, int), f"Values dans contravention_par_emplacement doivent être des entiers, mais trouvé {value}"
    
    # Valider la structure et le contenu de contravention_par_raison
    raisons = data.get("contravention_par_raison", {})
    assert isinstance(raisons, dict), f"contravention_par_raison doit être un dictionnaire, reçu: {type(raisons)}"
    for key, value in raisons.items():
        assert isinstance(key, str), f"Keys dans contravention_par_raison doivent être des strings, mais trouvé {key}"
        assert isinstance(value, int), f"Values dans contravention_par_raison doivent être des entiers, mais trouvé {value}"

def test_route_stats_contraventions_employee():
    response = requests.get(f"{lien}/admin/stats/contraventions", headers=headers_employee)
    assert response.status_code == 403, f"Code expecter 403, reçu: {response.status_code}"

def test_route_stats_contraventions_non_connecter():
    response = requests.get(f"{lien}/admin/stats/contraventions")
    assert response.status_code == 401, f"Code expecter 401, reçu: {response.status_code}"

# Route /admin/stats/vehicules
def test_route_stats_vehicules_admin():
    response = requests.get(f"{lien}/admin/stats/vehicules", headers=headers_admin)
    assert response.status_code == 200, f"Code expecter 200, reçu: {response.status_code}"
    data = response.json()
    expected_keys = {
        "plaque",
        "nombre_contraventions",
        "nombre_avertissements",
        "nombre_contraventions_paye",
        "heure_moyenne_contravention"
    }
    #verifier les valeurs de chaque contravention
    for data_vehicule in data:
        assert set(data_vehicule.keys()) == expected_keys, f"Expected keys {expected_keys}, but got {data_vehicule.keys()}"
        # Verifier les types des données retournées
        assert isinstance(data_vehicule["plaque"], str), f"plaque doit être une string, reçu: {type(data_vehicule['plaque'])}"
        assert isinstance(data_vehicule["nombre_contraventions"], int), f"nombre_contraventions doit être un int, reçu: {type(data_vehicule['nombre_contraventions'])}"
        assert isinstance(data_vehicule["nombre_avertissements"], int), f"nombre_avertissements doit être un int, reçu: {type(data_vehicule['nombre_avertissements'])}"
        assert isinstance(data_vehicule["nombre_contraventions_paye"], int), f"nombre_contraventions_paye doit être un int, reçu: {type(data_vehicule['nombre_contraventions_paye'])}"
        assert isinstance(data_vehicule["heure_moyenne_contravention"], str), f"heure_moyenne_contravention doit être une string, reçu: {type(data_vehicule['heure_moyenne_contravention'])}"

def test_route_stats_vehicules_employee():
    response = requests.get(f"{lien}/admin/stats/vehicules", headers=headers_employee)
    assert response.status_code == 403, f"Code expecter 403, reçu: {response.status_code}"

def test_route_stats_vehicules_non_connecter():
    response = requests.get(f"{lien}/admin/stats/vehicules")
    assert response.status_code == 401, f"Code expecter 401, reçu: {response.status_code}"

#route admin/liste-utilisateurs
def test_route_liste_utilisateurs_admin():
    response = requests.get(f"{lien}/admin/liste-utilisateurs", headers=headers_admin)
    assert response.status_code == 200, f"Code expecter 200, reçu: {response.status_code}"
    data = response.json()
    expected_keys = {
    "id",
    "prenom",
    "nom",
    "email",
    "numero_telephone",
    "role_id",
    "role",
    "est_actif",
    "date_entrer"
    }
    expected_role_keys ={
        "id",
        "nom"
    }
    for utilisateur in data:
        assert set(utilisateur.keys()) == expected_keys, f"Expected keys {expected_keys}, but got {utilisateur.keys()}"
        # Verifier les types des données retournées
        assert isinstance(utilisateur["id"], int), f"id doit être un int, reçu: {type(utilisateur['id'])}"
        assert isinstance(utilisateur["nom"], str), f"nom doit être une string, reçu: {type(utilisateur['nom'])}"
        assert isinstance(utilisateur["prenom"], str), f"prenom doit être une string, reçu: {type(utilisateur['prenom'])}"
        assert isinstance(utilisateur["email"], str), f"email doit être une string, reçu: {type(utilisateur['email'])}"
        assert isinstance(utilisateur["role"], dict), f"role doit être un dictionnaire, reçu: {type(utilisateur['role'])}"
        assert set(utilisateur["role"].keys()) == expected_role_keys, f"Expected keys {expected_role_keys} in role, but got {utilisateur['role'].keys()}"
        assert isinstance(utilisateur["role"]["id"], int), f"role.id doit être un int, reçu: {type(utilisateur['role']['id'])}"
        assert isinstance(utilisateur["role"]["nom"], str), f"role.nom doit être une string, reçu: {type(utilisateur['role']['nom'])}"

def test_route_liste_utilisateurs_employee():
    response = requests.get(f"{lien}/admin/liste-utilisateurs", headers=headers_employee)
    assert response.status_code == 403, f"Code expecter 403, reçu: {response.status_code}"

def test_route_liste_utilisateurs_non_connecter():
    response = requests.get(f"{lien}/admin/liste-utilisateurs")
    assert response.status_code == 401, f"Code expecter 401, reçu: {response.status_code}"

# route admin/liste-emplacements
def test_route_liste_emplacements_admin():
    response = requests.get(f"{lien}/admin/liste-emplacements", headers=headers_admin)
    assert response.status_code == 200, f"Code expecter 200, reçu: {response.status_code}"
    data = response.json()
    assert isinstance(data, list), f"Reponse doit être une liste, reçu: {type(data)}"
    assert data is not None, "La réponse ne doit pas être nulle"

def test_route_liste_emplacements_employee():
    response = requests.get(f"{lien}/admin/liste-emplacements", headers=headers_employee)
    assert response.status_code == 403, f"Code expecter 403, reçu: {response.status_code}"

def test_route_liste_emplacements_non_connecter():
    response = requests.get(f"{lien}/admin/liste-emplacements")
    assert response.status_code == 401, f"Code expecter 401, reçu: {response.status_code}"

# route admin/liste-raisons-contraventions
def test_route_liste_raisons_contraventions_admin():
    response = requests.get(f"{lien}/admin/liste-raisons-contravention", headers=headers_admin)
    assert response.status_code == 200, f"Code expecter 200, reçu: {response.status_code}"
    data = response.json()
    assert isinstance(data, list), f"Reponse doit être une liste, reçu: {type(data)}"
    assert data is not None, "La réponse ne doit pas être nulle"

def test_route_liste_raisons_contraventions_employee():
    response = requests.get(f"{lien}/admin/liste-raisons-contravention", headers=headers_employee)
    assert response.status_code == 403, f"Code expecter 403, reçu: {response.status_code}"

def test_route_liste_raisons_contraventions_non_connecter():
    response = requests.get(f"{lien}/admin/liste-raisons-contravention")
    assert response.status_code == 401, f"Code expecter 401, reçu: {response.status_code}"

# route admin/liste-vehicules
def test_route_liste_vehicules_admin():
    response = requests.get(f"{lien}/admin/liste-vehicules", headers=headers_admin)
    assert response.status_code == 200, f"Code expecter 200, reçu: {response.status_code}"
    data = response.json()
    assert isinstance(data, dict), f"Reponse doit être un dictionnaire, reçu: {type(data)}"
    assert data is not None, "La réponse ne doit pas être nulle"

def test_route_liste_vehicules_employee():
    response = requests.get(f"{lien}/admin/liste-vehicules", headers=headers_employee)
    assert response.status_code == 403, f"Code expecter 403, reçu: {response.status_code}"

def test_route_liste_vehicules_non_connecter():
    response = requests.get(f"{lien}/admin/liste-vehicules")
    assert response.status_code == 401, f"Code expecter 401, reçu: {response.status_code}"

# route admin/liste-contraventions
def test_route_liste_contraventions_admin():
    response = requests.get(f"{lien}/admin/liste-contraventions", headers=headers_admin)
    assert response.status_code == 200, f"Code expecter 200, reçu: {response.status_code}"
    data = response.json()
    assert isinstance(data, list), f"Reponse doit être une liste, reçu: {type(data)}"
    assert data is not None, "La réponse ne doit pas être nulle"
    expected_keys = {
        "attribuer_par_utilisateur",
        "modifier_par_utilisateur",
        "raison_custom",
        "date_entrer",
        "date_modification",
        "emplacement",
        "etat_contravention",
        "montant",
        "numero_contravention",
        "raison_contravention",
        "vehicule"
    }
    for contravention in data:
        assert set(contravention.keys()) == expected_keys, f"Expected keys {expected_keys}, but got {contravention.keys()}"

def test_route_liste_contraventions_employee():
    response = requests.get(f"{lien}/admin/liste-contraventions", headers=headers_employee)
    assert response.status_code == 403, f"Code expecter 403, reçu: {response.status_code}"

def test_route_liste_contraventions_non_connecter():
    response = requests.get(f"{lien}/admin/liste-contraventions")
    assert response.status_code == 401, f"Code expecter 401, reçu: {response.status_code}"


# Route Delete admin/emplacements/{id}
def test_route_delete_admin():
    emplacement_id = 1  # ID d'emplacement à supprimer (doit exister dans la base de données)
    response = requests.delete(f"{lien}/admin/emplacements/{emplacement_id}", headers=headers_admin)
    assert response.status_code == 200, f"Code expecter 200, reçu: {response.status_code}"
    data = response.json()
    assert data.get("message") == "Emplacement supprimé avec succès", f"Message inattendu: {data.get('message')}"

#Modifier un emplacement avec des données valides pour la remettre valide.
def test_modifier_emplacement():
    emplacement_id = 1  # ID d'emplacement à supprimer (doit exister dans la base de données)
    payload = {
        "Province": "QC",
    }
    response = requests.put(f"{lien}/admin/emplacements/{emplacement_id}", json=payload, headers=headers_admin)
    assert response.status_code == 200, f"Code expecter 200, reçu: {response.status_code}"
#Retours au Delete
def test_route_delete_employee():
    emplacement_id = 1  # ID d'emplacement à supprimer (doit exister dans la base de données)
    response = requests.delete(f"{lien}/admin/emplacements/{emplacement_id}", headers=headers_employee)
    assert response.status_code == 403, f"Code expecter 403, reçu: {response.status_code}"

def test_route_delete_non_connecter():
    emplacement_id = 1  # ID d'emplacement à supprimer (doit exister dans la base de données)
    response = requests.delete(f"{lien}/admin/emplacements/{emplacement_id}")
    assert response.status_code == 401, f"Code expecter 401, reçu: {response.status_code}"

def test_route_delete_not_found():
    emplacement_id = 9999  # ID d'emplacement qui n'existe pas
    response = requests.delete(f"{lien}/admin/emplacements/{emplacement_id}", headers=headers_admin)
    assert response.status_code == 404, f"Code expecter 404, reçu: {response.status_code}"

def test_route_delete_emplacement_bad_request():
    emplacement_id = "1239G"  # ID d'emplacement à supprimer (doit exister dans la base de données)
    response = requests.delete(f"{lien}/admin/emplacements/{emplacement_id}", headers=headers_admin)
    assert response.status_code == 422, f"Code expecter 422, reçu: {response.status_code}"

# route admin/emplacements/{id}
def test_route_modifier_emplacement_admin_bad_request():
    emplacement_id = 1  # ID d'emplacement à modifier (doit exister dans la base de données)
    payload = {
            ";'select * from users;--": "Nouveau nom",
            "adresse": "Nouvelle adresse",
            "damn": "test"
    }
    print("Payload de test pour bad request:", payload)
    response = requests.put(f"{lien}/admin/emplacements/{emplacement_id}", json=payload, headers=headers_admin)
    assert response.status_code == 200, f"Code expecter 200, reçu: {response.status_code}"
    #find the db data for that bad request and verify that it has not been changed
    response_get = requests.get(f"{lien}/admin/liste-emplacements", headers=headers_admin)
    emplacement_data=response_get.json()
    emplacement_data=next((item for item in emplacement_data if item["id"] == emplacement_id), None)
    assert emplacement_data["nom"] != ";'select * from users;--", "Le nom de l'emplacement a été modifié avec une valeur invalide"

def test_route_modifier_emplacement_admin_not_found():
    emplacement_id = 9999  # ID d'emplacement qui n'existe pas
    payload = {
        "nom": "Nouveau nom",
        "adresse": "Nouvelle adresse"
    }
    response = requests.put(f"{lien}/admin/emplacements/{emplacement_id}", json=payload, headers=headers_admin)
    assert response.status_code == 400, f"Code expecter 400, reçu: {response.status_code}"

# Retirer les tests qui ont besoin d'etre revister pour les tests. 
# Et eviter de changer la BD

# def test_route_modifier_emplacement_admin_success():
#     emplacement_id = 1  # ID d'emplacement à modifier (doit exister dans la base de données)
#     payload = {
#         "nom": "Nouveau nom",
#     }
#     response = requests.put(f"{lien}/admin/emplacements/{emplacement_id}", json=payload, headers=headers_admin)
#     assert response.status_code == 200, f"Code expecter 200, reçu: {response.status_code}"
#     data = response.json()
#     assert data.get("message") == "Emplacement mis à jour avec succès", f"Message inattendu: {data.get('message')}"
# def test_route_modifier_emplacement_admin_valide_toute_les_champs():
#     emplacement_id = 1  # ID d'emplacement à modifier (doit exister dans la base de données)
#     #get les donnees actuelles de l'emplacement pour les comparer apres la modification
#     response_get = requests.get(f"{lien}/admin/liste-emplacements", headers=headers_admin)
#     emplacement_data=response_get.json()
#     emplacement_data=next((item for item in emplacement_data if item["id"] == emplacement_id), None)
#     payload = {
#         "nom": "Nouveau nom",
#         "adresse": "Nouvelle adresse",
#         "ville": "Nouvelle ville",
#         "code_postal": "12345",
#         "province": "Nouvelle province",
#         "description": "Nouvelle description"
#     }
#     response = requests.put(f"{lien}/admin/emplacements/{emplacement_id}", json=payload, headers=headers_admin)
#     assert response.status_code == 200, f"Code expecter 200, reçu: {response.status_code}"

#     reset_data = requests.put(f"{lien}/admin/emplacements/{emplacement_id}", json=emplacement_data, headers=headers_admin)
#     assert reset_data.status_code == 200, f"Code expecter 200 pour reset, reçu: {reset_data.status_code}"    

def test_route_modifier_emplacement_employee():
    emplacement_id = 1  # ID d'emplacement à modifier (doit exister dans la base de données)
    payload = {
            ";'select * from users;--": "Nouveau nom",
            "adresse": "Nouvelle adresse"
    }
    response = requests.put(f"{lien}/admin/emplacements/{emplacement_id}", json=payload, headers=headers_admin)
    assert response.status_code == 400, f"Code expecter 400, reçu: {response.status_code}"

def test_route_modifier_emplacement_employee():
    emplacement_id = 1  # ID d'emplacement à modifier (doit exister dans la base de données)
    payload = {
        "nom": "Nouveau nom",
        "adresse": "Nouvelle adresse"
    }
    response = requests.put(f"{lien}/admin/emplacements/{emplacement_id}", json=payload, headers=headers_employee)
    assert response.status_code == 403, f"Code expecter 403, reçu: {response.status_code}"

def test_route_modifier_emplacement_non_connecter():
    emplacement_id = 1  # ID d'emplacement à modifier (doit exister dans la base de données)
    payload = {
        "nom": "Nouveau nom",
        "adresse": "Nouvelle adresse"
    }
    response = requests.put(f"{lien}/admin/emplacements/{emplacement_id}", json=payload)
    assert response.status_code == 401, f"Code expecter 401, reçu: {response.status_code}"



if __name__ == "__main__":
    pytest.main([__file__])