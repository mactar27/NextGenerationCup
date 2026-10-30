// app/api/licenses/route.ts
import { NextResponse } from 'next/server'
import { requireAdmin, requireAuth } from '@/lib/auth/guard'
import { getMysqlPool, IS_MYSQL, getDatabase } from '@/lib/db'
import { generateLicenseNumber, generateToken } from '@/lib/auth/crypto'
import { generateQRCodeSVG } from '@/lib/qr/generate'
import { logAudit } from '@/lib/services/audit'

// GET /api/licenses : Liste des licences avec détails des joueurs et équipes
export async function GET() {
  try {
    await requireAuth()

    if (IS_MYSQL) {
      const pool = getMysqlPool()
      const [rows] = await pool.query(`
        SELECT l.*, 
               p.first_name, p.last_name, p.birth_date, p.nationality, p.jersey_number, p.position, p.photo_url,
               t.name as team_name, t.code as team_code, t.logo_url as team_logo_url, t.primary_color as team_primary_color
        FROM licenses l
        JOIN players p ON p.id = l.player_id
        JOIN teams t ON t.id = l.team_id
        ORDER BY l.created_at DESC
      `)
      return NextResponse.json({ licenses: rows })
    }

    const db = getDatabase()
    const licenses = db.prepare(`
      SELECT l.*, 
             p.first_name, p.last_name, p.birth_date, p.nationality, p.jersey_number, p.position, p.photo_url,
             t.name as team_name, t.code as team_code, t.logo_url as team_logo_url, t.primary_color as team_primary_color
      FROM licenses l
      JOIN players p ON p.id = l.player_id
      JOIN teams t ON t.id = l.team_id
      ORDER BY l.created_at DESC
    `).all()

    return NextResponse.json({ licenses })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}

// POST /api/licenses : Créer / Émettre manuellement une licence pour un joueur
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin()
    const body = await req.json()
    const { playerId, season, issueDate, expirationDate, status } = body

    if (!playerId) {
      return NextResponse.json({ error: 'Le joueur est obligatoire.' }, { status: 400 })
    }

    const seasonToUse = season || '2026/2027'
    const issueDateToUse = issueDate || new Date().toISOString().split('T')[0]
    const expirationDateToUse = expirationDate || '2027-06-30'
    const statusToUse = status || 'VALIDATED'

    if (IS_MYSQL) {
      const pool = getMysqlPool()
      const [pRows]: any = await pool.query('SELECT * FROM players WHERE id = ?', [playerId])
      if (pRows.length === 0) {
        return NextResponse.json({ error: 'Joueur introuvable.' }, { status: 404 })
      }
      const player = pRows[0]

      // Vérifier si licence déjà existante
      const [existLic]: any = await pool.query('SELECT id FROM licenses WHERE player_id = ?', [playerId])
      if (existLic.length > 0) {
        return NextResponse.json({ error: 'Ce joueur possède déjà une licence. Vous pouvez la modifier.' }, { status: 409 })
      }

      const [cRows]: any = await pool.query('SELECT COUNT(*) as count FROM licenses')
      const seq = cRows[0].count + 1
      const licenseNumber = generateLicenseNumber(seq, 2026)
      const verificationToken = generateToken(16)
      const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify/${verificationToken}`
      const qrSvg = await generateQRCodeSVG(verifyUrl, 160)

      const licenseId = `lic_${playerId}`
      await pool.query(`
        INSERT INTO licenses (id, player_id, team_id, license_number, verification_token, season, issue_date, expiration_date, status, qr_svg)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [licenseId, playerId, player.team_id, licenseNumber, verificationToken, seasonToUse, issueDateToUse, expirationDateToUse, statusToUse, qrSvg])

      await pool.query("UPDATE players SET status = 'VALIDATED', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [playerId])

      logAudit({
        userId: admin.id,
        username: admin.username,
        role: admin.role,
        action: 'CREATION_LICENCE',
        entityType: 'LICENSE',
        entityId: licenseId,
        details: `Création manuelle de la licence ${licenseNumber} pour le joueur ${player.last_name} ${player.first_name}`
      })

      return NextResponse.json({ success: true, licenseId, licenseNumber })
    }

    const db = getDatabase()
    const player = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId) as any
    if (!player) {
      return NextResponse.json({ error: 'Joueur introuvable.' }, { status: 404 })
    }

    const existLic = db.prepare('SELECT id FROM licenses WHERE player_id = ?').get(playerId)
    if (existLic) {
      return NextResponse.json({ error: 'Ce joueur possède déjà une licence. Vous pouvez la modifier.' }, { status: 409 })
    }

    const countRow = db.prepare('SELECT COUNT(*) as count FROM licenses').get() as { count: number }
    const licenseNumber = generateLicenseNumber(countRow.count + 1, 2026)
    const verificationToken = generateToken(16)
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify/${verificationToken}`
    const qrSvg = await generateQRCodeSVG(verifyUrl, 160)

    const licenseId = `lic_${playerId}`
    db.prepare(`
      INSERT INTO licenses (id, player_id, team_id, license_number, verification_token, season, issue_date, expiration_date, status, qr_svg)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(licenseId, playerId, player.team_id, licenseNumber, verificationToken, seasonToUse, issueDateToUse, expirationDateToUse, statusToUse, qrSvg)

    db.prepare("UPDATE players SET status = 'VALIDATED' WHERE id = ?").run(playerId)

    return NextResponse.json({ success: true, licenseId, licenseNumber })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}
