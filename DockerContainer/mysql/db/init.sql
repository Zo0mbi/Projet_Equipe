CREATE DATABASE IF NOT EXISTS Parkflow_Gestionnaire_Contravention CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE Parkflow_Gestionnaire_Contravention;
SET NAMES utf8mb4;
SET time_zone = 'SYSTEM';

-- Compte utilisateur pour l'administration de la base de données, avec accès depuis n'importe quelle adresse IP (172.% pour limiter aux adresses IP privées, mais peut être ajusté selon les besoins)
-- Utilisation de @172.% pour permettre l'accès depuis Docker. Une autre option pas testées est le nom du conteneur.
CREATE USER IF NOT EXISTS 'ToothHenchAdmin832'@'%' IDENTIFIED
WITH mysql_native_password BY '@DxVNTwNrefDibVyGPfyzok6T!eifeM8nfhh3hJbBvUe86dDCqpfa6V';

-- Grant les permissions de la base de données.
GRANT SELECT, INSERT, UPDATE, DELETE
ON Parkflow_Gestionnaire_Contravention.* TO 'ToothHenchAdmin832'@'%';

-- Assurer que les privilèges sont appliqués à la création de la base de données et à l'ajout de l'utilisateur.
FLUSH PRIVILEGES;
-- =========================
-- raisons_contravention (RAISONS DE CONTRAVENTION)
-- =========================
CREATE TABLE raisons_contravention (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    montant DECIMAL(10,2) NOT NULL DEFAULT 30.00,
    date_entrer TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_raisons_contravention_deleted_at (deleted_at)
);

-- =========================
-- ROLES
-- Présente version 1.0 : 4 rôles pré-définis (public, employe, admin, system) (ID vont changer pour la prod)
-- Role id 1: public, (Utilisateur standard, peut contester, payer des contraventions, etc.)
-- Role id 2: employe, (Employé de stationnement, peut émettre des contraventions, mais ne peut pas contester ou payer)
-- Role id 3: admin, (Admin, peut tout faire, y compris gérer les utilisateurs, les rôles, etc.)
-- Role id 4: system (Compte système pour les actions automatiques, comme les mises à jour d'état, etc.)
-- =========================
CREATE TABLE roles (
    id INT PRIMARY KEY,
    nom VARCHAR(50) UNIQUE NOT NULL
);

-- =========================
-- utilisateurs
-- Foreign key : role_id references roles(id) -- Relationship: Plusieurs utilisateurs pour un rôle (N...1)
-- =========================
CREATE TABLE utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prenom VARCHAR(100),
    nom VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    numero_telephone VARCHAR(20),
    mot_de_passe VARCHAR(255) NOT NULL,
    role_id INT,
    date_entrer TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    est_actif BOOLEAN DEFAULT TRUE, -- Champs pour gérer l'activation/désactivation des comptes utilisateurs sans les supprimer de la base de données
    FOREIGN KEY (role_id) REFERENCES roles(id), -- N...1 with roles
    INDEX idx_utilisateurs_role (role_id)
);

-- =========================
-- vehicules (PLAQUES)
-- Foreign key : owner_id references utilisateurs(id) (utilisateur propriétaire du véhicule)
-- Relation: un utilisateur peut posseder plusieurs vehicules (1...N)
-- Si pas de propriétaire, owner_id peut être NULL
-- =========================
CREATE TABLE vehicules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_plaque VARCHAR(20) NOT NULL,
    province VARCHAR(50),
    marque VARCHAR(50),
    modele VARCHAR(50),
    owner_id INT,
    UNIQUE (numero_plaque, province),
    FOREIGN KEY (owner_id) REFERENCES utilisateurs(id), -- 0...N with utilisateurs (optionnel)
    INDEX idx_vehicules_owner (owner_id)
);

-- =========================
-- emplacements (STATIONNEMENTS)
-- Un emplacement représente un stationnement
-- Default ville et province à Québec pour simplifier, mais peut être modifié pour supporter d'autres villes/provinces à l'avenir
-- Dans le cas present la compagnie est limitée à la ville de Québec, mais la structure permet une expansion future si nécessaire
-- =========================
CREATE TABLE emplacements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    adresse VARCHAR(255) NOT NULL,
    ville VARCHAR(100) DEFAULT 'Québec',
    province VARCHAR(50) DEFAULT 'QC',
    code_postal VARCHAR(10),
    description TEXT,
    created_by INT,
    date_entrer TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    FOREIGN KEY (created_by) REFERENCES utilisateurs(id),
    INDEX idx_emplacements_ville_nom (ville, nom),
    INDEX idx_emplacements_created_by (created_by),
    INDEX idx_emplacements_deleted_at (deleted_at)
);

-- =========================
-- contravention (CONTRAVENTIONS)
-- Foreign keys : vehicle_id references vehicules(id), (vehicule concerné par la contravention)
-- attribuer_par references utilisateurs(id) (employe/admin qui a attribué la contravention)
-- raisons_id references raisons_contravention(id) (raison pré-définie de la contravention)
-- emplacement_id references emplacements(id) (stationnement où la contravention a été attribuée)
-- raison_custom (si la raison n'est pas pré-définie, l'employe/admin peut entrer une raison personnalisée)
-- =========================
CREATE TABLE contravention (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_contravention VARCHAR(50) UNIQUE NOT NULL,
    vehicle_id INT NOT NULL,
    attribuer_par INT NOT NULL,
    raisons_id INT,
    raison_custom TEXT,
    montant DECIMAL(10,2) NOT NULL DEFAULT 30.00,
    etat_contravention ENUM('impayee', 'payee', 'contestee', 'annulee', 'avertissement') DEFAULT 'impayee',
    emplacement_id INT NOT NULL,
    date_entrer TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    modifier_par INT,
    commentaire_admin TEXT,

    FOREIGN KEY (modifier_par) REFERENCES utilisateurs(id), -- 0...N with utilisateurs (optionnel, pour savoir qui a effectué la dernière modification)
    FOREIGN KEY (vehicle_id) REFERENCES vehicules(id), -- N...1 with vehicules
    FOREIGN KEY (attribuer_par) REFERENCES utilisateurs(id), -- N...1 with utilisateurs
    FOREIGN KEY (raisons_id) REFERENCES raisons_contravention(id), -- 0...N with raisons_contravention (optionnel)
    FOREIGN KEY (emplacement_id) REFERENCES emplacements(id), -- N...1 with emplacements
    CHECK (montant >= 0),
    CHECK (raisons_id IS NOT NULL OR (raison_custom IS NOT NULL AND CHAR_LENGTH(TRIM(raison_custom)) > 0)),
    INDEX idx_contravention_vehicle_date (vehicle_id, date_entrer),
    INDEX idx_contravention_etat_date (etat_contravention, date_entrer),
    INDEX idx_contravention_emplacement_date (emplacement_id, date_entrer),
    INDEX idx_contravention_attribue_par (attribuer_par),
    INDEX idx_contravention_raisons (raisons_id)
);

-- =========================
-- LOGS (ADMIN)
-- Table pour enregistrer les actions importantes dans le système, comme les tentatives d'accès non autorisées, les modifications de contraventions,etc.
-- Foreign key : user_id references utilisateurs(id) (utilisateur qui a effectué l'action, peut être NULL pour les actions système ou les tentatives d'accès non autorisées sans utilisateur identifié)
-- =========================
CREATE TABLE logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    categorie VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NULL,
    path VARCHAR(255) NULL,
    method VARCHAR(10) NULL,
    reason VARCHAR(255) NULL,
    details TEXT NULL,
    date_entrer TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_categorie (categorie),
    INDEX idx_action (action),
    INDEX idx_date_entrer (date_entrer),
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);


-- =========================
-- Import des données initiales pour les rôles, utilisateurs, emplacements et raisons de contraventions
-- =========================

-- Insert roles
-- Role id 1: public, (Utilisateur standard, peut contester, payer des contraventions, etc.)
-- Role id 2: employe, (Employé de stationnement, peut émettre des contraventions, mais ne peut pas contester ou payer)
-- Role id 3: admin, (Admin, peut tout faire, y compris gérer les utilisateurs, les rôles, etc.)
-- Role id 4: system (Compte système pour les actions automatiques, comme les mises à jour d'état, etc.)
INSERT INTO roles (id, nom) VALUES
(1, 'public'),
(2, 'employe'),
(3, 'admin'),
(4, 'system');

-- INSERTION D'un UTILISATEUR PAR DEFAUT POUR METTRE EN PLACE L'APPLICATION POUR LE Déploiement, AVEC ROLE ADMIN (role_id = 3)
-- Insert utilisateurs predefinis.
-- Admin : bossman@hotmail.com / lune3211 (role admin = 3)
INSERT INTO utilisateurs (prenom, nom, email, mot_de_passe, role_id) VALUES
('Big', 'Coune', 'bossman@hotmail.com', '$pbkdf2-sha256$29000$.h9DyNlbS4lRSum9V8r5Pw$XcUSTY3maRdcKnN5gkIVD9a5GFBwMIJ9dQT.qO9QBn4', 3);
-- Insert locations predefinis (Emplacements des stationnements)
INSERT INTO emplacements (nom, adresse, ville, description) VALUES 
('Samson', '270 rue St-Paul', 'Québec', 'Stationnement Samson'),
('St-Thomas', '217 rue St-Paul', 'Québec', 'Stationnement St-Thomas'),
('Des Bains', '6 ruelle des Bains', 'Québec', 'Stationnement Des Bains'),
('Laennec', '1750 rue de Vitré', 'Québec', 'Stationnement Laennec'),
('Jardin du Vallon', '2430 avenue Chapdelaine', 'Québec', 'Stationnement Jardin du Vallon'),
('Polyclinique', '4225 4e avenue', 'Québec', 'Stationnement Polyclinique'),
('Champlain', '25 rue du Marché-Champlain', 'Québec', 'Stationnement Champlain');

-- Insert emplacements predefinis (Emplacements des stationnements) 
INSERT INTO emplacements (nom, adresse, ville, province, code_postal, description) VALUES
('3075 Quatre-Bourgeois', '3075 chemin Quatre-Bourgeois', 'Québec', 'QC', 'G1W 4X5', NULL),
('500 Grande Allée', '500 Grande Allée E', 'Québec', 'QC', 'G1R 4Y8', NULL),
('990 de Bourgogne', '990 avenue de Bourgogne', 'Québec', 'QC', 'G1W 0E8', NULL),
('AM/FM', '796 avenue Myrand', 'Québec', 'QC', 'G1V 2V4', NULL),
('Boréal', '1137 route de l''Église', 'Québec', 'QC', 'G1V 3W4', NULL),
('Centre Affaire Henri IV', '1015 avenue Wilfrid-Pelletier', 'Québec', 'QC', 'G1W 0C4', NULL),
('Clinique Sillery', '1363 avenue Maguire', 'Québec', 'QC', 'G1T 1Z2', NULL),
('Clinique Saint-Louis', '3165 chemin Saint-Louis', 'Québec', 'QC', 'G1W 4R4', NULL),
('Complexe de la Capitale', '5300 boulevard des Galeries', 'Québec', 'QC', 'G2K 2A2', NULL),
('Cosmo - Laurier', '2813 boulevard Laurier', 'Québec', 'QC', 'G1V 2L9', NULL),
('Delta', '2875 boulevard Laurier', 'Québec', 'QC', 'G1V 2M2', NULL),
('Desjardins Sillery', '1444 avenue Maguire', 'Québec', 'QC', 'G1T 1Z3', NULL),
('Distric GC', '5350 boulevard Guillaume-Couture', 'Lévis', 'QC', 'G6V 4Z9', NULL),
('Édifice CIBC', '79 boulevard René-Lévesque Est', 'Québec', 'QC', 'G1R 5N5', NULL),
('Cité Verte', '1200 rue des Soeurs-du-Bon-Pasteur', 'Québec', 'QC', 'G1S 0B9', NULL),
('La promenade', '125 rue Dalhousie', 'Québec', 'QC', 'G1K 4C5', NULL),
('Le QG', '990 route de l''Église', 'Québec', 'QC', 'G1V 3V5', NULL),
('Le Maguire', '1415 avenue Maguire', 'Québec', 'QC', 'G1T 1Z3', NULL),
('Monastère des Augustines', '77 rue des Remparts', 'Québec', 'QC', 'G1R 0C3', NULL),
('Place-Québec', '875 rue Saint-Joachim', 'Québec', 'QC', 'G1R 1X1', NULL),
('St-Patrick', '140 Grande Allée Est', 'Québec', 'QC', 'G1R 2W7', NULL),
('Synase', '1825 boulevard Henri-Bourassa', 'Québec', 'QC', 'G1J 3W9', NULL),
('Terrasse du vieux port', '76 rue Dalhousie', 'Québec', 'QC', 'G1K 8W6', NULL),
('Tour Fresk', '380 rue de la Couronne', 'Québec', 'QC', 'G1K 0G5', NULL);

-- Les raisons de contraventions de base.
INSERT INTO raisons_contravention (nom, description, montant) VALUES
('Frais de stationnement non acquitté', 'Le véhicule était stationné sans que les frais de stationnement aient été payés.', 30.00),
('Temps de location expiré', 'Le véhicule était stationné au-delà du temps de location autorisé.', 30.00),
('Permis échu', 'Le véhicule était stationné sans que le permis de stationnement soit visible.', 30.00),
('Zone pour les handicapés', 'Le véhicule était stationné dans une zone réservée aux personnes handicapées.', 30.00),
('Zone pour les visiteurs', 'Le véhicule était stationné dans une zone réservée aux visiteurs.', 30.00),
('Espace réservé', 'Le véhicule était stationné dans un espace réservé à une personne ou un groupe spécifique.', 30.00),
('Stationnement dans une allée', 'Le véhicule était stationné dans une allée, bloquant l''accès aux autres véhicules.', 30.00),
('Stationnement interdit', 'Le véhicule était stationné dans une zone où le stationnement est interdit.', 30.00);