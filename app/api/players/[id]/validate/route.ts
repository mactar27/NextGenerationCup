// app/api/players/[id]/validate/route.ts
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/guard'
import { getMysqlPool, IS_MYSQL, getDatabase } from '@/lib/db'
import { generateLicenseNumber, generateToken } from '@/lib/auth/crypto'
import { generateQRCodeSVG } from '@/lib/qr/generate'
import { logAudit } from '@/lib/services/audit'

// POST /api/players/[id]/validate : Décision administrative (Validation / Rejet / Suspension)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const admin = await requireAdmin()
    const body = await req.json()
    const { action, reason } = body

    let player: any = null

    if (IS_MYSQL) {
      const pool = getMysqlPool()
      const [pRows]: any = await pool.query(`
        SELECT p.*, t.name as team_name, t.code as team_code
        FROM players p
        JOIN teams t ON t.id = p.team_id
        WHERE p.id = ?
      `, [id])
      player = pRows[0]

      if (!player) {
        return NextResponse.json({ error: 'Joueur introuvable.' }, { status: 404 })
      }

      if (action === 'VALIDATE') {
        await pool.query("UPDATE players SET status = 'VALIDATED', rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [id])

        const [licRows]: any = await pool.query('SELECT id FROM licenses WHERE player_id = ?', [id])

        if (licRows.length === 0) {
          const [cRows]: any = await pool.query('SELECT COUNT(*) as count FROM licenses')
          const seq = cRows[0].count + 1
          const licenseNumber = generateLicenseNumber(seq, 2026)
          const verificationToken = generateToken(16)
          const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify/${verificationToken}`
          const qrSvg = await generateQRCodeSVG(verifyUrl, 160)

          await pool.query(`
            INSERT INTO licenses (id, player_id, team_id, license_number, verification_token, season, issue_date, expiration_date, status, qr_svg)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'VALIDATED', ?)
          `, [
            `lic_${id}`,
            id,
            player.team_id,
            licenseNumber,
            verificationToken,
            '2026-2027',
            new Date().toISOString().split('T')[0],
            '2027-06-30',
            qrSvg
          ])
        } else {
          await pool.query("UPDATE licenses SET status = 'VALIDATED', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [licRows[0].id])
        }

        logAudit({
          userId: admin.id,
          username: admin.username,
          role: admin.role,
          action: 'VALIDATION_LICENCE',
          entityType: 'PLAYER',
          entityId: id,
          details: `Validation officielle du dossier et émission de licence pour ${player.last_name} ${player.first_name}`
        })

        return NextResponse.json({ success: true, message: 'Dossier validé et licence officielle générée.' })
      }

      if (action === 'REJECT') {
        if (!reason) {
          return NextResponse.json({ error: 'Un motif explicite de rejet est obligatoire.' }, { status: 400 })
        }
        await pool.query("UPDATE players SET status = 'REJECTED', rejection_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [reason, id])
        await pool.query("UPDATE licenses SET status = 'REVOKED', updated_at = CURRENT_TIMESTAMP WHERE player_id = ?", [id])
        return NextResponse.json({ success: true, message: 'Dossier rejeté avec notification de motif.' })
      }

      if (action === 'SUSPEND') {
        await pool.query("UPDATE players SET status = 'SUSPENDED', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [id])
        await pool.query("UPDATE licenses SET status = 'SUSPENDED', updated_at = CURRENT_TIMESTAMP WHERE player_id = ?", [id])
        return NextResponse.json({ success: true, message: 'Licence suspendue.' })
      }
    }

    // Fallback SQLite
    const db = getDatabase()
    player = db.prepare('SELECT p.*, t.name as team_name FROM players p JOIN teams t ON t.id = p.team_id WHERE p.id = ?').get(id) as any
    if (!player) return NextResponse.json({ error: 'Joueur introuvable.' }, { status: 404 })

    if (action === 'VALIDATE') {
      db.prepare("UPDATE players SET status = 'VALIDATED', rejection_reason = NULL WHERE id = ?").run(id)
      const existingLicense = db.prepare('SELECT id FROM licenses WHERE player_id = ?').get(id) as any
      if (!existingLicense) {
        const countRow = db.prepare('SELECT COUNT(*) as count FROM licenses').get() as { count: number }
        const licNum = generateLicenseNumber(countRow.count + 1, 2026)
        const token = generateToken(16)
        const qrSvg = await generateQRCodeSVG(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify/${token}`, 160)
        db.prepare(`
          INSERT INTO licenses (id, player_id, team_id, license_number, verification_token, season, issue_date, expiration_date, status, qr_svg)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'VALIDATED', ?)
        `).run(`lic_${id}`, id, player.team_id, licNum, token, '2026-2027', new Date().toISOString().split('T')[0], '2027-06-30', qrSvg)
      }
      return NextResponse.json({ success: true, message: 'Dossier validé.' })
    }

    return NextResponse.json({ error: 'Action non reconnue.' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}
