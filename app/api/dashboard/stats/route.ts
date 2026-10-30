// app/api/dashboard/stats/route.ts
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/guard'
import { getMysqlPool, IS_MYSQL, getDatabase } from '@/lib/db'

export async function GET() {
  try {
    const user = await requireAuth()

    if (IS_MYSQL) {
      const pool = getMysqlPool()

      if (user.role === 'TEAM_MANAGER') {
        if (!user.teamId) {
          return NextResponse.json({ error: 'Équipe non assignée.' }, { status: 400 })
        }

        const [teamRows]: any = await pool.query('SELECT * FROM teams WHERE id = ?', [user.teamId])
        const [pCount]: any = await pool.query('SELECT COUNT(*) as c FROM players WHERE team_id = ?', [user.teamId])
        const [vCount]: any = await pool.query("SELECT COUNT(*) as c FROM players WHERE team_id = ? AND status = 'VALIDATED'", [user.teamId])
        const [penCount]: any = await pool.query("SELECT COUNT(*) as c FROM players WHERE team_id = ? AND status IN ('SUBMITTED', 'UNDER_REVIEW')", [user.teamId])
        const [rCount]: any = await pool.query("SELECT COUNT(*) as c FROM players WHERE team_id = ? AND status IN ('REJECTED', 'SUSPENDED')", [user.teamId])

        const [upcoming]: any = await pool.query(`
          SELECT m.*, ht.name as home_name, ht.code as home_code, at.name as away_name, at.code as away_code
          FROM matches m
          JOIN teams ht ON ht.id = m.home_team_id
          JOIN teams at ON at.id = m.away_team_id
          WHERE m.home_team_id = ? OR m.away_team_id = ?
          ORDER BY m.match_date ASC, m.match_time ASC
          LIMIT 5
        `, [user.teamId, user.teamId])

        return NextResponse.json({
          isManager: true,
          team: teamRows[0] || null,
          stats: {
            maxCapacity: 30,
            totalRegistered: pCount[0]?.c || 0,
            remainingSlots: Math.max(0, 30 - (pCount[0]?.c || 0)),
            validatedLicenses: vCount[0]?.c || 0,
            pendingValidation: penCount[0]?.c || 0,
            rejectedOrSuspended: rCount[0]?.c || 0
          },
          upcomingMatches: upcoming
        })
      }

      // Admin & Officiel : stats globales
      const [tCount]: any = await pool.query('SELECT COUNT(*) as c FROM teams')
      const [pCount]: any = await pool.query('SELECT COUNT(*) as c FROM players')
      const [vCount]: any = await pool.query("SELECT COUNT(*) as c FROM players WHERE status = 'VALIDATED'")
      const [penCount]: any = await pool.query("SELECT COUNT(*) as c FROM players WHERE status IN ('SUBMITTED', 'UNDER_REVIEW')")
      const [rCount]: any = await pool.query("SELECT COUNT(*) as c FROM players WHERE status IN ('REJECTED', 'SUSPENDED')")
      const [sCount]: any = await pool.query("SELECT COUNT(*) as c FROM matches WHERE status = 'SCHEDULED'")
      const [cCount]: any = await pool.query("SELECT COUNT(*) as c FROM matches WHERE status = 'COMPLETED'")

      const [logs]: any = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 6')
      const [nextM]: any = await pool.query(`
        SELECT m.*, ht.name as home_name, ht.code as home_code, at.name as away_name, at.code as away_code
        FROM matches m
        JOIN teams ht ON ht.id = m.home_team_id
        JOIN teams at ON at.id = m.away_team_id
        ORDER BY m.match_date ASC, m.match_time ASC
        LIMIT 5
      `)

      return NextResponse.json({
        isManager: false,
        stats: {
          totalTeams: tCount[0]?.c || 0,
          maxTeamsAllowed: 21,
          totalPlayersAllowed: 630,
          registeredPlayers: pCount[0]?.c || 0,
          validatedLicenses: vCount[0]?.c || 0,
          pendingValidation: penCount[0]?.c || 0,
          rejectedOrSuspended: rCount[0]?.c || 0,
          scheduledMatches: sCount[0]?.c || 0,
          completedMatches: cCount[0]?.c || 0,
          registrationProgressPct: Math.round(((pCount[0]?.c || 0) / 630) * 100)
        },
        recentActivity: logs,
        nextMatches: nextM
      })
    }

    // Fallback SQLite
    const db = getDatabase()
    const totalTeams = (db.prepare('SELECT COUNT(*) as c FROM teams').get() as any).c
    const totalPlayers = (db.prepare('SELECT COUNT(*) as c FROM players').get() as any).c
    return NextResponse.json({
      isManager: false,
      stats: {
        totalTeams,
        maxTeamsAllowed: 21,
        totalPlayersAllowed: 630,
        registeredPlayers: totalPlayers,
        validatedLicenses: 0,
        pendingValidation: 0,
        rejectedOrSuspended: 0,
        scheduledMatches: 0,
        completedMatches: 0,
        registrationProgressPct: Math.round((totalPlayers / 630) * 100)
      },
      recentActivity: [],
      nextMatches: []
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}
