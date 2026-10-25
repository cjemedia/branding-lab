'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireAdmin } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/service'
import { provisionMember } from '@/lib/provision'
import { logAudit } from '@/lib/audit'

const tierSchema = z.enum(['branding_lab', 'agency_lab'])
const statusSchema = z.enum(['pending', 'active', 'suspended', 'cancelled', 'expired'])

function text(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function nullable(formData: FormData, key: string) {
  const value = text(formData, key)
  return value === '' ? null : value
}

// ---------------------------------------------------------------- Members

export async function addMember(formData: FormData) {
  const admin = await requireAdmin()
  const email = text(formData, 'email')
  const name = nullable(formData, 'name')
  const tier = tierSchema.parse(text(formData, 'tier') || 'branding_lab')

  let userId: string
  try {
    const result = await provisionMember({ email, name, tier, source: 'admin' })
    userId = result.userId
    await logAudit(admin.userId, 'member.added', userId, { email, tier, emailSent: result.emailSent })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not add member.'
    redirect(`/admin?error=${encodeURIComponent(message)}`)
  }
  redirect(`/admin/members/${userId}?added=1`)
}

export async function updateMembership(formData: FormData) {
  const admin = await requireAdmin()
  const userId = z.string().uuid().parse(text(formData, 'userId'))
  const status = statusSchema.parse(text(formData, 'status'))
  const tier = tierSchema.parse(text(formData, 'tier'))
  const notes = nullable(formData, 'notes')

  const supabase = createServiceClient()
  const { data: before } = await supabase.from('memberships').select('status, tier').eq('user_id', userId).maybeSingle()

  const now = new Date().toISOString()
  const update: Record<string, unknown> = { status, tier, notes }
  if (status === 'active' && before?.status !== 'active') {
    update.activated_at = now
    update.ended_at = null
  }
  if (['cancelled', 'expired', 'suspended'].includes(status) && before?.status === 'active') {
    update.ended_at = now
  }

  const { error } = await supabase
    .from('memberships')
    .upsert({ user_id: userId, source: 'admin', ...update }, { onConflict: 'user_id' })
  if (error) throw new Error(error.message)

  await logAudit(admin.userId, 'membership.updated', userId, { before, after: { status, tier } })
  revalidatePath(`/admin/members/${userId}`)
  revalidatePath('/admin')
}

export async function resendAccessEmail(formData: FormData) {
  const admin = await requireAdmin()
  const userId = z.string().uuid().parse(text(formData, 'userId'))
  const supabase = createServiceClient()
  const { data: profile } = await supabase.from('profiles').select('email, full_name').eq('id', userId).single()
  const { data: membership } = await supabase.from('memberships').select('tier, status').eq('user_id', userId).maybeSingle()

  if (!profile || membership?.status !== 'active') {
    redirect(`/admin/members/${userId}?error=${encodeURIComponent('Only active members can be sent an access email.')}`)
  }

  const result = await provisionMember({
    email: profile.email,
    name: profile.full_name,
    tier: membership.tier,
    source: 'admin',
  })
  await logAudit(admin.userId, 'member.access_email_resent', userId, { emailSent: result.emailSent })
  redirect(`/admin/members/${userId}?sent=1`)
}

export async function setAdminRole(formData: FormData) {
  const admin = await requireAdmin()
  const userId = z.string().uuid().parse(text(formData, 'userId'))
  const role = z.enum(['student', 'admin']).parse(text(formData, 'role'))
  if (userId === admin.userId && role !== 'admin') {
    redirect(`/admin/members/${userId}?error=${encodeURIComponent('You cannot remove your own admin access.')}`)
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
  if (error) throw new Error(error.message)
  await logAudit(admin.userId, 'profile.role_changed', userId, { role })
  revalidatePath(`/admin/members/${userId}`)
}

// --------------------------------------------------------------- Progress

export async function manualUnlock(formData: FormData) {
  const admin = await requireAdmin()
  const userId = z.string().uuid().parse(text(formData, 'userId'))
  const experimentId = z.string().uuid().parse(text(formData, 'experimentId'))

  const supabase = createServiceClient()
  const { error } = await supabase.from('experiment_progress').upsert(
    { user_id: userId, experiment_id: experimentId, status: 'unlocked', unlocked_by: 'admin' },
    { onConflict: 'user_id,experiment_id', ignoreDuplicates: true }
  )
  if (error) throw new Error(error.message)
  await logAudit(admin.userId, 'experiment.manual_unlock', userId, { experimentId })
  revalidatePath(`/admin/members/${userId}`)
}

export async function reopenExperiment(formData: FormData) {
  const admin = await requireAdmin()
  const userId = z.string().uuid().parse(text(formData, 'userId'))
  const experimentId = z.string().uuid().parse(text(formData, 'experimentId'))

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('experiment_progress')
    .update({ status: 'in_progress', completed_at: null })
    .eq('user_id', userId)
    .eq('experiment_id', experimentId)
  if (error) throw new Error(error.message)
  await logAudit(admin.userId, 'experiment.reopened', userId, { experimentId })
  revalidatePath(`/admin/members/${userId}`)
}

export async function resetExperiment(formData: FormData) {
  const admin = await requireAdmin()
  const userId = z.string().uuid().parse(text(formData, 'userId'))
  const experimentId = z.string().uuid().parse(text(formData, 'experimentId'))

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('experiment_progress')
    .delete()
    .eq('user_id', userId)
    .eq('experiment_id', experimentId)
  if (error) throw new Error(error.message)
  await logAudit(admin.userId, 'experiment.reset', userId, { experimentId })
  revalidatePath(`/admin/members/${userId}`)
}

// ------------------------------------------------------------ Experiments

export async function updateExperiment(formData: FormData) {
  const admin = await requireAdmin()
  const id = z.string().uuid().parse(text(formData, 'id'))

  const update = {
    title: z.string().min(1).parse(text(formData, 'title')),
    subtitle: nullable(formData, 'subtitle'),
    description: nullable(formData, 'description'),
    estimated_time: nullable(formData, 'estimated_time'),
    lesson_url: nullable(formData, 'lesson_url'),
    tier_required: tierSchema.parse(text(formData, 'tier_required')),
    sort_order: z.coerce.number().int().parse(text(formData, 'sort_order')),
    is_published: formData.get('is_published') === 'on',
    is_open: formData.get('is_open') === 'on',
    requires_knowledge_check: formData.get('requires_knowledge_check') === 'on',
  }

  if (update.lesson_url && !/^https:\/\//.test(update.lesson_url)) {
    redirect(`/admin/experiments?error=${encodeURIComponent('Lesson links must start with https://')}`)
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from('experiments').update(update).eq('id', id)
  if (error) throw new Error(error.message)

  await rebuildPrerequisites()
  await logAudit(admin.userId, 'experiment.updated', null, { id, ...update })
  revalidatePath('/admin/experiments')
  redirect('/admin/experiments?saved=1')
}

// Each published experiment requires the one before it, in display order.
async function rebuildPrerequisites() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('experiments')
    .select('id, is_published, prerequisite_id')
    .order('sort_order')
  let previous: string | null = null
  for (const e of data ?? []) {
    if (!e.is_published) continue
    if (e.prerequisite_id !== previous) {
      await supabase.from('experiments').update({ prerequisite_id: previous }).eq('id', e.id)
    }
    previous = e.id
  }
}

// -------------------------------------------------------- Knowledge checks

export async function saveQuestion(formData: FormData) {
  const admin = await requireAdmin()
  const experimentId = z.string().uuid().parse(text(formData, 'experimentId'))
  const questionId = nullable(formData, 'questionId')
  const options = [1, 2, 3, 4].map((i) => text(formData, `option${i}`)).filter(Boolean)
  const correct = z.coerce.number().int().min(1).max(4).parse(text(formData, 'correct'))

  const back = `/admin/experiments/${experimentId}/questions`
  if (options.length < 2) redirect(`${back}?error=${encodeURIComponent('Add at least two answer options.')}`)
  if (correct > options.length) redirect(`${back}?error=${encodeURIComponent('The correct answer must be one of the options you filled in.')}`)

  const row = {
    experiment_id: experimentId,
    prompt: z.string().min(1).parse(text(formData, 'prompt')),
    options,
    correct_index: correct - 1,
    explanation: nullable(formData, 'explanation'),
    sort_order: z.coerce.number().int().catch(0).parse(text(formData, 'sort_order')),
    is_active: formData.get('is_active') !== 'off',
  }

  const supabase = createServiceClient()
  const { error } = questionId
    ? await supabase.from('knowledge_check_questions').update(row).eq('id', questionId)
    : await supabase.from('knowledge_check_questions').insert(row)
  if (error) throw new Error(error.message)

  await logAudit(admin.userId, questionId ? 'question.updated' : 'question.added', null, { experimentId, questionId })
  redirect(`${back}?saved=1`)
}

export async function deleteQuestion(formData: FormData) {
  const admin = await requireAdmin()
  const experimentId = z.string().uuid().parse(text(formData, 'experimentId'))
  const questionId = z.string().uuid().parse(text(formData, 'questionId'))
  const supabase = createServiceClient()
  await supabase.from('knowledge_check_questions').delete().eq('id', questionId)
  await logAudit(admin.userId, 'question.deleted', null, { experimentId, questionId })
  redirect(`/admin/experiments/${experimentId}/questions`)
}

// ----------------------------------------------------------------- Content

// Saving creates a new numbered version and publishes it. Earlier versions stay
// in history so any change can be rolled back.
export async function publishContent(formData: FormData) {
  const admin = await requireAdmin()
  const key = z.string().min(1).parse(text(formData, 'key'))
  const value = text(formData, 'value')

  const supabase = createServiceClient()
  const { data: latest } = await supabase
    .from('content_versions')
    .select('version')
    .eq('key', key)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  await supabase.from('content_versions').update({ status: 'archived' }).eq('key', key).eq('status', 'published')
  const { error } = await supabase.from('content_versions').insert({
    key,
    value,
    version: (latest?.version ?? 0) + 1,
    status: 'published',
    created_by: admin.userId,
    published_at: new Date().toISOString(),
  })
  if (error) throw new Error(error.message)

  await logAudit(admin.userId, 'content.published', null, { key, version: (latest?.version ?? 0) + 1 })
  revalidatePath('/admin/content')
  redirect(`/admin/content?saved=${encodeURIComponent(key)}`)
}

export async function restoreContentVersion(formData: FormData) {
  await requireAdmin()
  const versionId = z.string().uuid().parse(text(formData, 'versionId'))
  const supabase = createServiceClient()
  const { data: version } = await supabase.from('content_versions').select('key, value').eq('id', versionId).single()
  if (!version) redirect('/admin/content')

  const restore = new FormData()
  restore.set('key', version.key)
  restore.set('value', version.value)
  await publishContent(restore)
}
