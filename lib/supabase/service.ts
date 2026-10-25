import 'server-only'
import { createClient } from '@supabase/supabase-js'

// Server-only client that bypasses Row Level Security.
// Only use after the request has been checked (signed in, allowed, admin, or valid secret).
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase service role environment variables.')
  }

  return createClient(url, key, {
    db: { schema: 'lab' },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
