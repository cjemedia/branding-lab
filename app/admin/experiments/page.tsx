import Link from 'next/link'
import Banner from '@/components/Banner'
import { updateExperiment } from '../actions'
import { createServiceClient } from '@/lib/supabase/service'
import { experimentCode, type Experiment } from '@/lib/types'

export default async function AdminExperimentsPage({ searchParams }: { searchParams: { saved?: string; error?: string } }) {
  const supabase = createServiceClient()
  const [{ data: experiments }, { data: questions }] = await Promise.all([
    supabase.from('experiments').select('*').order('sort_order'),
    supabase.from('knowledge_check_questions').select('experiment_id').eq('is_active', true),
  ])

  const questionCount = new Map<string, number>()
  for (const q of questions ?? []) questionCount.set(q.experiment_id, (questionCount.get(q.experiment_id) ?? 0) + 1)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Experiments</h1>
        <p className="mt-1 text-sm text-muted">
          Order sets the unlock sequence: each visible experiment requires the one before it.
        </p>
      </div>

      {searchParams.saved ? <Banner tone="success">Saved.</Banner> : null}
      {searchParams.error ? <Banner tone="error">{searchParams.error}</Banner> : null}

      <div className="space-y-6">
        {((experiments ?? []) as Experiment[]).map((e) => (
          <form key={e.id} action={updateExperiment} className="card space-y-5 p-6">
            <input type="hidden" name="id" value={e.id} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] font-semibold tracking-label text-tiffany-dark">EXPERIMENT {experimentCode(e.number)}</p>
              <Link href={`/admin/experiments/${e.id}/questions`} className="text-sm font-semibold underline-offset-4 hover:underline">
                Knowledge check ({questionCount.get(e.id) ?? 0} questions)
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" name="title" defaultValue={e.title} required />
              <Field label="Subtitle" name="subtitle" defaultValue={e.subtitle} />
            </div>
            <label className="block">
              <span className="label">Description</span>
              <textarea name="description" defaultValue={e.description ?? ''} rows={2} className="input mt-2" />
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Estimated time" name="estimated_time" defaultValue={e.estimated_time} />
              <Field label="Order" name="sort_order" type="number" defaultValue={String(e.sort_order)} required />
              <label className="block">
                <span className="label">Membership</span>
                <select name="tier_required" defaultValue={e.tier_required} className="input mt-2">
                  <option value="branding_lab">The Branding Lab (all members)</option>
                  <option value="agency_lab">The Agency Lab only</option>
                </select>
              </label>
            </div>
            <Field label="Skool lesson link" name="lesson_url" defaultValue={e.lesson_url} placeholder="https://www.skool.com/..." />

            <div className="flex flex-wrap gap-6 text-sm">
              <Toggle name="is_published" label="Show on dashboard" checked={e.is_published} />
              <Toggle name="is_open" label="Open to students" checked={e.is_open} />
              <Toggle name="requires_knowledge_check" label="Requires knowledge check" checked={e.requires_knowledge_check} />
            </div>

            <button type="submit" className="btn-primary">Save</button>
          </form>
        ))}
      </div>
    </div>
  )
}

function Field({
  label,
  name,
  defaultValue,
  required,
  type = 'text',
  placeholder,
}: {
  label: string
  name: string
  defaultValue?: string | null
  required?: boolean
  type?: string
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input name={name} type={type} defaultValue={defaultValue ?? ''} required={required} placeholder={placeholder} className="input mt-2" />
    </label>
  )
}

function Toggle({ name, label, checked }: { name: string; label: string; checked: boolean }) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" name={name} defaultChecked={checked} className="h-4 w-4 accent-ink" />
      {label}
    </label>
  )
}
