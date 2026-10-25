import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Banner from '@/components/Banner'
import ConfirmSubmit from '@/components/ConfirmSubmit'
import { createServiceClient } from '@/lib/supabase/service'
import { manualUnlock, reopenExperiment, resendAccessEmail, resetExperiment, setAdminRole, updateMembership } from '../../actions'
import { STATUS_LABEL, experimentCode, type MembershipStatus } from '@/lib/types'

const STATUSES: MembershipStatus[] = ['active', 'pending', 'suspended', 'cancelled', 'expired']
const PROGRESS_LABEL: Record<string, string> = { unlocked: 'Unlocked', in_progress: 'In Progress', completed: 'Completed' }

export default async function MemberPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { added?: string; sent?: string; error?: string }
}) {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound()
  const supabase = createServiceClient()

  const [{ data: profile }, { data: membership }, { data: experiments }, { data: progress }, { data: attempts }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', params.id).maybeSingle(),
      supabase.from('memberships').select('*').eq('user_id', params.id).maybeSingle(),
      supabase.from('experiments').select('id, number, title').order('sort_order'),
      supabase.from('experiment_progress').select('*').eq('user_id', params.id),
      supabase.from('knowledge_check_attempts').select('experiment_id, passed').eq('user_id', params.id),
    ])

  if (!profile) notFound()

  const progressByExperiment = new Map((progress ?? []).map((p) => [p.experiment_id, p]))
  const attemptCount = new Map<string, number>()
  for (const a of attempts ?? []) attemptCount.set(a.experiment_id, (attemptCount.get(a.experiment_id) ?? 0) + 1)

  return (
    <div className="space-y-8">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> All members
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">{profile.full_name || profile.email}</h1>
        <p className="mt-1 text-sm text-muted">{profile.email}</p>
      </div>

      {searchParams.added ? <Banner tone="success">Member added and access email sent.</Banner> : null}
      {searchParams.sent ? <Banner tone="success">Access email sent.</Banner> : null}
      {searchParams.error ? <Banner tone="error">{searchParams.error}</Banner> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="text-lg font-bold">Membership</h2>
          <form action={updateMembership} className="mt-5 space-y-4">
            <input type="hidden" name="userId" value={profile.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="label">Status</span>
                <select name="status" defaultValue={membership?.status ?? 'pending'} className="input mt-2">
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="label">Tier</span>
                <select name="tier" defaultValue={membership?.tier ?? 'branding_lab'} className="input mt-2">
                  <option value="branding_lab">The Branding Lab</option>
                  <option value="agency_lab">The Agency Lab</option>
                </select>
              </label>
            </div>
            <label className="block">
              <span className="label">Notes</span>
              <textarea name="notes" defaultValue={membership?.notes ?? ''} rows={2} className="input mt-2" />
            </label>
            <button type="submit" className="btn-primary">Save Membership</button>
          </form>
          <form action={resendAccessEmail} className="mt-4">
            <input type="hidden" name="userId" value={profile.id} />
            <button type="submit" className="btn-ghost">Resend Access Email</button>
          </form>
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-bold">Role</h2>
          <p className="mt-1 text-sm text-muted">Admins can manage members, experiments, and content.</p>
          <form action={setAdminRole} className="mt-5 flex flex-wrap items-center gap-3">
            <input type="hidden" name="userId" value={profile.id} />
            <select name="role" defaultValue={profile.role} className="input max-w-[200px]" aria-label="Role">
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" className="btn-ghost">Save Role</button>
          </form>
        </section>
      </div>

      <section className="card overflow-x-auto">
        <div className="px-6 pt-6">
          <h2 className="text-lg font-bold">Experiments</h2>
          <p className="mt-1 text-sm text-muted">Manual unlocks, reopens, and resets are recorded in the activity log.</p>
        </div>
        <table className="mt-4 w-full min-w-[640px] text-left text-sm">
          <tbody className="divide-y divide-line border-t border-line">
            {(experiments ?? []).map((e) => {
              const p = progressByExperiment.get(e.id)
              return (
                <tr key={e.id}>
                  <td className="px-6 py-4">
                    <p className="text-[11px] font-semibold tracking-label text-tiffany-dark">{experimentCode(e.number)}</p>
                    <p className="font-semibold">{e.title}</p>
                  </td>
                  <td className="px-6 py-4">
                    {p ? PROGRESS_LABEL[p.status] : 'Not unlocked'}
                    {attemptCount.get(e.id) ? (
                      <p className="text-xs text-muted">{attemptCount.get(e.id)} knowledge check attempts</p>
                    ) : null}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      {!p ? (
                        <ActionButton action={manualUnlock} userId={profile.id} experimentId={e.id} label="Unlock" />
                      ) : null}
                      {p?.status === 'completed' ? (
                        <ActionButton action={reopenExperiment} userId={profile.id} experimentId={e.id} label="Reopen" />
                      ) : null}
                      {p ? (
                        <form action={resetExperiment}>
                          <input type="hidden" name="userId" value={profile.id} />
                          <input type="hidden" name="experimentId" value={e.id} />
                          <ConfirmSubmit
                            label="Reset"
                            message={`Reset ${e.title} for this member? Their answers for it will be erased and it will lock again.`}
                            className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 hover:border-red-700"
                          />
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </div>
  )
}

function ActionButton({
  action,
  userId,
  experimentId,
  label,
}: {
  action: (formData: FormData) => Promise<void>
  userId: string
  experimentId: string
  label: string
}) {
  return (
    <form action={action}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="experimentId" value={experimentId} />
      <button type="submit" className="rounded-full border border-line px-4 py-2 text-xs font-semibold hover:border-ink">
        {label}
      </button>
    </form>
  )
}
