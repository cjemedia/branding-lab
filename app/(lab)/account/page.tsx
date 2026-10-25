import { redirect } from 'next/navigation'
import { getLabSession } from '@/lib/session'
import { getContent } from '@/lib/content'
import { STATUS_LABEL, TIER_LABEL } from '@/lib/types'

export default async function AccountPage() {
  const session = await getLabSession()
  if (!session) redirect('/login?next=/account')
  if (!session.profile) redirect('/no-access')

  const content = await getContent(['locked.inactive'])
  const membership = session.membership
  const active = membership?.status === 'active'

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Your account</h1>

      {!active && session.profile.role !== 'admin' ? (
        <div className="card-dark p-8">
          <p className="text-lg font-semibold">{content['locked.inactive']}</p>
          <p className="mt-3 text-sm text-white/70">
            Your saved work is kept. Once your membership is active again, everything will be right where you left it.
          </p>
        </div>
      ) : null}

      <dl className="card divide-y divide-line">
        <Row label="Email" value={session.email} />
        {session.profile.full_name ? <Row label="Name" value={session.profile.full_name} /> : null}
        {membership ? <Row label="Membership" value={TIER_LABEL[membership.tier]} /> : null}
        {membership ? <Row label="Status" value={STATUS_LABEL[membership.status]} /> : null}
      </dl>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <dt className="label">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  )
}
