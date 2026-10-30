// app/api/teams/route.ts
import { NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth/guard'
import { getMysqlPool, IS_MYSQL, getDatabase } from '@/lib/db'
import { logAudit } from '@/lib/services/audit'
import { hashPassword } from '@/lib/auth/crypto'

// GET /api/teams : Si Dirigeant, renvoie UNIQUEMENT son équipe. Si Admin/Officiel, renvoie toutes les équipes.
export async function GET() {
  try {
    const user = await requireAuth()

    if (IS_MYSQL) {
      const pool = getMysqlPool()

      if (user.role === 'TEAM_MANAGER') {
        if (!user.teamId) {
          return NextResponse.json({ teams: [] })
        }
        const [rows] = await pool.query(`
          SELECT t.*, 
            (SELECT COUNT(*) FROM players WHERE team_id = t.id) as player_count,
            (SELECT COUNT(*) FROM players WHERE team_id = t.id AND status = 'VALIDATED') as validated_count,
            (SELECT COUNT(*) FROM players WHERE team_id = t.id AND status IN ('SUBMITTED', 'UNDER_REVIEW')) as pending_count
          FROM teams t
          WHERE t.id = ?
        `, [user.teamId])
        return NextResponse.json({ teams: rows })
      }

      // Admin & Officiel : liste complète
      const [rows] = await pool.query(`
        SELECT t.*,
          (SELECT COUNT(*) FROM players WHERE team_id = t.id) as player_count,
          (SELECT COUNT(*) FROM players WHERE team_id = t.id AND status = 'VALIDATED') as validated_count,
          (SELECT COUNT(*) FROM players WHERE team_id = t.id AND status IN ('SUBMITTED', 'UNDER_REVIEW')) as pending_count
        FROM teams t
        ORDER BY t.name ASC
      `)
      return NextResponse.json({ teams: rows })
    }

    // Fallback SQLite
    const db = getDatabase()
    if (user.role === 'TEAM_MANAGER') {
      if (!user.teamId) return NextResponse.json({ teams: [] })
      const myTeam = db.prepare(`
        SELECT t.*, 
          (SELECT COUNT(*) FROM players WHERE team_id = t.id) as player_count,
          (SELECT COUNT(*) FROM players WHERE team_id = t.id AND status = 'VALIDATED') as validated_count,
          (SELECT COUNT(*) FROM players WHERE team_id = t.id AND status IN ('SUBMITTED', 'UNDER_REVIEW')) as pending_count
        FROM teams t
        WHERE t.id = ?
      `).all(user.teamId)
      return NextResponse.json({ teams: myTeam })
    }

    const teams = db.prepare(`
      SELECT t.*,
        (SELECT COUNT(*) FROM players WHERE team_id = t.id) as player_count,
        (SELECT COUNT(*) FROM players WHERE team_id = t.id AND status = 'VALIDATED') as validated_count,
        (SELECT COUNT(*) FROM players WHERE team_id = t.id AND status IN ('SUBMITTED', 'UNDER_REVIEW')) as pending_count
      FROM teams t
      ORDER BY t.name ASC
    `).all()

    return NextResponse.json({ teams })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}

// POST /api/teams : Réservé exclusivement à l'ADMIN (limite stricte 21 équipes)
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin()
    const body = await req.json()
    const {
      name,
      code,
      city,
      primaryColor,
      secondaryColor,
      logoUrl,
      managerName,
      managerEmail,
      managerPhone,
      managerUsername,
      managerPassword
    } = body

    if (!name || !code) {
      return NextResponse.json({ error: 'Le nom et le code court de l’équipe sont obligatoires.' }, { status: 400 })
    }

    if (!managerUsername || !managerPassword) {
      return NextResponse.json({ error: 'L\'identifiant et le mot de passe du compte Dirigeant sont obligatoires pour lui permettre d\'accéder à sa page de club.' }, { status: 400 })
    }

    const cleanCode = code.toUpperCase().trim()
    const cleanName = name.trim()

    if (IS_MYSQL) {
      const pool = getMysqlPool()

      // 1. Vérifier quota max 21 équipes
      const [countRows]: any = await pool.query('SELECT COUNT(*) as count FROM teams')
      if (countRows[0].count >= 21) {
        return NextResponse.json(
          { error: 'Quota officiel atteint : Le tournoi est limité à exactement 21 équipes.' },
          { status: 400 }
        )
      }

      // 2. Vérifier unicité nom/code
      const [existRows]: any = await pool.query(
        'SELECT id FROM teams WHERE code = ? OR name = ? LIMIT 1',
        [cleanCode, cleanName]
      )
      if (existRows.length > 0) {
        return NextResponse.json(
          { error: 'Une équipe avec ce nom ou ce code court existe déjà.' },
          { status: 409 }
        )
      }

      const teamId = `team_${Date.now()}`

      await pool.query(`
        INSERT INTO teams (id, code, name, city, primary_color, secondary_color, logo_url, manager_name, manager_email, manager_phone, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
      `, [
        teamId,
        cleanCode,
        cleanName,
        city || '',
        primaryColor || '#183b63',
        secondaryColor || '#f5b800',
        logoUrl || null,
        managerName || '',
        managerEmail || '',
        managerPhone || ''
      ])

      // 3. Si des identifiants dirigeants sont renseignés, créer automatiquement le compte Dirigeant associé
      if (managerUsername && managerPassword) {
        const pwd = hashPassword(managerPassword)
        const userId = `user_dir_${Date.now()}`
        await pool.query(`
          INSERT INTO users (id, username, email, password_hash, password_salt, full_name, role, team_id, phone)
          VALUES (?, ?, ?, ?, ?, ?, 'TEAM_MANAGER', ?, ?)
        `, [
          userId,
          managerUsername.trim().toLowerCase(),
          managerEmail || `${managerUsername.trim().toLowerCase()}@tournoi.fr`,
          pwd.hash,
          pwd.salt,
          managerName || `Dirigeant ${cleanName}`,
          teamId,
          managerPhone || ''
        ])
      }

      logAudit({
        userId: admin.id,
        username: admin.username,
        role: admin.role,
        action: 'CREATION_EQUIPE',
        entityType: 'TEAM',
        entityId: teamId,
        details: `Création de l'équipe ${cleanName} (${cleanCode})`
      })

      return NextResponse.json({ success: true, teamId })
    }

    // Fallback SQLite
    const db = getDatabase()
    const countRow = db.prepare('SELECT COUNT(*) as count FROM teams').get() as { count: number }
    if (countRow.count >= 21) {
      return NextResponse.json({ error: 'Quota de 21 équipes atteint.' }, { status: 400 })
    }

    const teamId = `team_${Date.now()}`
    db.prepare(`
      INSERT INTO teams (id, code, name, city, primary_color, secondary_color, logo_url, manager_name, manager_email, manager_phone, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
    `).run(
      teamId,
      cleanCode,
      cleanName,
      city || '',
      primaryColor || '#183b63',
      secondaryColor || '#f5b800',
      logoUrl || null,
      managerName || '',
      managerEmail || '',
      managerPhone || ''
    )

    if (managerUsername && managerPassword) {
      const pwd = hashPassword(managerPassword)
      db.prepare(`
        INSERT INTO users (id, username, email, password_hash, password_salt, full_name, role, team_id, phone)
        VALUES (?, ?, ?, ?, ?, ?, 'TEAM_MANAGER', ?, ?)
      `).run(
        `user_dir_${Date.now()}`,
        managerUsername.trim().toLowerCase(),
        managerEmail || `${managerUsername.trim().toLowerCase()}@tournoi.fr`,
        pwd.hash,
        pwd.salt,
        managerName || `Dirigeant ${cleanName}`,
        teamId,
        managerPhone || ''
      )
    }

    logAudit({
      userId: admin.id,
      username: admin.username,
      role: admin.role,
      action: 'CREATION_EQUIPE',
      entityType: 'TEAM',
      entityId: teamId,
      details: `Création de l'équipe ${cleanName} (${cleanCode})`
    })

    return NextResponse.json({ success: true, teamId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}
