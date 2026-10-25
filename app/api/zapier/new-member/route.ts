import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { provisionMember } from '@/lib/provision'
import { logAudit } from '@/lib/audit'

// Zapier sends Skool's "New Paid Member" here with the shared secret
// in the x-lab-secret header. Field names are flexible because the exact
// Skool payload is confirmed during the first test join.
const schema = z
  .object({
    email: z.string().email(),
    name: z.string().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    tier: z.enum(['branding_lab', 'agency_lab']).optional(),
  })
  .passthrough()

function validSecret(provided: string | null) {
  const expected = process.env.ZAPIER_WEBHOOK_SECRET
  if (!expected || !provided) return false
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: Request) {
  if (!validSecret(request.headers.get('x-lab-secret'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const supabase = createServiceClient()
  const parsed = schema.safeParse(body)
  const email = parsed.success ? parsed.data.email.toLowerCase() : null

  const { data: event } = await supabase
    .from('integration_events')
    .insert({ source: 'zapier', event_type: 'new_paid_member', email, payload: body ?? {} })
    .select('id')
    .single()

  if (!parsed.success) {
    await supabase
      .from('integration_events')
      .update({ status: 'failed', error: 'Missing or invalid email', processed_at: new Date().toISOString() })
      .eq('id', event?.id)
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
  }

  const d = parsed.data
  const name = d.name || [d.first_name, d.last_name].filter(Boolean).join(' ') || null

  try {
    const result = await provisionMember({ email: d.email, name, tier: d.tier, source: 'zapier' })
    await supabase
      .from('integration_events')
      .update({ status: 'processed', processed_at: new Date().toISOString() })
      .eq('id', event?.id)
    await logAudit(null, 'member.added_by_zapier', result.userId, { emailSent: result.emailSent })
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    await supabase
      .from('integration_events')
      .update({ status: 'failed', error: message, processed_at: new Date().toISOString() })
      .eq('id', event?.id)
    return NextResponse.json({ error: 'Could not add member.' }, { status: 500 })
  }
}
