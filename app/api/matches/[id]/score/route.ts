// app/api/matches/[id]/score/route.ts
import { NextResponse } from 'next/server'
import { requireOfficialOrAdmin } from '@/lib/auth/guard'
import { getMysqlPool, IS_MYSQL, getDatabase } from '@/lib/db'
import { logAudit } from '@/lib/services/audit'

// POST /api/matches/[id]/score : Saisie et validation du score officiel
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireOfficialOrAdmin()
    const body = await req.json()
    const { homeScore, awayScore, notes, status } = body

    if (homeScore === undefined || awayScore === undefined) {
      return NextResponse.json({ error: 'Les scores domicile et extérieur sont obligatoires.' }, { status: 400 })
    }

    const matchStatus = status || 'COMPLETED'
    const hScore = Number(homeScore)
    const aScore = Number(awayScore)

    if (IS_MYSQL) {
      const pool = getMysqlPool()
      await pool.query(`
        UPDATE matches
        SET home_score = ?,
            away_score = ?,
            status = ?,
            official_notes = ?,
            validated_by = ?,
            validated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [hScore, aScore, matchStatus, notes || null, user.fullName, id])

      logAudit({
        userId: user.id,
        username: user.username,
        role: user.role,
        action: 'VALIDATION_SCORE',
        entityType: 'MATCH',
        entityId: id,
        details: `Score officiel validé : ${hScore} - ${aScore} (${matchStatus}) par ${user.fullName}`
      })

      return NextResponse.json({ success: true, message: 'Résultat enregistré et validé avec succès.' })
    }

    // Fallback SQLite
    const db = getDatabase()
    db.prepare(`
      UPDATE matches
      SET home_score = ?,
          away_score = ?,
          status = ?,
          official_notes = ?,
          validated_by = ?,
          validated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(hScore, aScore, matchStatus, notes || null, user.fullName, id)

    return NextResponse.json({ success: true, message: 'Résultat enregistré et validé.' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}
