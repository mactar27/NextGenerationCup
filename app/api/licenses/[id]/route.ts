// app/api/licenses/[id]/route.ts
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/guard'
import { getMysqlPool, IS_MYSQL, getDatabase } from '@/lib/db'
import { logAudit } from '@/lib/services/audit'

// PUT /api/licenses/[id] : Modifier une licence (dates, saison, statut)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const { season, issueDate, expirationDate, status } = body

    if (!season || !issueDate || !expirationDate || !status) {
      return NextResponse.json({ error: 'Tous les champs de la licence sont obligatoires.' }, { status: 400 })
    }

    if (IS_MYSQL) {
      const pool = getMysqlPool()
      const [licRows]: any = await pool.query('SELECT * FROM licenses WHERE id = ?', [id])
      if (licRows.length === 0) {
        return NextResponse.json({ error: 'Licence introuvable.' }, { status: 404 })
      }

      await pool.query(`
        UPDATE licenses 
        SET season = ?, issue_date = ?, expiration_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [season, issueDate, expirationDate, status, id])

      // Synchroniser le statut du joueur correspondant
      const playerStatus = status === 'VALIDATED' ? 'VALIDATED' : status === 'SUSPENDED' ? 'SUSPENDED' : 'EXPIRED'
      await pool.query('UPDATE players SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [playerStatus, licRows[0].player_id])

      logAudit({
        userId: admin.id,
        username: admin.username,
        role: admin.role,
        action: 'MODIFICATION_LICENCE',
        entityType: 'LICENSE',
        entityId: id,
        details: `Mise à jour de la licence ${licRows[0].license_number} (statut: ${status}, exp: ${expirationDate})`
      })

      return NextResponse.json({ success: true, message: 'Licence mise à jour avec succès.' })
    }

    const db = getDatabase()
    const lic = db.prepare('SELECT * FROM licenses WHERE id = ?').get(id) as any
    if (!lic) {
      return NextResponse.json({ error: 'Licence introuvable.' }, { status: 404 })
    }

    db.prepare(`
      UPDATE licenses 
      SET season = ?, issue_date = ?, expiration_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(season, issueDate, expirationDate, status, id)

    const playerStatus = status === 'VALIDATED' ? 'VALIDATED' : status === 'SUSPENDED' ? 'SUSPENDED' : 'EXPIRED'
    db.prepare('UPDATE players SET status = ? WHERE id = ?').run(playerStatus, lic.player_id)

    return NextResponse.json({ success: true, message: 'Licence mise à jour avec succès.' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}

// DELETE /api/licenses/[id] : Révoquer / Supprimer une licence
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin()
    const { id } = await params

    if (IS_MYSQL) {
      const pool = getMysqlPool()
      const [licRows]: any = await pool.query('SELECT * FROM licenses WHERE id = ?', [id])
      if (licRows.length === 0) {
        return NextResponse.json({ error: 'Licence introuvable.' }, { status: 404 })
      }

      const lic = licRows[0]
      await pool.query('DELETE FROM licenses WHERE id = ?', [id])
      await pool.query("UPDATE players SET status = 'SUBMITTED', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [lic.player_id])

      logAudit({
        userId: admin.id,
        username: admin.username,
        role: admin.role,
        action: 'SUPPRESSION_LICENCE',
        entityType: 'LICENSE',
        entityId: id,
        details: `Suppression de la licence ${lic.license_number}`
      })

      return NextResponse.json({ success: true, message: 'Licence supprimée avec succès.' })
    }

    const db = getDatabase()
    const lic = db.prepare('SELECT * FROM licenses WHERE id = ?').get(id) as any
    if (!lic) {
      return NextResponse.json({ error: 'Licence introuvable.' }, { status: 404 })
    }

    db.prepare('DELETE FROM licenses WHERE id = ?').run(id)
    db.prepare("UPDATE players SET status = 'SUBMITTED' WHERE id = ?").run(lic.player_id)

    return NextResponse.json({ success: true, message: 'Licence supprimée avec succès.' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}
