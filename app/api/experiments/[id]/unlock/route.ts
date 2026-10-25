import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getLabSession } from '@/lib/session'
import { checkExperimentAccess } from '@/lib/access'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimited } from '@/lib/rate-limit'

const schema = z.object({
  answers: z.record(z.string().uuid(), z.number().int().min(0)).default({}),
})

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getLabSession()
  if (!session?.profile) {
    return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 })
  }

  if (rateLimited(`unlock:${session.userId}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Take a short break and try again.' }, { status: 429 })
  }

  const parsed = schema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Something was off with that submission.' }, { status: 400 })
  }

  const experimentId = params.id
  const access = await checkExperimentAccess(experimentId, session.userId)
  if (access.reason !== 'ready_to_unlock') {
    return NextResponse.json({ error: 'This experiment cannot be unlocked right now.', reason: access.reason }, { status: 403 })
  }

  const supabase = createServiceClient()
  const { data: experiment } = await supabase
    .from('experiments')
    .select('id, is_open, requires_knowledge_check')
    .eq('id', experimentId)
    .single()

  if (!experiment?.is_open) {
    return NextResponse.json({ error: 'This experiment is not open yet.' }, { status: 403 })
  }

  let unlockedBy: 'knowledge_check' | 'no_check_required' = 'no_check_required'
  let results: { id: string; correct: boolean; explanation: string | null }[] = []

  if (experiment.requires_knowledge_check) {
    const { data: questions } = await supabase
      .from('knowledge_check_questions')
      .select('id, correct_index, explanation')
      .eq('experiment_id', experimentId)
      .eq('is_active', true)

    if (!questions?.length) {
      return NextResponse.json({ error: 'The knowledge check for this experiment is not set up yet.' }, { status: 409 })
    }

    results = questions.map((q) => ({
      id: q.id,
      correct: parsed.data.answers[q.id] === q.correct_index,
      explanation: q.explanation,
    }))
    const score = results.filter((r) => r.correct).length
    const passed = score === questions.length

    await supabase.from('knowledge_check_attempts').insert({
      user_id: session.userId,
      experiment_id: experimentId,
      answers: parsed.data.answers,
      score,
      total: questions.length,
      passed,
    })

    if (!passed) {
      return NextResponse.json({
        passed: false,
        results: results.map((r) => ({ id: r.id, correct: r.correct, explanation: r.correct ? null : r.explanation })),
      })
    }
    unlockedBy = 'knowledge_check'
  }

  const { error } = await supabase.from('experiment_progress').upsert(
    { user_id: session.userId, experiment_id: experimentId, status: 'unlocked', unlocked_by: unlockedBy },
    { onConflict: 'user_id,experiment_id', ignoreDuplicates: true }
  )
  if (error) {
    return NextResponse.json({ error: 'Could not unlock. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ passed: true, results })
}
