// lib/auth/guard.ts
import { getCurrentUser, SessionUser } from './session'

export class AuthError extends Error {
  constructor(message: string, public status = 403) {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * Exige une session valide. Renvoie l'utilisateur connecté ou lève une exception 401.
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new AuthError('Non autorisé - Veuillez vous connecter.', 401)
  }
  return user
}

/**
 * Exige le rôle ADMINISTRATEUR. Lève une exception 403 sinon.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth()
  if (user.role !== 'ADMIN') {
    throw new AuthError('Accès interdit - Privilèges Administrateur requis.', 403)
  }
  return user
}

/**
 * ISOLATION STRICTE DU DIRIGEANT :
 * - Si l'utilisateur est ADMIN : accès autorisé à toute équipe.
 * - Si l'utilisateur est TEAM_MANAGER : accès UNIQUEMENT à son équipe associée (teamId).
 *   Toute tentative de lecture ou d'écriture sur une autre équipe est rejetée côté serveur (403).
 * - Tout autre rôle : rejeté.
 */
export async function requireTeamAccess(targetTeamId: string): Promise<SessionUser> {
  const user = await requireAuth()
  
  if (user.role === 'ADMIN') {
    return user
  }

  if (user.role === 'TEAM_MANAGER') {
    if (!user.teamId || user.teamId !== targetTeamId) {
      throw new AuthError('Accès interdit - Vous ne pouvez gérer que votre propre équipe.', 403)
    }
    return user
  }

  throw new AuthError('Accès interdit à ces données.', 403)
}

/**
 * Exige un rôle officiel ou administrateur pour la gestion sportive (arbitrage, feuilles de match)
 */
export async function requireOfficialOrAdmin(): Promise<SessionUser> {
  const user = await requireAuth()
  if (user.role !== 'ADMIN' && user.role !== 'OFFICIAL') {
    throw new AuthError('Accès interdit - Rôle Officiel ou Administrateur requis.', 403)
  }
  return user
}
