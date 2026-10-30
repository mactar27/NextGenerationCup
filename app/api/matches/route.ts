// app/api/matches/route.ts
import { NextResponse } from 'next/server'
import { requireAuth, requireOfficialOrAdmin } from '@/lib/auth/guard'
import { getMysqlPool, IS_MYSQL, getDatabase } from '@/lib/db'
import { logAudit } from '@/lib/services/audit'

// GET /api/matches : Liste de tous les matchs
export async function GET(req: Request) {
  try {
    await requireAuth()
    const url = new URL(req.url)
    const phaseFilter = url.searchParams.get('phase')
    const poolFilter = url.searchParams.get('pool')

    if (IS_MYSQL) {
      const pool = getMysqlPool()
      let query = `
        SELECT m.*,
          ht.name as home_team_name, ht.code as home_team_code, ht.primary_color as home_color,
          at.name as away_team_name, at.code as away_team_code, at.primary_color as away_color
        FROM matches m
        JOIN teams ht ON ht.id = m.home_team_id
        JOIN teams at ON at.id = m.away_team_id
        WHERE 1=1
      `
      const params: any[] = []

      if (phaseFilter) {
        query += ` AND m.phase = ? `
        params.push(phaseFilter)
      }
      if (poolFilter) {
        query += ` AND m.pool_group = ? `
        params.push(poolFilter)
      }

      query += ` ORDER BY m.match_date ASC, m.match_time ASC `

      const [rows] = await pool.query(query, params)
      return NextResponse.json({ matches: rows })
    }

    // Fallback SQLite
    const db = getDatabase()
    const matches = db.prepare(`
      SELECT m.*,
        ht.name as home_team_name, ht.code as home_team_code, ht.primary_color as home_color,
        at.name as away_team_name, at.code as away_team_code, at.primary_color as away_color
      FROM matches m
      JOIN teams ht ON ht.id = m.home_team_id
      JOIN teams at ON at.id = m.away_team_id
      ORDER BY m.match_date ASC, m.match_time ASC
    `).all()
    return NextResponse.json({ matches })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}

// POST /api/matches : Programmation d'un match
export async function POST(req: Request) {
  try {
    const user = await requireOfficialOrAdmin()
    const body = await req.json()
    const { homeTeamId, awayTeamId, matchDate, matchTime, venue, phase, poolGroup } = body

    if (!homeTeamId || !awayTeamId || !matchDate || !matchTime || !venue) {
      return NextResponse.json({ error: 'Tous les paramètres de la rencontre sont requis.' }, { status: 400 })
    }

    if (homeTeamId === awayTeamId) {
      return NextResponse.json({ error: 'Une équipe ne peut pas jouer contre elle-même.' }, { status: 400 })
    }

    const matchId = `match_${Date.now()}`
    const matchPhase = phase || 'POULES'

    if (IS_MYSQL) {
      const pool = getMysqlPool()
      const [countRows]: any = await pool.query('SELECT COUNT(*) as count FROM matches')
      const matchNumber = countRows[0].count + 1

      await pool.query(`
        INSERT INTO matches (id, match_number, home_team_id, away_team_id, match_date, match_time, venue, phase, pool_group, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'SCHEDULED')
      `, [matchId, matchNumber, homeTeamId, awayTeamId, matchDate, matchTime, venue, matchPhase, poolGroup || null])

      logAudit({
        userId: user.id,
        username: user.username,
        role: user.role,
        action: 'PROGRAMMATION_MATCH',
        entityType: 'MATCH',
        entityId: matchId,
        details: `Match #${matchNumber} programmé (${matchPhase}) : ${homeTeamId} vs ${awayTeamId}`
      })

      return NextResponse.json({ success: true, matchId, matchNumber })
    }

    // Fallback SQLite
    const db = getDatabase()
    const countRow = db.prepare('SELECT COUNT(*) as count FROM matches').get() as { count: number }
    const matchNumber = countRow.count + 1
    db.prepare(`
      INSERT INTO matches (id, match_number, home_team_id, away_team_id, match_date, match_time, venue, phase, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SCHEDULED')
    `).run(matchId, matchNumber, homeTeamId, awayTeamId, matchDate, matchTime, venue, matchPhase)

    return NextResponse.json({ success: true, matchId, matchNumber })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}
