import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { checkExperimentAccess, cardStatus } from '@/lib/access'
import type { AccessReason, CardStatus, Experiment, ExperimentProgress } from '@/lib/types'

export interface ExperimentCardData {
  experiment: Experiment
  status: CardStatus
  reason: AccessReason
  progress?: ExperimentProgress
}

export async function loadExperimentCards(userId: string): Promise<ExperimentCardData[]> {
  const supabase = createClient()

  const [{ data: experiments }, { data: progressRows }] = await Promise.all([
    supabase.from('experiments').select('*').eq('is_published', true).order('sort_order'),
    supabase.from('experiment_progress').select('*').eq('user_id', userId),
  ])

  const list = (experiments ?? []) as Experiment[]
  const progressByExperiment = new Map(
    ((progressRows ?? []) as ExperimentProgress[]).map((p) => [p.experiment_id, p])
  )

  const access = await Promise.all(list.map((e) => checkExperimentAccess(e.id, userId)))

  return list.map((experiment, i) => {
    const progress = progressByExperiment.get(experiment.id)
    const reason = access[i].reason
    return { experiment, reason, progress, status: cardStatus(experiment, reason, progress) }
  })
}
