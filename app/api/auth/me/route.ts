// app/api/auth/me/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getMysqlPool, IS_MYSQL, getDatabase } from '@/lib/db'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 })
  }

  let team = null
  if (user.teamId) {
    if (IS_MYSQL) {
      const pool = getMysqlPool()
      const [rows]: any = await pool.query('SELECT id, code, name, city, primary_color, secondary_color, status FROM teams WHERE id = ?', [user.teamId])
      team = rows[0] || null
    } else {
      const db = getDatabase()
      team = db.prepare('SELECT id, code, name, city, primary_color, secondary_color, status FROM teams WHERE id = ?').get(user.teamId)
    }
  }

  return NextResponse.json({
    authenticated: true,
    user,
    team
  })
}
