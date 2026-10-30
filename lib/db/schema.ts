// lib/db/schema.ts
export const DB_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS tournament (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  edition TEXT NOT NULL,
  season TEXT NOT NULL,
  max_teams INTEGER NOT NULL DEFAULT 21,
  max_players_per_team INTEGER NOT NULL DEFAULT 30,
  max_match_roster INTEGER NOT NULL DEFAULT 18,
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('ADMIN', 'TEAM_MANAGER', 'OFFICIAL')),
  team_id TEXT,
  phone TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT UNIQUE NOT NULL,
  city TEXT,
  primary_color TEXT NOT NULL DEFAULT '#183b63',
  secondary_color TEXT NOT NULL DEFAULT '#f5b800',
  logo_url TEXT,
  manager_name TEXT,
  manager_email TEXT,
  manager_phone TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'PENDING', 'SUSPENDED')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  nationality TEXT NOT NULL,
  jersey_number INTEGER NOT NULL,
  position TEXT NOT NULL CHECK(position IN ('GARDIEN', 'DEFENSEUR', 'MILIEU', 'ATTAQUANT')),
  dominant_foot TEXT DEFAULT 'DROIT',
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'VALIDATED', 'REJECTED', 'SUSPENDED', 'EXPIRED')),
  rejection_reason TEXT,
  observations TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS licenses (
  id TEXT PRIMARY KEY,
  player_id TEXT UNIQUE NOT NULL,
  team_id TEXT NOT NULL,
  license_number TEXT UNIQUE NOT NULL,
  verification_token TEXT UNIQUE NOT NULL,
  season TEXT NOT NULL,
  issue_date TEXT NOT NULL,
  expiration_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'VALIDATED' CHECK(status IN ('VALIDATED', 'SUSPENDED', 'EXPIRED', 'REVOKED')),
  qr_svg TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  match_number INTEGER,
  home_team_id TEXT NOT NULL,
  away_team_id TEXT NOT NULL,
  match_date TEXT NOT NULL,
  match_time TEXT NOT NULL,
  venue TEXT NOT NULL,
  phase TEXT NOT NULL DEFAULT 'JOURNEE_1',
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK(status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'POSTPONED', 'CANCELLED')),
  official_notes TEXT,
  validated_by TEXT,
  validated_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (home_team_id) REFERENCES teams(id),
  FOREIGN KEY (away_team_id) REFERENCES teams(id)
);

CREATE TABLE IF NOT EXISTS match_rosters (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  is_starter INTEGER NOT NULL DEFAULT 1,
  jersey_number INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS match_events (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  player_id TEXT,
  event_type TEXT NOT NULL CHECK(event_type IN ('GOAL', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION')),
  minute INTEGER NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  username TEXT,
  role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_licenses_token ON licenses(verification_token);
CREATE INDEX IF NOT EXISTS idx_licenses_num ON licenses(license_number);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
`
