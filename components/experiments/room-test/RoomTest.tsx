import RoomTestClient from './RoomTestClient'
import { createServiceClient } from '@/lib/supabase/service'
import { answersSchema, emptyAnswers, resultSchema } from '@/lib/experiments/room-test/schema'
import { experimentCode } from '@/lib/types'
import type { ExperimentToolProps } from '../registry'

// Loads the student's saved progress for The Room Test, then hands off to the screens.
export default async function RoomTest({ experimentId, userId }: ExperimentToolProps) {
  const supabase = createServiceClient()
  const [{ data: progress }, { data: profile }, { data: nextExperiment }] = await Promise.all([
    supabase.from('experiment_progress').select('*').eq('user_id', userId).eq('experiment_id', experimentId).single(),
    supabase.from('profiles').select('brand_name').eq('id', userId).single(),
    supabase.from('experiments').select('number').eq('prerequisite_id', experimentId).eq('is_published', true).maybeSingle(),
  ])

  const answers = answersSchema.safeParse(progress?.answers ?? {})
  const draft = resultSchema.safeParse(progress?.draft_result)
  const approved = resultSchema.safeParse(progress?.approved_result)

  return (
    <RoomTestClient
      initial={{
        experimentId,
        answers: answers.success ? answers.data : emptyAnswers,
        step: progress?.current_step ?? 0,
        result: draft.success ? draft.data : approved.success ? approved.data : null,
        saved:
          progress?.status === 'completed' &&
          approved.success &&
          (!draft.success || JSON.stringify(draft.data) === JSON.stringify(approved.data)),
        needsRefresh: Boolean(progress?.needs_refresh),
        brandName: profile?.brand_name ?? '',
        nextExperimentHref: nextExperiment ? `/experiments/${experimentCode(nextExperiment.number)}` : '/dashboard',
      }}
    />
  )
}
