// lib/auth/session.ts
import crypto from 'node:crypto'
import { cookies } from 'next/headers'

const SESSION_SECRET = process.env.SESSION_SECRET || 'secret_cle_plateforme_privee_tournoi_football_2026_super_secure'
export const COOKIE_NAME = 'tfb_session'

export interface SessionUser {
  id: string
  username: string
  email: string
  fullName: string
  role: 'ADMIN' | 'TEAM_MANAGER' | 'OFFICIAL'
  teamId?: string | null
}

interface TokenPayload {
  user: SessionUser
  exp: number
}

export function signSessionToken(user: SessionUser, expiresInHours = 24): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInHours * 3600
  const data: TokenPayload = { user, exp }
  const payloadBase64 = Buffer.from(JSON.stringify(data)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadBase64)
    .digest('base64url')
  return `${payloadBase64}.${signature}`
}

export function verifySessionToken(token: string): SessionUser | null {
  try {
    const [payloadBase64, signature] = token.split('.')
    if (!payloadBase64 || !signature) return null

    const expectedSignature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payloadBase64)
      .digest('base64url')

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null
    }

    const payload: TokenPayload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'))
    if (Date.now() / 1000 > payload.exp) {
      return null
    }
    return payload.user
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySessionToken(token)
}
