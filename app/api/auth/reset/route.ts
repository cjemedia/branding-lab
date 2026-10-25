import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { createAuthLink } from '@/lib/auth-links'
import { sendEmail } from '@/lib/email/send'
import { resetEmail } from '@/lib/email/templates'
import { rateLimited } from '@/lib/rate-limit'

const schema = z.object({ email: z.string().email() })

// Always answers the same way, so nobody can use it to find out who is a member.
export async function POST(request: Request) {
  const ok = NextResponse.json({ ok: true })
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return ok

  const email = parsed.data.email.trim().toLowerCase()
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (rateLimited(`reset:${ip}`, 5, 15 * 60 * 1000) || rateLimited(`reset:${email}`, 3, 15 * 60 * 1000)) {
    return ok
  }

  try {
    const supabase = createServiceClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', email)
      .maybeSingle()

    // Only people with Lab access get a Lab reset email
    if (!profile) return ok

    const link = await createAuthLink('recovery', email)
    if (link.url) {
      await sendEmail({ to: email, ...resetEmail(link.url) })
    }
  } catch (error) {
    console.error('Password reset failed', error)
  }

  return ok
}
