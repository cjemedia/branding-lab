import { Check } from 'lucide-react'
import { requireMember } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'
import { experimentCode } from '@/lib/types'

export default async function BlueprintPage() {
  const session = await requireMember('/blueprint')
  const supabase = createClient()

  const [{ data: experiments }, { data: sections }] = await Promise.all([
    supabase.from('experiments').select('id, number, title, brand_profile_section').eq('is_published', true).order('sort_order'),
    supabase.from('brand_profile_sections').select('section, updated_at').eq('user_id', session.userId),
  ])

  const done = new Set((sections ?? []).map((s) => s.section))
  const list = experiments ?? []
  const completed = list.filter((e) => e.brand_profile_section && done.has(e.brand_profile_section)).length

  return (
    <div className="space-y-8">
      <div className="card-dark p-8 sm:p-10">
        <p className="text-[11px] font-semibold tracking-label text-tiffany">THE BRANDING LAB.</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Your Brand Blueprint</h1>
        <p className="mt-6 text-sm text-white/70">
          {completed} of {list.length} sections complete
        </p>
      </div>

      <ol className="card divide-y divide-line">
        {list.map((e) => {
          const isDone = Boolean(e.brand_profile_section && done.has(e.brand_profile_section))
          return (
            <li key={e.id} className="flex items-center justify-between gap-4 px-6 py-5">
              <div>
                <p className="text-[11px] font-semibold tracking-label text-tiffany-dark">EXPERIMENT {experimentCode(e.number)}</p>
                <p className="mt-1 font-semibold">{e.title}</p>
              </div>
              {isDone ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-tiffany-soft px-3 py-1 text-xs font-semibold">
                  <Check className="h-3.5 w-3.5" /> Saved
                </span>
              ) : (
                <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-muted">Not yet</span>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
