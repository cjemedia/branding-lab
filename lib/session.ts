import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Membership, Profile } from '@/lib/types'

export interface LabSession {
  userId: string
  email: string
  profile: Profile | null
  membership: Membership | null
}

export async function getLabSession(): Promise<LabSession | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase.from('profiles').select('id, email, full_name, brand_name, role').eq('id', user.id).maybeSingle(),
    supabase
      .from('memberships')
      .select('id, user_id, tier, status, source, activated_at, ended_at, notes')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  return {
    userId: user.id,
    email: user.email ?? '',
    profile: (profile as Profile) ?? null,
    membership: (membership as Membership) ?? null,
  }
}

// Students and admins with an active membership. Admins always pass.
export async function requireMember(next?: string) {
  const session = await getLabSession()
  if (!session) redirect(next ? `/login?next=${encodeURIComponent(next)}` : '/login')
  if (!session.profile) redirect('/no-access')
  if (session.profile.role !== 'admin' && session.membership?.status !== 'active') {
    redirect('/account')
  }
  return session as LabSession & { profile: Profile }
}

export async function requireAdmin() {
  const session = await getLabSession()
  if (!session) redirect('/login?next=/admin')
  if (session.profile?.role !== 'admin') redirect('/dashboard')
  return session as LabSession & { profile: Profile }
}
