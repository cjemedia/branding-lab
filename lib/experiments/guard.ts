import 'server-only'
import { NextResponse } from 'next/server'
import { getLabSession } from '@/lib/session'
import { checkExperimentAccess } from '@/lib/access'
import { createServiceClient } from '@/lib/supabase/service'
import type { Experiment } from '@/lib/types'

// Shared check for every experiment API call: signed in and allowed to open it.
export async function guardExperiment(experimentId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(experimentId)) {
    return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  }

  const session = await getLabSession()
  if (!session?.profile) {
    return { error: NextResponse.json({ error: 'Please sign in again.' }, { status: 401 }) }
  }

  const access = await checkExperimentAccess(experimentId, session.userId)
  if (!access.allowed) {
    return { error: NextResponse.json({ error: 'This experiment is locked.', reason: access.reason }, { status: 403 }) }
  }

  const supabase = createServiceClient()
  const { data: experiment } = await supabase.from('experiments').select('*').eq('id', experimentId).single()

  return { session, experiment: experiment as Experiment, supabase }
}
