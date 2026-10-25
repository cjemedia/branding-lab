import 'server-only'
import { createServiceClient } from '@/lib/supabase/service'

export interface InstructionSet {
  technical: string
  experienceVoice: string
  experimentRules: string
  versionIds: string[]
}

// Loads the published instruction layers for an experiment.
// An experiment-specific experience voice overrides the shared one when present.
export async function loadInstructions(experimentId: string): Promise<InstructionSet> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('ai_instruction_versions')
    .select('id, layer, experiment_id, body')
    .eq('status', 'published')
    .or(`experiment_id.is.null,experiment_id.eq.${experimentId}`)

  if (error) throw new Error(error.message)
  const rows = data ?? []

  const sharedTechnical = rows.find((r) => r.layer === 'technical' && !r.experiment_id)
  const experimentTechnical = rows.find((r) => r.layer === 'technical' && r.experiment_id === experimentId)
  const voice =
    rows.find((r) => r.layer === 'experience_voice' && r.experiment_id === experimentId) ??
    rows.find((r) => r.layer === 'experience_voice' && !r.experiment_id)

  if (!sharedTechnical || !experimentTechnical || !voice) {
    throw new Error('AI instructions for this experiment are not published.')
  }

  return {
    technical: sharedTechnical.body,
    experienceVoice: voice.body,
    experimentRules: experimentTechnical.body,
    versionIds: [sharedTechnical.id, voice.id, experimentTechnical.id],
  }
}
