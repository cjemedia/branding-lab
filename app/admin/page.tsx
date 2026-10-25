import Link from 'next/link'
import { Download } from 'lucide-react'
import Banner from '@/components/Banner'
import { addMember } from './actions'
import { createServiceClient } from '@/lib/supabase/service'
import { STATUS_LABEL, TIER_LABEL, type MembershipStatus, type Tier } from '@/lib/types'

const FILTERS: (MembershipStatus | 'all')[] = ['all', 'active', 'pending', 'suspended', 'cancelled', 'expired']

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string; error?: string }
}) {
  const supabase = createServiceClient()
  const filter = FILTERS.includes(searchParams.status as MembershipStatus) ? searchParams.status : 'all'
  const q = (searchParams.q ?? '').trim().toLowerCase()

  const [{ data: profiles }, { data: memberships }, { data: progress }, { count: total }] = await Promise.all([
    supabase.from('profiles').select('id, email, full_name, brand_name, role, created_at').order('created_at', { ascending: false }),
    supabase.from('memberships').select('user_id, tier, status, source, activated_at'),
    supabase.from('experiment_progress').select('user_id, status'),
    supabase.from('experiments').select('id', { count: 'exact', head: true }).eq('is_published', true),
  ])

  const membershipByUser = new Map((memberships ?? []).map((m) => [m.user_id, m]))
  const completedByUser = new Map<string, number>()
  for (const p of progress ?? []) {
    if (p.status === 'completed') completedByUser.set(p.user_id, (completedByUser.get(p.user_id) ?? 0) + 1)
  }

  const rows = (profiles ?? [])
    .map((p) => ({ ...p, membership: membershipByUser.get(p.id) }))
    .filter((p) => filter === 'all' || p.membership?.status === filter)
    .filter((p) => !q || p.email.toLowerCase().includes(q) || (p.full_name ?? '').toLowerCase().includes(q))

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Members</h1>
          <p className="mt-1 text-sm text-muted">{rows.length} shown</p>
        </div>
        <a href="/admin/export" className="btn-ghost">
          <Download className="h-4 w-4" /> Export CSV
        </a>
      </div>

      {searchParams.error ? <Banner tone="error">{searchParams.error}</Banner> : null}

      <section className="card p-6">
        <h2 className="text-lg font-bold">Add a member</h2>
        <p className="mt-1 text-sm text-muted">
          Gives them active access and emails them a link. Use this if Zapier missed someone.
        </p>
        <form action={addMember} className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
          <input name="email" type="email" required placeholder="Email" className="input" aria-label="Email" />
          <input name="name" placeholder="Name" className="input" aria-label="Name" />
          <select name="tier" className="input" aria-label="Tier" defaultValue="branding_lab">
            <option value="branding_lab">The Branding Lab</option>
            <option value="agency_lab">The Agency Lab</option>
          </select>
          <button type="submit" className="btn-primary">Add</button>
        </form>
      </section>

      <section className="space-y-4">
        <form className="flex flex-wrap gap-3">
          <input name="q" defaultValue={searchParams.q} placeholder="Search name or email" className="input max-w-xs" aria-label="Search" />
          <select name="status" defaultValue={filter} className="input max-w-[200px]" aria-label="Status">
            {FILTERS.map((f) => (
              <option key={f} value={f}>
                {f === 'all' ? 'All statuses' : STATUS_LABEL[f]}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-ghost">Filter</button>
        </form>

        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className="label px-5 py-3">Member</th>
                <th className="label px-5 py-3">Tier</th>
                <th className="label px-5 py-3">Status</th>
                <th className="label px-5 py-3">Progress</th>
                <th className="label px-5 py-3">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-cream/50">
                  <td className="px-5 py-4">
                    <Link href={`/admin/members/${r.id}`} className="font-semibold hover:underline">
                      {r.full_name || r.email}
                    </Link>
                    {r.full_name ? <p className="text-muted">{r.email}</p> : null}
                    {r.role === 'admin' ? <p className="text-xs font-semibold text-tiffany-dark">Admin</p> : null}
                  </td>
                  <td className="px-5 py-4">{r.membership ? TIER_LABEL[r.membership.tier as Tier] : null}</td>
                  <td className="px-5 py-4">{r.membership ? STATUS_LABEL[r.membership.status as MembershipStatus] : null}</td>
                  <td className="px-5 py-4">
                    {completedByUser.get(r.id) ?? 0} of {total ?? 0}
                  </td>
                  <td className="px-5 py-4 capitalize text-muted">{r.membership?.source}</td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted">
                    No members match.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
