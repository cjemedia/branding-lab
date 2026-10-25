import 'server-only'
import { createServiceClient } from '@/lib/supabase/service'

export type ContentMap = Record<string, string>

// Loads the published version of each requested content key.
// Missing keys come back as empty strings, so nothing renders for them.
export async function getContent(keys: string[]): Promise<ContentMap> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('content_versions')
    .select('key, value')
    .eq('status', 'published')
    .in('key', keys)

  const map: ContentMap = {}
  for (const key of keys) map[key] = ''
  for (const row of data ?? []) map[row.key] = row.value
  return map
}
