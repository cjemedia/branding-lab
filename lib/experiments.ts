import 'server-only'
import { createServiceClient } from '@/lib/supabase/service'
import type { Experiment } from '@/lib/types'

export function parseExperimentNumber(param: string) {
  if (!/^\d{1,3}$/.test(param)) return null
  const n = Number(param)
  return Number.isInteger(n) && n > 0 ? n : null
}

export async function getExperimentByNumber(n: number) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('experiments')
    .select('*')
    .eq('number', n)
    .eq('is_published', true)
    .maybeSingle()
  return (data as Experiment) ?? null
}

export interface PublicQuestion {
  id: string
  prompt: string
  options: string[]
}

// Questions without the correct answers, safe to send to the browser.
export async function getPublicQuestions(experimentId: string): Promise<PublicQuestion[]> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('knowledge_check_questions')
    .select('id, prompt, options')
    .eq('experiment_id', experimentId)
    .eq('is_active', true)
    .order('sort_order')
  return (data ?? []).map((q) => ({ id: q.id, prompt: q.prompt, options: q.options as string[] }))
}
