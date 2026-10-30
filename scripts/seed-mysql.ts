// scripts/seed-mysql.ts
import mysql from 'mysql2/promise'
import crypto from 'node:crypto'

function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return { hash, salt }
}

function generateLicenseNumber(seq: number, year = 2026): string {
  const padded = String(seq).padStart(4, '0')
  return `TFB-${year}-${padded}`
}

function generateToken(length = 16): string {
  return crypto.randomBytes(length).toString('hex')
}

function generateQRCodeSVG(text: string, size = 180): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="#ffffff" rx="8"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="10" fill="#111827">QR_VERIFY</text></svg>`
}

async function seed() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'M@tzo2705',
    database: 'tournoi_football_2026'
  })

  console.log('Connecté à MySQL tournoi_football_2026...')

  // 1. Tournoi
  const [rows]: any = await connection.query('SELECT id FROM tournament LIMIT 1')
  if (rows.length === 0) {
    await connection.query(`
      INSERT INTO tournament (id, name, edition, season, max_teams, max_players_per_team, max_match_roster, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'tourney_2026',
      'Tournoi National de Football Élite 2026',
      'Édition 2026',
      '2026-2027',
      21,
      30,
      18,
      'IN_PROGRESS'
    ])
  }

  // 2. Admin & Officiel
  const adminPwd = hashPassword('Admin2026!Secure')
  await connection.query(`
    INSERT IGNORE INTO users (id, username, email, password_hash, password_salt, full_name, role, team_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'user_admin_01',
    'admin',
    'admin@tournoi-elite.com',
    adminPwd.hash,
    adminPwd.salt,
    'Directeur de Compétition',
    'ADMIN',
    null
  ])

  const officialPwd = hashPassword('Officiel2026!')
  await connection.query(`
    INSERT IGNORE INTO users (id, username, email, password_hash, password_salt, full_name, role, team_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'user_official_01',
    'officiel',
    'officiel@tournoi-elite.com',
    officialPwd.hash,
    officialPwd.salt,
    'Arbitre Responsable Technique',
    'OFFICIAL',
    null
  ])

  // 3. Les 21 équipes officielles
  const officialTeams = [
    { code: 'FCB', name: 'FC Barcelona Academy', city: 'Barcelone', color: '#a50044', dir: 'Xavi Hernandez', email: 'barca@tournoi.fr' },
    { code: 'RMA', name: 'Real Madrid Castilla', city: 'Madrid', color: '#00529f', dir: 'Raul Gonzalez', email: 'real@tournoi.fr' },
    { code: 'PSG', name: 'Paris Saint-Germain U23', city: 'Paris', color: '#004170', dir: 'Zoumana Camara', email: 'psg@tournoi.fr' },
    { code: 'BAY', name: 'Bayern Munich Amateure', city: 'Munich', color: '#dc052d', dir: 'Holger Seitz', email: 'bayern@tournoi.fr' },
    { code: 'LIV', name: 'Liverpool FC Reserves', city: 'Liverpool', color: '#c8102e', dir: 'Barry Lewtas', email: 'liverpool@tournoi.fr' },
    { code: 'MIL', name: 'AC Milan Primavera', city: 'Milan', color: '#fb090b', dir: 'Ignazio Abate', email: 'milan@tournoi.fr' },
    { code: 'JUV', name: 'Juventus Next Gen', city: 'Turin', color: '#000000', dir: 'Massimo Brambilla', email: 'juventus@tournoi.fr' },
    { code: 'MCI', name: 'Manchester City EDS', city: 'Manchester', color: '#6cabdd', dir: 'Brian Barry-Murphy', email: 'mancity@tournoi.fr' },
    { code: 'ARS', name: 'Arsenal Academy', city: 'Londres', color: '#db0007', dir: 'Mehmet Ali', email: 'arsenal@tournoi.fr' },
    { code: 'CHE', name: 'Chelsea Development Squad', city: 'Londres', color: '#034694', dir: 'Mark Robinson', email: 'chelsea@tournoi.fr' },
    { code: 'INT', name: 'Inter Milan Primavera', city: 'Milan', color: '#001489', dir: 'Christian Chivu', email: 'inter@tournoi.fr' },
    { code: 'ATM', name: 'Atlético de Madrid B', city: 'Madrid', color: '#cb3524', dir: 'Luis Garcia Tevenet', email: 'atletico@tournoi.fr' },
    { code: 'DOR', name: 'Borussia Dortmund II', city: 'Dortmund', color: '#fde100', dir: 'Jan Zimmermann', email: 'dortmund@tournoi.fr' },
    { code: 'BEN', name: 'SL Benfica B', city: 'Lisbonne', color: '#e41c2d', dir: 'Nelson Verissimo', email: 'benfica@tournoi.fr' },
    { code: 'POR', name: 'FC Porto B', city: 'Porto', color: '#003882', dir: 'Antonio Folha', email: 'porto@tournoi.fr' },
    { code: 'AJA', name: 'Jong Ajax', city: 'Amsterdam', color: '#d2122e', dir: 'Dave Vos', email: 'ajax@tournoi.fr' },
    { code: 'OLY', name: 'Olympique Lyonnais Pro 2', city: 'Lyon', color: '#14387f', dir: 'Gueida Fofana', email: 'lyon@tournoi.fr' },
    { code: 'MAR', name: 'Olympique de Marseille B', city: 'Marseille', color: '#2faee0', dir: 'Jean-Pierre Papin', email: 'marseille@tournoi.fr' },
    { code: 'MON', name: 'AS Monaco Elite', city: 'Monaco', color: '#e31b23', dir: 'Damien Perrinelle', email: 'monaco@tournoi.fr' },
    { code: 'LIL', name: 'LOSC Lille Pro 2', city: 'Lille', color: '#e01e2b', dir: 'Stephane Pichot', email: 'lille@tournoi.fr' },
    { code: 'REN', name: 'Stade Rennais Espoirs', city: 'Rennes', color: '#e2001a', dir: 'Pierre-Emmanuel Bourdeau', email: 'rennes@tournoi.fr' }
  ]

  const defaultManagerPwd = hashPassword('Dirigeant2026!')
  let seq = 1

  for (let index = 0; index < officialTeams.length; index++) {
    const t = officialTeams[index]
    const teamId = `team_${String(index + 1).padStart(2, '0')}`

    await connection.query(`
      INSERT IGNORE INTO teams (id, code, name, city, primary_color, secondary_color, manager_name, manager_email, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
    `, [teamId, t.code, t.name, t.city, t.color, '#f5b800', t.dir, t.email])

    const managerUsername = `dir_${t.code.toLowerCase()}`
    await connection.query(`
      INSERT IGNORE INTO users (id, username, email, password_hash, password_salt, full_name, role, team_id, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      `user_dir_${t.code.toLowerCase()}`,
      managerUsername,
      t.email,
      defaultManagerPwd.hash,
      defaultManagerPwd.salt,
      t.dir,
      'TEAM_MANAGER',
      teamId,
      '+33 6 00 00 00 ' + String(index + 1).padStart(2, '0')
    ])

    if (index === 0 || index === 1) {
      const sample = [
        { fn: 'Mamadou', ln: 'DIALLO', b: '2002-04-15', nat: 'Sénégalaise', num: 10, pos: 'ATTAQUANT', st: 'VALIDATED' },
        { fn: 'Lucas', ln: 'BERNARD', b: '2001-08-22', nat: 'Française', num: 1, pos: 'GARDIEN', st: 'VALIDATED' },
        { fn: 'David', ln: 'SILVA', b: '2003-01-10', nat: 'Espagnole', num: 4, pos: 'DEFENSEUR', st: 'VALIDATED' },
        { fn: 'Karim', ln: 'BENALI', b: '2004-11-05', nat: 'Française', num: 8, pos: 'MILIEU', st: 'SUBMITTED' },
        { fn: 'Alexandre', ln: 'MULLER', b: '2002-06-30', nat: 'Allemande', num: 9, pos: 'ATTAQUANT', st: 'DRAFT' }
      ]

      for (let pIdx = 0; pIdx < sample.length; pIdx++) {
        const p = sample[pIdx]
        const pId = `player_${teamId}_${pIdx + 1}`
        await connection.query(`
          INSERT IGNORE INTO players (id, team_id, first_name, last_name, birth_date, nationality, jersey_number, position, dominant_foot, status, observations)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'DROIT', ?, 'Dossier initial')
        `, [pId, teamId, p.fn, p.ln, p.b, p.nat, p.num, p.pos, p.st])

        if (p.st === 'VALIDATED') {
          const licNum = generateLicenseNumber(seq++, 2026)
          const token = generateToken(16)
          const verifyUrl = `http://localhost:3000/verify/${token}`
          const qrSvg = generateQRCodeSVG(verifyUrl, 160)

          await connection.query(`
            INSERT IGNORE INTO licenses (id, player_id, team_id, license_number, verification_token, season, issue_date, expiration_date, status, qr_svg)
            VALUES (?, ?, ?, ?, ?, '2026-2027', '2026-11-01', '2027-06-30', 'VALIDATED', ?)
          `, [`lic_${pId}`, pId, teamId, licNum, token, qrSvg])
        }
      }
    }
  }

  // 4. Initial Matches
  await connection.query(`
    INSERT IGNORE INTO matches (id, match_number, home_team_id, away_team_id, match_date, match_time, venue, phase, home_score, away_score, status)
    VALUES
      ('match_01', 1, 'team_01', 'team_02', '2026-11-15', '14:00', 'Grand Stade Olympique', 'JOURNEE_1', 0, 0, 'SCHEDULED'),
      ('match_02', 2, 'team_03', 'team_04', '2026-11-15', '16:30', 'Parc des Sports - Terrain A', 'JOURNEE_1', 0, 0, 'SCHEDULED'),
      ('match_03', 3, 'team_05', 'team_06', '2026-11-15', '19:00', 'Stade Municipal', 'JOURNEE_1', 2, 1, 'COMPLETED')
  `)

  // 5. Audit Log
  await connection.query(`
    INSERT IGNORE INTO audit_logs (id, user_id, username, role, action, entity_type, entity_id, details)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'audit_init_mysql',
    'user_admin_01',
    'admin',
    'ADMIN',
    'INITIALISATION_MYSQL',
    'DATABASE',
    'tournoi_football_2026',
    'Initialisation complète de la base de données MySQL avec les 21 équipes et l\'isolation des dirigeants.'
  ])

  console.log('✅ Base de données MySQL peuplée avec succès !')
  await connection.end()
}

seed().catch(err => {
  console.error('Erreur seed MySQL:', err)
  process.exit(1)
})
