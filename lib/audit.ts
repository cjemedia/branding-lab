import 'server-only'
import { createServiceClient } from '@/lib/supabase/service'

export async function logAudit(
  actorId: string | null,
  action: string,
  targetUserId: string | null,
  details: Record<string, unknown> = {}
) {
  const supabase = createServiceClient()
  await supabase.from('audit_log').insert({
    actor_id: actorId,
    action,
    target_user_id: targetUserId,
    details,
  })
}
