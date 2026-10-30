// lib/services/audit.ts
import { getDatabase } from '../db'
import crypto from 'node:crypto'

export function logAudit(params: {
  userId?: string | null
  username?: string | null
  role?: string | null
  action: string
  entityType: string
  entityId?: string | null
  details?: string
  ipAddress?: string
}) {
  try {
    const db = getDatabase()
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, username, role, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `audit_${crypto.randomUUID()}`,
      params.userId || null,
      params.username || 'système',
      params.role || 'SYSTEM',
      params.action,
      params.entityType,
      params.entityId || null,
      params.details || null,
      params.ipAddress || null
    )
  } catch (err) {
    console.error('Failed to write audit log:', err)
  }
}
