import { NextResponse } from 'next/server'
import { z } from 'zod'
import { guardExperiment } from '@/lib/experiments/guard'
import { loadInstructions } from '@/lib/ai/instructions'
import { RESULT_MODEL, findAvoidedPhrases, generateStructured, removeDashes } from '@/lib/ai/claude'
import { answersSchema, missingForGeneration, resultJsonSchema, resultSchema } from '@/lib/experiments/room-test/schema'
import { formatRoomTestAnswers } from '@/lib/experiments/room-test/prompt'

export const maxDuration = 120

const DAILY_LIMIT = 6 // first result plus five regenerations per day

const bodySchema = z.object({ kind: z.enum(['result', 'regenerate']).default('result') })

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const guard = await guardExperiment(params.id)
  if ('error' in guard) return guard.error
  const { session, experiment, supabase } = guard

  if (experiment.slug !== 'the-room-test') {
    return NextResponse.json({ error: 'Results are not available for this experiment yet.' }, { status: 400 })
  }

  const body = bodySchema.parse(await request.json().catch(() => ({})))

  const { data: progress } = await supabase
    .from('experiment_progress')
    .select('answers')
    .eq('user_id', session.userId)
    .eq('experiment_id', experiment.id)
    .single()

  const answers = answersSchema.safeParse(progress?.answers ?? {})
  if (!answers.success) return NextResponse.json({ error: 'Your answers could not be read.' }, { status: 400 })
  const missing = missingForGeneration(answers.data)
  if (missing.length) {
    return NextResponse.json({ error: `A few answers are still missing: ${missing.join(', ')}.` }, { status: 400 })
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('ai_generations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', session.userId)
    .eq('experiment_id', experiment.id)
    .eq('status', 'succeeded')
    .gte('created_at', since)

  if ((count ?? 0) >= DAILY_LIMIT) {
    return NextResponse.json(
      { error: "You've reached today's limit for regenerating. You can still edit your results, and regenerate again tomorrow." },
      { status: 429 }
    )
  }

  let instructions
  try {
    instructions = await loadInstructions(experiment.id)
  } catch {
    return NextResponse.json({ error: 'Results are not available right now. Please try again later.' }, { status: 503 })
  }

  const { data: generation } = await supabase
    .from('ai_generations')
    .insert({
      user_id: session.userId,
      experiment_id: experiment.id,
      kind: body.kind,
      instruction_version_ids: instructions.versionIds,
      model: RESULT_MODEL,
      status: 'pending',
    })
    .select('id')
    .single()

  const userContent = formatRoomTestAnswers(answers.data)

  // One retry if the output does not match the expected shape
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await generateStructured({ instructions, userContent, schema: resultJsonSchema })
      const shaped = normalize(response.data)
      const parsed = resultSchema.safeParse(removeDashes(shaped))
      if (!parsed.success) {
        if (attempt === 2) throw new Error('The result did not come back in the expected format.')
        continue
      }

      const flags = findAvoidedPhrases(parsed.data)
      await supabase
        .from('ai_generations')
        .update({
          status: 'succeeded',
          output: { result: parsed.data, flags },
          input_tokens: response.inputTokens,
          output_tokens: response.outputTokens,
        })
        .eq('id', generation?.id)

      await supabase
        .from('experiment_progress')
        .update({ draft_result: parsed.data })
        .eq('user_id', session.userId)
        .eq('experiment_id', experiment.id)

      return NextResponse.json({ result: parsed.data })
    } catch (error) {
      if (attempt === 2) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        await supabase.from('ai_generations').update({ status: 'failed', error: message }).eq('id', generation?.id)
        return NextResponse.json(
          { error: 'Something went wrong while building your results. Your answers are saved, so you can try again.' },
          { status: 502 }
        )
      }
    }
  }

  return NextResponse.json({ error: 'Something went wrong.' }, { status: 502 })
}

// Trims arrays that came back longer than the snapshot allows
function normalize(data: unknown) {
  const d = data as Record<string, any>
  if (!d || typeof d !== 'object') return d
  const cap = (arr: unknown, n: number) => (Array.isArray(arr) ? arr.slice(0, n) : arr)
  if (d.personality_mix) d.personality_mix.traits = cap(d.personality_mix.traits, 5)
  if (d.how_it_speaks) {
    d.how_it_speaks.example_phrases = cap(d.how_it_speaks.example_phrases, 3)
    d.how_it_speaks.habits_to_avoid = cap(d.how_it_speaks.habits_to_avoid, 3)
  }
  if (d.memorable) d.memorable.common_qualities = cap(d.memorable.common_qualities, 5)
  d.reality_check = cap(d.reality_check, 3)
  d.next_moves = cap(d.next_moves, 3)
  return d
}
