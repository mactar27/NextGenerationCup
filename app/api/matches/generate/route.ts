// app/api/matches/generate/route.ts
import { NextResponse } from 'next/server'
import { requireOfficialOrAdmin } from '@/lib/auth/guard'
import { getMysqlPool, IS_MYSQL, getDatabase } from '@/lib/db'
import { logAudit } from '@/lib/services/audit'

// POST /api/matches/generate : Génération 100% Automatique du calendrier des matchs
export async function POST(req: Request) {
  try {
    const user = await requireOfficialOrAdmin()

    // Lieux et stades officiels du tournoi
    const venues = [
      'Stade Municipal de Dakar',
      'Stade Léopold Sédar Senghor',
      'Stade Alassane Djigo',
      'Stade Amadou Barry'
    ]

    const timeSlots = ['15:00', '17:00', '19:00']

    if (IS_MYSQL) {
      const pool = getMysqlPool()
      const [teams]: any = await pool.query('SELECT id, name, code, primary_color FROM teams WHERE status = "ACTIVE" ORDER BY name ASC')

      if (teams.length < 2) {
        return NextResponse.json({ error: 'Il faut au moins 2 équipes enregistrées pour générer le calendrier automatique.' }, { status: 400 })
      }

      // Supprimer les anciens matchs non commencés si regénération demandée
      await pool.query('DELETE FROM matches WHERE status = "SCHEDULED"')

      const [existingMatches]: any = await pool.query('SELECT COUNT(*) as count FROM matches')
      let matchNumber = existingMatches[0].count + 1

      const generatedMatches: any[] = []
      const startDate = new Date('2026-03-15')

      // Algorithme de Round Robin pour les confrontations de poules
      let dayOffset = 0
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const matchDateObj = new Date(startDate)
          matchDateObj.setDate(startDate.getDate() + Math.floor(dayOffset / 2))
          const dateStr = matchDateObj.toISOString().split('T')[0]
          const timeStr = timeSlots[dayOffset % timeSlots.length]
          // Stade à définir manuellement par l'administrateur
          const venueStr = 'À définir par l\'administrateur'
          const matchId = `match_auto_${Date.now()}_${i}_${j}`
          const poolPhase = `JOURNEE_${(Math.floor(dayOffset / 3) + 1)}`

          await pool.query(`
            INSERT INTO matches (id, match_number, home_team_id, away_team_id, match_date, match_time, venue, phase, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SCHEDULED')
          `, [matchId, matchNumber, teams[i].id, teams[j].id, dateStr, timeStr, venueStr, poolPhase])

          generatedMatches.push({
            id: matchId,
            matchNumber,
            home: teams[i].name,
            away: teams[j].name,
            date: dateStr,
            time: timeStr,
            venue: venueStr,
            phase: poolPhase
          })

          matchNumber++
          dayOffset++
        }
      }

      logAudit({
        userId: user.id,
        username: user.username,
        role: user.role,
        action: 'GENERATION_AUTOMATIQUE_CALENDRIER',
        entityType: 'MATCH',
        details: `Génération automatique de ${generatedMatches.length} matchs du tournoi`
      })

      return NextResponse.json({
        success: true,
        count: generatedMatches.length,
        message: `${generatedMatches.length} matchs générés automatiquement selon le calendrier officiel.`
      })
    }

    // Fallback SQLite
    const db = getDatabase()
    const teams = db.prepare('SELECT id, name, code, primary_color FROM teams WHERE status = "ACTIVE" ORDER BY name ASC').all() as any[]
    if (teams.length < 2) {
      return NextResponse.json({ error: 'Il faut au moins 2 équipes enregistrées pour générer le calendrier automatique.' }, { status: 400 })
    }

    db.prepare('DELETE FROM matches WHERE status = "SCHEDULED"').run()
    const countRow = db.prepare('SELECT COUNT(*) as count FROM matches').get() as { count: number }
    let matchNumber = countRow.count + 1

    const startDate = new Date('2026-03-15')
    let dayOffset = 0
    let count = 0

    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const matchDateObj = new Date(startDate)
        matchDateObj.setDate(startDate.getDate() + Math.floor(dayOffset / 2))
        const dateStr = matchDateObj.toISOString().split('T')[0]
        const timeStr = timeSlots[dayOffset % timeSlots.length]
        // Stade à définir manuellement par l'administrateur
        const venueStr = 'À définir par l\'administrateur'
        const matchId = `match_auto_${Date.now()}_${i}_${j}`
        const poolPhase = `JOURNEE_${(Math.floor(dayOffset / 3) + 1)}`

        db.prepare(`
          INSERT INTO matches (id, match_number, home_team_id, away_team_id, match_date, match_time, venue, phase, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SCHEDULED')
        `).run(matchId, matchNumber, teams[i].id, teams[j].id, dateStr, timeStr, venueStr, poolPhase)

        matchNumber++
        dayOffset++
        count++
      }
    }

    return NextResponse.json({
      success: true,
      count,
      message: `${count} matchs générés automatiquement selon le calendrier officiel.`
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}
