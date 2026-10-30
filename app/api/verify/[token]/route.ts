// app/api/verify/[token]/route.ts
import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'

// GET /api/verify/[token] : Consultation publique sécurisée du statut réel
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const db = getDatabase()

    const license = db.prepare(`
      SELECT 
        l.license_number,
        l.status as license_status,
        l.season,
        l.issue_date,
        l.expiration_date,
        l.qr_svg,
        p.first_name,
        p.last_name,
        p.birth_date,
        p.nationality,
        p.jersey_number,
        p.position,
        p.photo_url,
        p.status as player_status,
        t.name as team_name,
        t.code as team_code,
        t.primary_color as team_color
      FROM licenses l
      JOIN players p ON p.id = l.player_id
      JOIN teams t ON t.id = l.team_id
      WHERE l.verification_token = ?
      LIMIT 1
    `).get(token) as any

    if (!license) {
      return NextResponse.json(
        { valid: false, error: 'Licence introuvable ou jeton de vérification invalide.' },
        { status: 404 }
      )
    }

    const isCurrentlyValid = license.license_status === 'VALIDATED' && license.player_status === 'VALIDATED'

    return NextResponse.json({
      valid: isCurrentlyValid,
      status: isCurrentlyValid ? 'VALIDATED' : (license.license_status || 'SUSPENDED'),
      licenseNumber: license.license_number,
      firstName: license.first_name,
      lastName: license.last_name,
      birthDate: license.birth_date,
      nationality: license.nationality,
      jerseyNumber: license.jersey_number,
      position: license.position,
      teamName: license.team_name,
      teamCode: license.team_code,
      teamColor: license.team_color,
      season: license.season,
      issueDate: license.issue_date,
      expirationDate: license.expiration_date,
      verifiedAt: new Date().toISOString()
    })
  } catch (err: any) {
    return NextResponse.json({ error: 'Erreur lors de la vérification.' }, { status: 500 })
  }
}
