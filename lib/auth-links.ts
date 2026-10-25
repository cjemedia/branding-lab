import 'server-only'
import { createServiceClient } from '@/lib/supabase/service'

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
}

// Creates a one-time link handled by /auth/confirm, so we can send it with
// Lab branding through Resend instead of Supabase's shared Hub emails.
export async function createAuthLink(
  type: 'invite' | 'recovery',
  email: string,
  data?: Record<string, unknown>
) {
  const supabase = createServiceClient()
  const { data: link, error } = await supabase.auth.admin.generateLink(
    type === 'invite' ? { type: 'invite', email, options: { data } } : { type: 'recovery', email }
  )

  if (error || !link?.properties?.hashed_token) {
    return { error: error?.message ?? 'Could not create link', url: null, userId: null }
  }

  const url = `${siteUrl()}/auth/confirm?token_hash=${encodeURIComponent(
    link.properties.hashed_token
  )}&type=${type}&next=/set-password`

  return { error: null, url, userId: link.user?.id ?? null }
}
