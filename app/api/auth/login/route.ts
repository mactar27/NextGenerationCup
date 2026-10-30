// app/api/auth/login/route.ts
import { NextResponse } from 'next/server'
import { getMysqlPool, IS_MYSQL, getDatabase } from '@/lib/db'
import { verifyPassword } from '@/lib/auth/crypto'
import { signSessionToken, COOKIE_NAME } from '@/lib/auth/session'
import { logAudit } from '@/lib/services/audit'

export async function POST(req: Request) {
  try {
    const { login, password } = await req.json()

    if (!login || !password) {
      return NextResponse.json({ error: 'Identifiant et mot de passe requis.' }, { status: 400 })
    }

    const cleanLogin = login.trim()

    let user: any = null

    if (IS_MYSQL) {
      const pool = getMysqlPool()
      const [rows]: any = await pool.query(`
        SELECT id, username, email, password_hash, password_salt, full_name, role, team_id
        FROM users
        WHERE username = ? OR email = ?
        LIMIT 1
      `, [cleanLogin, cleanLogin.toLowerCase()])
      user = rows[0]
    } else {
      const db = getDatabase()
      user = db.prepare(`
        SELECT id, username, email, password_hash, password_salt, full_name, role, team_id
        FROM users
        WHERE username = ? OR email = ?
        LIMIT 1
      `).get(cleanLogin, cleanLogin.toLowerCase())
    }

    if (!user) {
      return NextResponse.json({ error: 'Identifiants invalides.' }, { status: 401 })
    }

    const isValid = verifyPassword(password, user.password_hash, user.password_salt)
    if (!isValid) {
      return NextResponse.json({ error: 'Identifiants invalides.' }, { status: 401 })
    }

    const sessionPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      teamId: user.team_id
    }

    const token = signSessionToken(sessionPayload)

    logAudit({
      userId: user.id,
      username: user.username,
      role: user.role,
      action: 'CONNEXION',
      entityType: 'USER',
      entityId: user.id,
      details: `Connexion réussie (${user.role}${user.team_id ? ' - Équipe ' + user.team_id : ''})`
    })

    const response = NextResponse.json({
      success: true,
      user: sessionPayload
    })

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 3600
    })

    return response
  } catch (err: any) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Une erreur interne est survenue.' }, { status: 500 })
  }
}
