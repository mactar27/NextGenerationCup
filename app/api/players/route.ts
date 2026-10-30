// app/api/players/route.ts
import { NextResponse } from 'next/server'
import { requireAuth, requireTeamAccess } from '@/lib/auth/guard'
import { getMysqlPool, IS_MYSQL, getDatabase } from '@/lib/db'
import { logAudit } from '@/lib/services/audit'
import crypto from 'node:crypto'

// GET /api/players
export async function GET(req: Request) {
  try {
    const user = await requireAuth()
    const url = new URL(req.url)
    const requestedTeamId = url.searchParams.get('teamId')

    if (IS_MYSQL) {
      const pool = getMysqlPool()

      if (user.role === 'TEAM_MANAGER') {
        if (!user.teamId) return NextResponse.json({ players: [] })
        const [rows] = await pool.query(`
          SELECT p.*, t.name as team_name, t.code as team_code, t.logo_url as team_logo_url, t.primary_color as team_primary_color,
            l.license_number, l.verification_token, l.status as license_status, l.qr_svg
          FROM players p
          JOIN teams t ON t.id = p.team_id
          LEFT JOIN licenses l ON l.player_id = p.id
          WHERE p.team_id = ?
          ORDER BY p.jersey_number ASC, p.last_name ASC
        `, [user.teamId])
        return NextResponse.json({ players: rows })
      }

      let query = `
        SELECT p.*, t.name as team_name, t.code as team_code, t.logo_url as team_logo_url, t.primary_color as team_primary_color,
          l.license_number, l.verification_token, l.status as license_status, l.qr_svg
        FROM players p
        JOIN teams t ON t.id = p.team_id
        LEFT JOIN licenses l ON l.player_id = p.id
      `
      const params: any[] = []
      if (requestedTeamId) {
        query += ` WHERE p.team_id = ? `
        params.push(requestedTeamId)
      }
      query += ` ORDER BY t.name ASC, p.jersey_number ASC `

      const [rows] = await pool.query(query, params)
      return NextResponse.json({ players: rows })
    }

    // Fallback SQLite
    const db = getDatabase()
    if (user.role === 'TEAM_MANAGER') {
      if (!user.teamId) return NextResponse.json({ players: [] })
      const players = db.prepare(`
        SELECT p.*, t.name as team_name, t.code as team_code, t.logo_url as team_logo_url, t.primary_color as team_primary_color,
          l.license_number, l.verification_token, l.status as license_status, l.qr_svg
        FROM players p
        JOIN teams t ON t.id = p.team_id
        LEFT JOIN licenses l ON l.player_id = p.id
        WHERE p.team_id = ?
        ORDER BY p.jersey_number ASC, p.last_name ASC
      `).all(user.teamId)
      return NextResponse.json({ players })
    }

    let query = `
      SELECT p.*, t.name as team_name, t.code as team_code, t.logo_url as team_logo_url, t.primary_color as team_primary_color,
        l.license_number, l.verification_token, l.status as license_status, l.qr_svg
      FROM players p
      JOIN teams t ON t.id = p.team_id
      LEFT JOIN licenses l ON l.player_id = p.id
    `
    const params: any[] = []
    if (requestedTeamId) {
      query += ` WHERE p.team_id = ? `
      params.push(requestedTeamId)
    }
    query += ` ORDER BY t.name ASC, p.jersey_number ASC `

    const players = db.prepare(query).all(...params)
    return NextResponse.json({ players })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}

// POST /api/players
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      teamId,
      firstName,
      lastName,
      birthDate,
      nationality,
      jerseyNumber,
      position,
      dominantFoot,
      address,
      photoUrl,
      observations
    } = body

    if (!teamId || !firstName || !lastName || !birthDate || !nationality || !jerseyNumber || !position) {
      return NextResponse.json({ error: 'Tous les champs obligatoires doivent être renseignés.' }, { status: 400 })
    }

    if (!address || !address.trim()) {
      return NextResponse.json({ error: 'Le domicile / adresse de résidence du joueur est obligatoire.' }, { status: 400 })
    }

    if (!photoUrl || !photoUrl.trim()) {
      return NextResponse.json(
        { error: 'La photo d\'identité du joueur est obligatoire pour la licence officielle et son profil.' },
        { status: 400 }
      )
    }

    const user = await requireTeamAccess(teamId)
    const cleanFn = firstName.trim()
    const cleanLn = lastName.trim().toUpperCase()

    if (IS_MYSQL) {
      const pool = getMysqlPool()

      // 1. Quota 30 joueurs max
      const [countRows]: any = await pool.query('SELECT COUNT(*) as count FROM players WHERE team_id = ?', [teamId])
      if (countRows[0].count >= 30 && user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Quota maximal de 30 joueurs atteint pour ce club.' },
          { status: 400 }
        )
      }

      // 2. Détection des doublons sur tout le tournoi
      const [dupRows]: any = await pool.query(`
        SELECT p.first_name, p.last_name, t.name as team_name
        FROM players p
        JOIN teams t ON t.id = p.team_id
        WHERE LOWER(TRIM(p.first_name)) = LOWER(TRIM(?))
          AND LOWER(TRIM(p.last_name)) = LOWER(TRIM(?))
          AND p.birth_date = ?
        LIMIT 1
      `, [cleanFn, cleanLn, birthDate])

      if (dupRows.length > 0) {
        return NextResponse.json(
          { error: `Doublon détecté : Le joueur ${cleanFn} ${cleanLn} est déjà enregistré au sein du club "${dupRows[0].team_name}".` },
          { status: 409 }
        )
      }

      // 3. Unicité du maillot par équipe
      const [jerseyRows]: any = await pool.query(
        'SELECT id FROM players WHERE team_id = ? AND jersey_number = ? LIMIT 1',
        [teamId, Number(jerseyNumber)]
      )
      if (jerseyRows.length > 0) {
        return NextResponse.json(
          { error: `Le maillot numéro ${jerseyNumber} est déjà attribué dans cette équipe.` },
          { status: 400 }
        )
      }

      const playerId = `player_${crypto.randomUUID()}`
      const initialStatus = user.role === 'ADMIN' ? 'VALIDATED' : 'SUBMITTED'

      await pool.query(`
        INSERT INTO players (id, team_id, first_name, last_name, birth_date, nationality, jersey_number, position, dominant_foot, address, photo_url, status, observations)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        playerId,
        teamId,
        cleanFn,
        cleanLn,
        birthDate,
        nationality.trim(),
        Number(jerseyNumber),
        position,
        dominantFoot || 'DROIT',
        address.trim(),
        photoUrl || null,
        initialStatus,
        observations || null
      ])

      logAudit({
        userId: user.id,
        username: user.username,
        role: user.role,
        action: 'AJOUT_JOUEUR',
        entityType: 'PLAYER',
        entityId: playerId,
        details: `Ajout du joueur ${cleanLn} ${cleanFn} (#${jerseyNumber}) dans l'équipe ${teamId}`
      })

      return NextResponse.json({ success: true, playerId, status: initialStatus })
    }

    // Fallback SQLite
    const db = getDatabase()
    const countRow = db.prepare('SELECT COUNT(*) as count FROM players WHERE team_id = ?').get(teamId) as { count: number }
    if (countRow.count >= 30 && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Quota de 30 joueurs atteint.' }, { status: 400 })
    }

    const playerId = `player_${crypto.randomUUID()}`
    const initialStatus = user.role === 'ADMIN' ? 'VALIDATED' : 'SUBMITTED'
    db.prepare(`
      INSERT INTO players (id, team_id, first_name, last_name, birth_date, nationality, jersey_number, position, dominant_foot, address, photo_url, status, observations)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(playerId, teamId, cleanFn, cleanLn, birthDate, nationality.trim(), Number(jerseyNumber), position, dominantFoot || 'DROIT', address.trim(), photoUrl || null, initialStatus, observations || null)

    return NextResponse.json({ success: true, playerId, status: initialStatus })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}
