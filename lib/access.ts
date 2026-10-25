import 'server-only'
import { createServiceClient } from '@/lib/supabase/service'
import type { AccessReason, CardStatus, Experiment, ExperimentProgress } from '@/lib/types'

// The database function lab.experiment_access is the single source of truth.
export async function checkExperimentAccess(experimentId: string, userId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase.rpc('experiment_access', {
    p_experiment_id: experimentId,
    p_user_id: userId,
  })

  if (error || !data?.[0]) {
    return { allowed: false, reason: 'not_signed_in' as AccessReason }
  }

  return { allowed: Boolean(data[0].allowed), reason: data[0].reason as AccessReason }
}

export function cardStatus(
  experiment: Experiment,
  reason: AccessReason,
  progress: ExperimentProgress | undefined
): CardStatus {
  if (progress?.status === 'completed') return 'completed'
  if (progress?.status === 'in_progress') return 'in_progress'
  if (progress && experiment.is_open) return 'available'
  if (!progress && reason === 'ready_to_unlock' && experiment.is_open) return 'ready_to_unlock'
  return 'locked'
}
