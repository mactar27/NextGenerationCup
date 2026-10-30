-- ==========================================================
-- SCRIPT DE CRÉATION DE LA BASE DE DONNÉES MYSQL
-- Tournoi National de Football Élite 2026 (21 Équipes - 630 Joueurs)
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `tournoi_football_2026` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `tournoi_football_2026`;

-- 1. Table Tournoi
CREATE TABLE IF NOT EXISTS `tournament` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `edition` VARCHAR(100) NOT NULL,
  `season` VARCHAR(50) NOT NULL,
  `max_teams` INT NOT NULL DEFAULT 21,
  `max_players_per_team` INT NOT NULL DEFAULT 30,
  `max_match_roster` INT NOT NULL DEFAULT 18,
  `status` VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table Équipes (Exactement 21 équipes)
CREATE TABLE IF NOT EXISTS `teams` (
  `id` VARCHAR(64) PRIMARY KEY,
  `code` VARCHAR(10) UNIQUE NOT NULL,
  `name` VARCHAR(150) UNIQUE NOT NULL,
  `city` VARCHAR(100) NULL,
  `primary_color` VARCHAR(20) NOT NULL DEFAULT '#183b63',
  `secondary_color` VARCHAR(20) NOT NULL DEFAULT '#f5b800',
  `logo_url` TEXT NULL,
  `manager_name` VARCHAR(150) NULL,
  `manager_email` VARCHAR(150) NULL,
  `manager_phone` VARCHAR(50) NULL,
  `status` ENUM('ACTIVE', 'PENDING', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table Utilisateurs (Admin, Dirigeants avec isolation, Officiels)
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) PRIMARY KEY,
  `username` VARCHAR(100) UNIQUE NOT NULL,
  `email` VARCHAR(150) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `password_salt` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `role` ENUM('ADMIN', 'TEAM_MANAGER', 'OFFICIAL') NOT NULL,
  `team_id` VARCHAR(64) NULL,
  `phone` VARCHAR(50) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_users_team` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table Joueurs (Max 30 par équipe)
CREATE TABLE IF NOT EXISTS `players` (
  `id` VARCHAR(64) PRIMARY KEY,
  `team_id` VARCHAR(64) NOT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `birth_date` DATE NOT NULL,
  `nationality` VARCHAR(100) NOT NULL,
  `jersey_number` INT NOT NULL,
  `position` ENUM('GARDIEN', 'DEFENSEUR', 'MILIEU', 'ATTAQUANT') NOT NULL,
  `dominant_foot` VARCHAR(20) DEFAULT 'DROIT',
  `photo_url` TEXT NULL,
  `status` ENUM('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'VALIDATED', 'REJECTED', 'SUSPENDED', 'EXPIRED') NOT NULL DEFAULT 'DRAFT',
  `rejection_reason` TEXT NULL,
  `observations` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_players_team` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE,
  INDEX `idx_players_team` (`team_id`),
  INDEX `idx_player_duplicate` (`first_name`, `last_name`, `birth_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Table Licences Numériques Officielles
CREATE TABLE IF NOT EXISTS `licenses` (
  `id` VARCHAR(64) PRIMARY KEY,
  `player_id` VARCHAR(64) UNIQUE NOT NULL,
  `team_id` VARCHAR(64) NOT NULL,
  `license_number` VARCHAR(50) UNIQUE NOT NULL,
  `verification_token` VARCHAR(64) UNIQUE NOT NULL,
  `season` VARCHAR(50) NOT NULL,
  `issue_date` DATE NOT NULL,
  `expiration_date` DATE NOT NULL,
  `status` ENUM('VALIDATED', 'SUSPENDED', 'EXPIRED', 'REVOKED') NOT NULL DEFAULT 'VALIDATED',
  `qr_svg` MEDIUMTEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_licenses_player` FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_licenses_team` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE,
  INDEX `idx_licenses_token` (`verification_token`),
  INDEX `idx_licenses_num` (`license_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Table Rencontres / Matchs
CREATE TABLE IF NOT EXISTS `matches` (
  `id` VARCHAR(64) PRIMARY KEY,
  `match_number` INT NULL,
  `home_team_id` VARCHAR(64) NOT NULL,
  `away_team_id` VARCHAR(64) NOT NULL,
  `match_date` DATE NOT NULL,
  `match_time` VARCHAR(10) NOT NULL,
  `venue` VARCHAR(150) NOT NULL,
  `phase` VARCHAR(50) NOT NULL DEFAULT 'JOURNEE_1',
  `home_score` INT DEFAULT 0,
  `away_score` INT DEFAULT 0,
  `status` ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'POSTPONED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
  `official_notes` TEXT NULL,
  `validated_by` VARCHAR(150) NULL,
  `validated_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_matches_home` FOREIGN KEY (`home_team_id`) REFERENCES `teams`(`id`),
  CONSTRAINT `fk_matches_away` FOREIGN KEY (`away_team_id`) REFERENCES `teams`(`id`),
  INDEX `idx_matches_date` (`match_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Table Feuilles de Match
CREATE TABLE IF NOT EXISTS `match_rosters` (
  `id` VARCHAR(64) PRIMARY KEY,
  `match_id` VARCHAR(64) NOT NULL,
  `team_id` VARCHAR(64) NOT NULL,
  `player_id` VARCHAR(64) NOT NULL,
  `is_starter` TINYINT(1) NOT NULL DEFAULT 1,
  `jersey_number` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_roster_match` FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_roster_player` FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Table Événements de Match (Buts, Cartons)
CREATE TABLE IF NOT EXISTS `match_events` (
  `id` VARCHAR(64) PRIMARY KEY,
  `match_id` VARCHAR(64) NOT NULL,
  `team_id` VARCHAR(64) NOT NULL,
  `player_id` VARCHAR(64) NULL,
  `event_type` ENUM('GOAL', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION') NOT NULL,
  `minute` INT NOT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_event_match` FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Table Journal d'Audit et Sécurité
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` VARCHAR(64) PRIMARY KEY,
  `user_id` VARCHAR(64) NULL,
  `username` VARCHAR(100) NULL,
  `role` VARCHAR(50) NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` VARCHAR(64) NULL,
  `details` TEXT NULL,
  `ip_address` VARCHAR(50) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
