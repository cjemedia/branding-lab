import { createServiceClient } from '@/lib/supabase/service'

function when(iso: string) {
  return new Date(iso).toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'medium', timeStyle: 'short' })
}

export default async function ActivityPage() {
  const supabase = createServiceClient()
  const [{ data: events }, { data: audit }, { data: profiles }] = await Promise.all([
    supabase.from('integration_events').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('profiles').select('id, email, full_name'),
  ])

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name || p.email]))
  const failed = (events ?? []).filter((e) => e.status === 'failed').length

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold tracking-tight">Activity</h1>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold">Zapier events</h2>
          <p className="mt-1 text-sm text-muted">
            New paid members sent from Skool. {failed ? `${failed} failed recently.` : 'No recent failures.'}
          </p>
        </div>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className="label px-5 py-3">When</th>
                <th className="label px-5 py-3">Email</th>
                <th className="label px-5 py-3">Result</th>
                <th className="label px-5 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(events ?? []).map((e) => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap px-5 py-3">{when(e.created_at)}</td>
                  <td className="px-5 py-3">{e.email}</td>
                  <td className={`px-5 py-3 font-semibold ${e.status === 'failed' ? 'text-red-700' : ''}`}>
                    {e.status === 'processed' ? 'Processed' : e.status === 'failed' ? 'Failed' : 'Received'}
                  </td>
                  <td className="px-5 py-3 text-muted">{e.error}</td>
                </tr>
              ))}
              {!events?.length ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-muted">No events yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">Admin changes</h2>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className="label px-5 py-3">When</th>
                <th className="label px-5 py-3">Who</th>
                <th className="label px-5 py-3">Action</th>
                <th className="label px-5 py-3">Member</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(audit ?? []).map((a) => (
                <tr key={a.id}>
                  <td className="whitespace-nowrap px-5 py-3">{when(a.created_at)}</td>
                  <td className="px-5 py-3">{a.actor_id ? nameById.get(a.actor_id) : 'Zapier'}</td>
                  <td className="px-5 py-3">{a.action}</td>
                  <td className="px-5 py-3">{a.target_user_id ? nameById.get(a.target_user_id) : null}</td>
                </tr>
              ))}
              {!audit?.length ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-muted">No changes yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
