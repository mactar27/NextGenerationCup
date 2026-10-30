// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server'
import { COOKIE_NAME, getCurrentUser } from '@/lib/auth/session'
import { logAudit } from '@/lib/services/audit'

export async function POST() {
  const user = await getCurrentUser()
  if (user) {
    logAudit({
      userId: user.id,
      username: user.username,
      role: user.role,
      action: 'DECONNEXION',
      entityType: 'USER',
      entityId: user.id,
      details: 'Déconnexion manuelle'
    })
  }

  const response = NextResponse.json({ success: true, message: 'Déconnecté avec succès.' })
  response.cookies.delete(COOKIE_NAME)
  return response
}
