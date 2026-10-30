// app/api/teams/[id]/route.ts
import { NextResponse } from 'next/server'
import { requireTeamAccess, requireAdmin } from '@/lib/auth/guard'
import { getDatabase } from '@/lib/db'
import { logAudit } from '@/lib/services/audit'

// GET /api/teams/[id] : Contrôle strict côté serveur
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    // Vérifie que l'utilisateur a le droit d'accéder à CETTE équipe
    const user = await requireTeamAccess(id)
    const db = getDatabase()

    const team = db.prepare(`
      SELECT t.*,
        (SELECT COUNT(*) FROM players WHERE team_id = t.id) as player_count,
        (SELECT COUNT(*) FROM players WHERE team_id = t.id AND status = 'VALIDATED') as validated_count,
        (SELECT COUNT(*) FROM players WHERE team_id = t.id AND status IN ('SUBMITTED', 'UNDER_REVIEW')) as pending_count
      FROM teams t
      WHERE t.id = ?
    `).get(id)

    if (!team) {
      return NextResponse.json({ error: 'Équipe introuvable.' }, { status: 404 })
    }

    return NextResponse.json({ team })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}

// PATCH /api/teams/[id] : Mise à jour autorisée pour l'admin ou le dirigeant de CETTE équipe
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireTeamAccess(id)
    const db = getDatabase()

    const body = await req.json()
    const { name, city, primaryColor, secondaryColor, managerName, managerEmail, managerPhone } = body

    db.prepare(`
      UPDATE teams
      SET name = COALESCE(?, name),
          city = COALESCE(?, city),
          primary_color = COALESCE(?, primary_color),
          secondary_color = COALESCE(?, secondary_color),
          manager_name = COALESCE(?, manager_name),
          manager_email = COALESCE(?, manager_email),
          manager_phone = COALESCE(?, manager_phone)
      WHERE id = ?
    `).run(name, city, primaryColor, secondaryColor, managerName, managerEmail, managerPhone, id)

    logAudit({
      userId: user.id,
      username: user.username,
      role: user.role,
      action: 'MODIFICATION_EQUIPE',
      entityType: 'TEAM',
      entityId: id,
      details: `Mise à jour des informations de l'équipe ${id}`
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}
