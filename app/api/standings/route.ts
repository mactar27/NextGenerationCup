// app/api/standings/route.ts
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/guard'
import { getMysqlPool, IS_MYSQL, getDatabase } from '@/lib/db'

export interface TeamStanding {
  teamId: string
  teamName: string
  teamCode: string
  color: string
  poolGroup: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

// GET /api/standings : Calcul en temps réel avec séparation par Poules et Général
export async function GET(req: Request) {
  try {
    await requireAuth()
    const url = new URL(req.url)
    const poolFilter = url.searchParams.get('pool')

    let teams: any[] = []
    let completedMatches: any[] = []

    if (IS_MYSQL) {
      const pool = getMysqlPool()
      let tQuery = 'SELECT id, code, name, primary_color, pool_group FROM teams WHERE 1=1'
      const tParams: any[] = []
      if (poolFilter) {
        tQuery += ' AND pool_group = ?'
        tParams.push(poolFilter)
      }
      tQuery += ' ORDER BY name ASC'

      const [tRows] = await pool.query(tQuery, tParams)
      teams = tRows as any[]

      let mQuery = `
        SELECT home_team_id, away_team_id, home_score, away_score, pool_group, phase
        FROM matches
        WHERE status = 'COMPLETED' AND home_score IS NOT NULL AND away_score IS NOT NULL
      `
      const mParams: any[] = []
      if (poolFilter) {
        mQuery += ' AND (pool_group = ? OR phase = ?)'
        mParams.push(poolFilter, poolFilter)
      }

      const [mRows] = await pool.query(mQuery, mParams)
      completedMatches = mRows as any[]
    } else {
      const db = getDatabase()
      teams = db.prepare("SELECT id, code, name, primary_color, 'POULE_A' as pool_group FROM teams ORDER BY name ASC").all() as any[]
      completedMatches = db.prepare(`
        SELECT home_team_id, away_team_id, home_score, away_score
        FROM matches
        WHERE status = 'COMPLETED' AND home_score IS NOT NULL AND away_score IS NOT NULL
      `).all() as any[]
    }

    const stats: Record<string, TeamStanding> = {}
    for (const t of teams) {
      stats[t.id] = {
        teamId: t.id,
        teamName: t.name,
        teamCode: t.code,
        color: t.primary_color || '#183b63',
        poolGroup: t.pool_group || 'POULE_A',
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0
      }
    }

    for (const m of completedMatches) {
      const h = stats[m.home_team_id]
      const a = stats[m.away_team_id]
      if (!h || !a) continue

      h.played += 1
      a.played += 1

      h.goalsFor += Number(m.home_score)
      h.goalsAgainst += Number(m.away_score)
      h.goalDifference = h.goalsFor - h.goalsAgainst

      a.goalsFor += Number(m.away_score)
      a.goalsAgainst += Number(m.home_score)
      a.goalDifference = a.goalsFor - a.goalsAgainst

      if (Number(m.home_score) > Number(m.away_score)) {
        h.won += 1
        h.points += 3
        a.lost += 1
      } else if (Number(m.home_score) < Number(m.away_score)) {
        a.won += 1
        a.points += 3
        h.lost += 1
      } else {
        h.drawn += 1
        a.drawn += 1
        h.points += 1
        a.points += 1
      }
    }

    const standingsList = Object.values(stats).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
      return a.teamName.localeCompare(b.teamName)
    })

    // Regroupement par Poules
    const poolsGrouped: Record<string, TeamStanding[]> = {}
    for (const s of standingsList) {
      const p = s.poolGroup || 'POULE_A'
      if (!poolsGrouped[p]) poolsGrouped[p] = []
      poolsGrouped[p].push(s)
    }

    return NextResponse.json({
      standings: standingsList,
      pools: poolsGrouped
    })
  } catch (err: any) {
    console.error('Standings error:', err)
    return NextResponse.json({ error: err.message, standings: [], pools: {} }, { status: 500 })
  }
}
