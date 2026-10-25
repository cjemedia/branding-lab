import 'server-only'
import { createServiceClient } from '@/lib/supabase/service'
import { createAuthLink, siteUrl } from '@/lib/auth-links'
import { sendEmail } from '@/lib/email/send'
import { existingAccountEmail, inviteEmail } from '@/lib/email/templates'
import type { Tier } from '@/lib/types'

interface ProvisionInput {
  email: string
  name?: string | null
  tier?: Tier
  source: 'zapier' | 'admin'
  sendEmail?: boolean
}

export interface ProvisionResult {
  userId: string
  emailSent: 'invite' | 'existing_account' | 'none'
}

// Gives someone active Lab access. Works for brand-new people and for people
// who already have a login (for example, CJE Hub clients).
export async function provisionMember(input: ProvisionInput): Promise<ProvisionResult> {
  const supabase = createServiceClient()
  const email = input.email.trim().toLowerCase()
  const name = input.name?.trim() || null
  const tier: Tier = input.tier ?? 'branding_lab'
  const shouldEmail = input.sendEmail !== false

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('A valid email address is required.')
  }

  const { data: existingId } = await supabase.rpc('find_auth_user_id', { p_email: email })

  let userId: string
  let emailSent: ProvisionResult['emailSent'] = 'none'

  if (!existingId) {
    // Brand-new person: create the account and send a set-password link
    const link = await createAuthLink('invite', email, { full_name: name, app: 'branding_lab' })
    if (link.error || !link.url || !link.userId) throw new Error(link.error ?? 'Could not create account.')
    userId = link.userId
    if (shouldEmail) {
      const message = inviteEmail(name, link.url)
      await sendEmail({ to: email, ...message })
      emailSent = 'invite'
    }
  } else {
    userId = existingId as string
    if (shouldEmail) {
      const { data: authUser } = await supabase.auth.admin.getUserById(userId)
      const hasSignedInBefore = Boolean(authUser?.user?.last_sign_in_at)

      if (hasSignedInBefore) {
        const message = existingAccountEmail(name, `${siteUrl()}/login`)
        await sendEmail({ to: email, ...message })
        emailSent = 'existing_account'
      } else {
        // Account exists but was never used: send a fresh set-password link
        const link = await createAuthLink('recovery', email)
        if (link.error || !link.url) throw new Error(link.error ?? 'Could not create link.')
        const message = inviteEmail(name, link.url)
        await sendEmail({ to: email, ...message })
        emailSent = 'invite'
      }
    }
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', userId)
    .maybeSingle()

  if (!currentProfile) {
    const { error } = await supabase.from('profiles').insert({ id: userId, email, full_name: name })
    if (error) throw new Error(error.message)
  } else if (!currentProfile.full_name && name) {
    await supabase.from('profiles').update({ full_name: name }).eq('id', userId)
  }

  const { error: membershipError } = await supabase.from('memberships').upsert(
    {
      user_id: userId,
      tier,
      status: 'active',
      source: input.source,
      activated_at: new Date().toISOString(),
      ended_at: null,
    },
    { onConflict: 'user_id' }
  )
  if (membershipError) throw new Error(membershipError.message)

  return { userId, emailSent }
}
