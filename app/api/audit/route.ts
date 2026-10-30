// app/api/audit/route.ts
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/guard'
import { getDatabase } from '@/lib/db'

// GET /api/audit : Journal d'activité (Admin uniquement)
export async function GET() {
  try {
    await requireAdmin()
    const db = getDatabase()

    const logs = db.prepare(`
      SELECT * FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 100
    `).all()

    return NextResponse.json({ logs })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}
