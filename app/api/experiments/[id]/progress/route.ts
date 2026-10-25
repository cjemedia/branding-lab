import { NextResponse } from 'next/server'
import { z } from 'zod'
import { guardExperiment } from '@/lib/experiments/guard'
import { experimentSchemas } from '@/lib/experiments/schemas'

const bodySchema = z.object({
  answers: z.unknown(),
  currentStep: z.number().int().min(0).max(50),
})

// Autosave: stores answers and the current screen.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const guard = await guardExperiment(params.id)
  if ('error' in guard) return guard.error
  const { session, experiment, supabase } = guard

  const body = bodySchema.safeParse(await request.json().catch(() => null))
  const schemas = experimentSchemas[experiment.slug]
  if (!body.success || !schemas) {
    return NextResponse.json({ error: 'Could not save.' }, { status: 400 })
  }

  const answers = schemas.answers.safeParse(body.data.answers)
  if (!answers.success) {
    return NextResponse.json({ error: 'Some answers were too long or not valid.' }, { status: 400 })
  }

  const { data: current } = await supabase
    .from('experiment_progress')
    .select('status, started_at')
    .eq('user_id', session.userId)
    .eq('experiment_id', experiment.id)
    .single()

  const update: Record<string, unknown> = {
    answers: answers.data,
    current_step: body.data.currentStep,
  }
  if (current?.status === 'unlocked') update.status = 'in_progress'
  if (!current?.started_at) update.started_at = new Date().toISOString()

  const { error } = await supabase
    .from('experiment_progress')
    .update(update)
    .eq('user_id', session.userId)
    .eq('experiment_id', experiment.id)

  if (error) return NextResponse.json({ error: 'Could not save.' }, { status: 500 })
  return NextResponse.json({ ok: true, savedAt: new Date().toISOString() })
}
