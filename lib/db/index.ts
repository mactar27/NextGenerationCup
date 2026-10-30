// lib/db/index.ts
import mysql from 'mysql2/promise'
import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'
import fs from 'node:fs'
import { DB_SCHEMA_SQL } from './schema'
import { hashPassword } from '../auth/crypto'

// Mode MySQL prioritaire si activé explicitement
export const IS_MYSQL = process.env.DB_DRIVER === 'mysql'

let _mysqlPool: mysql.Pool | null = null
let _sqliteDb: DatabaseSync | null = null

export function getMysqlPool(): mysql.Pool {
  if (!_mysqlPool) {
    _mysqlPool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'test',
      ssl: process.env.MYSQL_SSL === 'true' || process.env.MYSQL_HOST?.includes('tidbcloud.com') ? {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
      } : undefined,
      waitForConnections: true,
      connectionLimit: 15,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    })
  }
  return _mysqlPool
}

// Interface unifiée synchrone/asynchrone pour l'exécution SQL
export async function executeQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (IS_MYSQL) {
    const pool = getMysqlPool()
    const [rows] = await pool.query(sql, params)
    return rows as T[]
  } else {
    const db = getSqliteDatabase()
    const stmt = db.prepare(sql)
    return stmt.all(...params) as T[]
  }
}

export async function executeSingle<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await executeQuery<T>(sql, params)
  return rows && rows.length > 0 ? rows[0] : null
}

export async function executeCommand(sql: string, params: any[] = []): Promise<any> {
  if (IS_MYSQL) {
    const pool = getMysqlPool()
    const [result] = await pool.query(sql, params)
    return result
  } else {
    const db = getSqliteDatabase()
    const stmt = db.prepare(sql)
    return stmt.run(...params)
  }
}

export function getSqliteDatabase(): DatabaseSync {
  if (!_sqliteDb) {
    const DB_DIR = path.join(process.cwd(), 'data')
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true })
    }
    const DB_PATH = path.join(DB_DIR, 'tournament.db')
    _sqliteDb = new DatabaseSync(DB_PATH)
    _sqliteDb.exec('PRAGMA foreign_keys = ON;')
    _sqliteDb.exec('PRAGMA journal_mode = WAL;')
    _sqliteDb.exec(DB_SCHEMA_SQL)
    ensureDefaultAdminSqlite(_sqliteDb)
  }
  return _sqliteDb
}

// Création du compte administrateur unique nécessaire lors de la première installation
async function ensureDefaultAdminSqlite(db: DatabaseSync) {
  const admin = db.prepare("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1").get()
  if (!admin) {
    const adminPwd = hashPassword('Admin2026!Secure')
    db.prepare(`
      INSERT INTO tournament (id, name, edition, season, max_teams, max_players_per_team, max_match_roster, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('tourney_2026', 'Tournoi National de Football Élite 2026', 'Édition 2026', '2026-2027', 21, 30, 18, 'IN_PROGRESS')

    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, password_salt, full_name, role, team_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('user_admin_01', 'admin', 'admin@tournoi-elite.com', adminPwd.hash, adminPwd.salt, 'Administrateur Principal', 'ADMIN', null)
  }
}

// Compatibilité avec les modules existants
export function getDatabase(): DatabaseSync {
  return getSqliteDatabase()
}
