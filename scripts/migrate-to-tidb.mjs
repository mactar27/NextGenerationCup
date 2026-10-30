import mysql from 'mysql2/promise';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

async function migrate() {
  console.log('Connecting to TiDB Cloud (gateway01.ap-northeast-1.prod.aws.tidbcloud.com)...');
  const conn = await mysql.createConnection({
    host: 'gateway01.ap-northeast-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '3wXyd41nzVW7kBj.root',
    password: 'p908cpybJOZhCzqW',
    database: 'test',
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
    }
  });

  console.log('Creating database if not exists: nextgen_cup_2026...');
  await conn.query('CREATE DATABASE IF NOT EXISTS nextgen_cup_2026;');
  await conn.query('USE nextgen_cup_2026;');

  console.log('Creating tables in TiDB Cloud...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS tournament (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      edition VARCHAR(100) NOT NULL,
      season VARCHAR(50) NOT NULL,
      max_teams INT NOT NULL DEFAULT 21,
      max_players_per_team INT NOT NULL DEFAULT 30,
      max_match_roster INT NOT NULL DEFAULT 18,
      status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS teams (
      id VARCHAR(64) PRIMARY KEY,
      code VARCHAR(10) UNIQUE NOT NULL,
      name VARCHAR(150) UNIQUE NOT NULL,
      city VARCHAR(100) NULL,
      primary_color VARCHAR(20) NOT NULL DEFAULT '#183b63',
      secondary_color VARCHAR(20) NOT NULL DEFAULT '#f5b800',
      logo_url TEXT NULL,
      manager_name VARCHAR(150) NULL,
      manager_email VARCHAR(150) NULL,
      manager_phone VARCHAR(50) NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      password_salt VARCHAR(255) NOT NULL,
      full_name VARCHAR(150) NOT NULL,
      role VARCHAR(50) NOT NULL,
      team_id VARCHAR(64) NULL,
      phone VARCHAR(50) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS players (
      id VARCHAR(64) PRIMARY KEY,
      team_id VARCHAR(64) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      birth_date VARCHAR(50) NOT NULL,
      nationality VARCHAR(100) NOT NULL,
      jersey_number INT NOT NULL,
      position VARCHAR(50) NOT NULL,
      dominant_foot VARCHAR(20) DEFAULT 'DROIT',
      photo_url LONGTEXT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
      rejection_reason TEXT NULL,
      observations TEXT NULL,
      address TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_players_team (team_id)
    );
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS licenses (
      id VARCHAR(64) PRIMARY KEY,
      player_id VARCHAR(64) UNIQUE NOT NULL,
      team_id VARCHAR(64) NOT NULL,
      license_number VARCHAR(50) UNIQUE NOT NULL,
      verification_token VARCHAR(64) UNIQUE NOT NULL,
      season VARCHAR(50) NOT NULL,
      issue_date VARCHAR(50) NOT NULL,
      expiration_date VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'VALIDATED',
      qr_svg LONGTEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_licenses_token (verification_token),
      INDEX idx_licenses_num (license_number)
    );
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS matches (
      id VARCHAR(64) PRIMARY KEY,
      match_number INT NULL,
      home_team_id VARCHAR(64) NOT NULL,
      away_team_id VARCHAR(64) NOT NULL,
      match_date VARCHAR(50) NOT NULL,
      match_time VARCHAR(20) NOT NULL,
      venue VARCHAR(150) NOT NULL,
      phase VARCHAR(50) NOT NULL DEFAULT 'JOURNEE_1',
      home_score INT DEFAULT 0,
      away_score INT DEFAULT 0,
      status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
      official_notes TEXT NULL,
      validated_by VARCHAR(150) NULL,
      validated_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS match_rosters (
      id VARCHAR(64) PRIMARY KEY,
      match_id VARCHAR(64) NOT NULL,
      team_id VARCHAR(64) NOT NULL,
      player_id VARCHAR(64) NOT NULL,
      is_starter TINYINT(1) NOT NULL DEFAULT 1,
      jersey_number INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS match_events (
      id VARCHAR(64) PRIMARY KEY,
      match_id VARCHAR(64) NOT NULL,
      team_id VARCHAR(64) NOT NULL,
      player_id VARCHAR(64) NULL,
      event_type VARCHAR(50) NOT NULL,
      minute INT NOT NULL,
      notes TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NULL,
      username VARCHAR(100) NULL,
      role VARCHAR(50) NULL,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id VARCHAR(64) NULL,
      details TEXT NULL,
      ip_address VARCHAR(50) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrate SQLite data to TiDB
  const sqliteDb = new DatabaseSync(path.join(process.cwd(), 'data', 'tournament.db'));

  console.log('Migrating data from SQLite to TiDB Cloud...');
  const tables = ['tournament', 'teams', 'users', 'players', 'licenses', 'matches', 'match_rosters', 'match_events', 'audit_logs'];

  for (const table of tables) {
    const rows = sqliteDb.prepare(`SELECT * FROM ${table}`).all();
    if (rows && rows.length > 0) {
      console.log(`- Migrating table ${table} (${rows.length} rows)...`);
      for (const row of rows) {
        const keys = Object.keys(row);
        const values = Object.values(row);
        const placeholders = keys.map(() => '?').join(', ');
        const updateClause = keys.map(k => `\`${k}\` = VALUES(\`${k}\`)`).join(', ');
        const sql = `INSERT INTO \`${table}\` (${keys.map(k => `\`${k}\``).join(', ')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateClause}`;
        await conn.execute(sql, values);
      }
    }
  }

  console.log('Migration complete!');
  await conn.end();
}

migrate().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
