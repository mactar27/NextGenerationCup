// app/api/players/[id]/route.ts
import { NextResponse } from 'next/server'
import { requireAuth, requireTeamAccess, requireAdmin } from '@/lib/auth/guard'
import { getDatabase } from '@/lib/db'
import { logAudit } from '@/lib/services/audit'

// GET /api/players/[id]
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireAuth()
    const db = getDatabase()

    const player = db.prepare(`
      SELECT p.*, t.name as team_name, t.code as team_code,
        l.license_number, l.verification_token, l.status as license_status, l.qr_svg, l.issue_date, l.expiration_date
      FROM players p
      JOIN teams t ON t.id = p.team_id
      LEFT JOIN licenses l ON l.player_id = p.id
      WHERE p.id = ?
    `).get(id) as { team_id: string } | undefined

    if (!player) {
      return NextResponse.json({ error: 'Joueur introuvable.' }, { status: 404 })
    }

    // Vérifier l'isolation du dirigeant
    await requireTeamAccess(player.team_id)

    return NextResponse.json({ player })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}

// DELETE /api/players/[id] : Autorisé au dirigeant (si statut brouillon/rejeté) ou à l'admin
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireAuth()
    const db = getDatabase()

    const player = db.prepare('SELECT id, team_id, first_name, last_name, status FROM players WHERE id = ?').get(id) as {
      id: string
      team_id: string
      first_name: string
      last_name: string
      status: string
    } | undefined

    if (!player) {
      return NextResponse.json({ error: 'Joueur introuvable.' }, { status: 404 })
    }

    // Vérification de permission
    await requireTeamAccess(player.team_id)

    if (user.role === 'TEAM_MANAGER' && player.status === 'VALIDATED') {
      return NextResponse.json(
        { error: 'Un joueur avec une licence validée ne peut être supprimé que par la commission d’administration.' },
        { status: 403 }
      )
    }

    db.prepare('DELETE FROM players WHERE id = ?').run(id)

    logAudit({
      userId: user.id,
      username: user.username,
      role: user.role,
      action: 'SUPPRESSION_JOUEUR',
      entityType: 'PLAYER',
      entityId: id,
      details: `Suppression du dossier joueur ${player.last_name} ${player.first_name}`
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}
