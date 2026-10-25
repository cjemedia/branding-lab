import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import ExperimentCard from '@/components/lab/ExperimentCard'
import { requireMember } from '@/lib/session'
import { getContent } from '@/lib/content'
import { loadExperimentCards } from '@/lib/dashboard'
import { TIER_LABEL, experimentCode } from '@/lib/types'

export default async function DashboardPage() {
  const session = await requireMember('/dashboard')
  const [content, cards] = await Promise.all([
    getContent(['dashboard.title', 'dashboard.welcome', 'dashboard.continue_button', 'dashboard.blueprint_title']),
    loadExperimentCards(session.userId),
  ])

  const completed = cards.filter((c) => c.status === 'completed').length
  const total = cards.length
  const percent = total ? Math.round((completed / total) * 100) : 0
  const current =
    cards.find((c) => c.status === 'in_progress') ??
    cards.find((c) => c.status === 'available') ??
    cards.find((c) => c.status === 'ready_to_unlock')

  const name = session.profile.full_name
  const brand = session.profile.brand_name
  const tier = session.membership ? TIER_LABEL[session.membership.tier] : null

  return (
    <div className="space-y-10">
      <section className="card-dark overflow-hidden p-8 sm:p-10">
        <p className="text-[11px] font-semibold tracking-label text-tiffany">{content['dashboard.title']}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{content['dashboard.welcome']}</h1>

        <dl className="mt-8 grid gap-6 border-t border-white/10 pt-6 sm:grid-cols-3">
          {name ? <Detail label="NAME" value={name} /> : null}
          {brand ? <Detail label="BRAND" value={brand} /> : null}
          {tier ? <Detail label="MEMBERSHIP" value={tier} /> : null}
        </dl>

        <div className="mt-8">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">Overall progress</span>
            <span className="font-semibold">
              {completed} of {total} complete
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-tiffany" style={{ width: `${percent}%` }} />
          </div>
        </div>

        {current ? (
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-white/70">
              Current: <span className="font-semibold text-white">{experimentCode(current.experiment.number)} | {current.experiment.title}</span>
            </p>
            <Link href={`/experiments/${experimentCode(current.experiment.number)}`} className="btn-accent">
              {content['dashboard.continue_button']}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : null}
      </section>

      <section>
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold">Your experiments</h2>
          <Link href="/blueprint" className="text-sm font-semibold underline-offset-4 hover:underline">
            {content['dashboard.blueprint_title']}
          </Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <ExperimentCard key={card.experiment.id} card={card} />
          ))}
        </div>
      </section>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold tracking-label text-tiffany">{label}</dt>
      <dd className="mt-1 text-base font-medium">{value}</dd>
    </div>
  )
}
