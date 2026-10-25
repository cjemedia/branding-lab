import { NextResponse } from 'next/server'
import { getLabSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/service'

function csvCell(value: unknown) {
  const s = value === null || value === undefined ? '' : String(value)
  // Prevent spreadsheet formula injection
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s
  return `"${safe.replace(/"/g, '""')}"`
}

export async function GET() {
  const session = await getLabSession()
  if (session?.profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }

  const supabase = createServiceClient()
  const [{ data: profiles }, { data: memberships }, { data: progress }] = await Promise.all([
    supabase.from('profiles').select('id, email, full_name, brand_name, role, created_at'),
    supabase.from('memberships').select('user_id, tier, status, source, activated_at, ended_at'),
    supabase.from('experiment_progress').select('user_id, status'),
  ])

  const m = new Map((memberships ?? []).map((x) => [x.user_id, x]))
  const done = new Map<string, number>()
  for (const p of progress ?? []) if (p.status === 'completed') done.set(p.user_id, (done.get(p.user_id) ?? 0) + 1)

  const header = ['email', 'name', 'brand', 'role', 'tier', 'status', 'source', 'activated_at', 'ended_at', 'experiments_completed', 'joined']
  const lines = (profiles ?? []).map((p) => {
    const mm = m.get(p.id)
    return [p.email, p.full_name, p.brand_name, p.role, mm?.tier, mm?.status, mm?.source, mm?.activated_at, mm?.ended_at, done.get(p.id) ?? 0, p.created_at]
      .map(csvCell)
      .join(',')
  })

  return new NextResponse([header.join(','), ...lines].join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="branding-lab-members-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
