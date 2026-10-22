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
