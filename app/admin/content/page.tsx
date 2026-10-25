import Banner from '@/components/Banner'
import { publishContent, restoreContentVersion } from '../actions'
import { createServiceClient } from '@/lib/supabase/service'

const AREA_LABEL: Record<string, string> = {
  global: 'Everywhere',
  login: 'Sign in page',
  dashboard: 'Dashboard',
  access: 'Locked and knowledge check messages',
}

export default async function AdminContentPage({ searchParams }: { searchParams: { saved?: string } }) {
  const supabase = createServiceClient()
  const [{ data: items }, { data: versions }] = await Promise.all([
    supabase.from('content_items').select('*').order('area').order('key'),
    supabase.from('content_versions').select('id, key, value, version, status, published_at').order('version', { ascending: false }),
  ])

  const byKey = new Map<string, NonNullable<typeof versions>>()
  for (const v of versions ?? []) byKey.set(v.key, [...(byKey.get(v.key) ?? []), v])

  const areas = Array.from(new Set((items ?? []).map((i) => i.area)))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content</h1>
        <p className="mt-1 text-sm text-muted">
          Edit headlines, messages, and button text. Every save is kept as a version, so you can restore an earlier one.
        </p>
      </div>

      {searchParams.saved ? <Banner tone="success">Published. It&apos;s live now.</Banner> : null}

      {areas.map((area) => (
        <section key={area} className="space-y-4">
          <h2 className="text-lg font-bold">{AREA_LABEL[area] ?? area}</h2>
          {(items ?? [])
            .filter((i) => i.area === area)
            .map((item) => {
              const history = byKey.get(item.key) ?? []
              const current = history.find((v) => v.status === 'published')
              const previous = history.filter((v) => v.status !== 'published').slice(0, 5)
              return (
                <div key={item.key} className="card p-6">
                  <form action={publishContent} className="space-y-3">
                    <input type="hidden" name="key" value={item.key} />
                    <label className="block">
                      <span className="label">{item.label}</span>
                      <textarea name="value" defaultValue={current?.value ?? ''} rows={2} className="input mt-2" />
                    </label>
                    {item.help_text ? <p className="text-xs text-muted">{item.help_text}</p> : null}
                    <div className="flex flex-wrap items-center gap-4">
                      <button type="submit" className="btn-primary">Publish</button>
                      {current ? <span className="text-xs text-muted">Version {current.version}</span> : null}
                    </div>
                  </form>
                  {previous.length ? (
                    <details className="mt-4 text-sm">
                      <summary className="cursor-pointer font-semibold text-muted">Earlier versions</summary>
                      <ul className="mt-3 space-y-2">
                        {previous.map((v) => (
                          <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-cream px-4 py-3">
                            <span>
                              <span className="font-semibold">v{v.version}:</span> {v.value}
                            </span>
                            <form action={restoreContentVersion}>
                              <input type="hidden" name="versionId" value={v.id} />
                              <button type="submit" className="text-xs font-semibold underline-offset-4 hover:underline">
                                Restore
                              </button>
                            </form>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : null}
                </div>
              )
            })}
        </section>
      ))}
    </div>
  )
}
