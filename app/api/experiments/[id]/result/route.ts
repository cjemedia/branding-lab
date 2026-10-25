import { NextResponse } from 'next/server'
import { z } from 'zod'
import { guardExperiment } from '@/lib/experiments/guard'
import { experimentSchemas } from '@/lib/experiments/schemas'
import { removeDashes } from '@/lib/ai/claude'

const bodySchema = z.object({
  result: z.unknown(),
  brandName: z.string().max(120).optional(),
  approve: z.boolean().default(false),
})

// Saves the student's (possibly edited) result. With approve, it completes the
// experiment and writes the section to the Brand Blueprint.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const guard = await guardExperiment(params.id)
  if ('error' in guard) return guard.error
  const { session, experiment, supabase } = guard

  const body = bodySchema.safeParse(await request.json().catch(() => null))
  const schemas = experimentSchemas[experiment.slug]
  if (!body.success || !schemas) return NextResponse.json({ error: 'Could not save.' }, { status: 400 })

  const result = schemas.result.safeParse(removeDashes(body.data.result))
  if (!result.success) {
    return NextResponse.json({ error: 'Some fields are empty or too long. Fill in every section before saving.' }, { status: 400 })
  }

  if (body.data.brandName !== undefined) {
    await supabase
      .from('profiles')
      .update({ brand_name: body.data.brandName.trim() || null })
      .eq('id', session.userId)
  }

  const { data: progress } = await supabase
    .from('experiment_progress')
    .select('status, answers, completed_at')
    .eq('user_id', session.userId)
    .eq('experiment_id', experiment.id)
    .single()

  const now = new Date().toISOString()
  const update: Record<string, unknown> = { draft_result: result.data }
  if (body.data.approve) {
    update.approved_result = result.data
    update.status = 'completed'
    update.needs_refresh = false
    if (!progress?.completed_at) update.completed_at = now
  }

  const { error } = await supabase
    .from('experiment_progress')
    .update(update)
    .eq('user_id', session.userId)
    .eq('experiment_id', experiment.id)
  if (error) return NextResponse.json({ error: 'Could not save.' }, { status: 500 })

  if (body.data.approve && experiment.brand_profile_section) {
    await supabase.from('brand_profile_sections').upsert(
      {
        user_id: session.userId,
        section: experiment.brand_profile_section,
        source_experiment_id: experiment.id,
        data: { answers: progress?.answers ?? {}, result: result.data },
      },
      { onConflict: 'user_id,section' }
    )

    // A re-saved earlier experiment may affect later ones. Flag them, never erase them.
    if (progress?.status === 'completed') {
      const { data: later } = await supabase
        .from('experiments')
        .select('id')
        .gt('sort_order', experiment.sort_order)
      const ids = (later ?? []).map((e) => e.id)
      if (ids.length) {
        await supabase
          .from('experiment_progress')
          .update({ needs_refresh: true })
          .eq('user_id', session.userId)
          .eq('status', 'completed')
          .in('experiment_id', ids)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
