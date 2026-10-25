import Link from 'next/link'
import { ArrowRight, Check, Lock, Clock } from 'lucide-react'
import type { ExperimentCardData } from '@/lib/dashboard'
import { experimentCode } from '@/lib/types'

const STATUS_TEXT: Record<ExperimentCardData['status'], string> = {
  locked: 'Locked',
  ready_to_unlock: 'Ready to Unlock',
  available: 'Available',
  in_progress: 'In Progress',
  completed: 'Completed',
}

const ACTION_TEXT: Record<ExperimentCardData['status'], string> = {
  locked: 'View',
  ready_to_unlock: 'Unlock',
  available: 'Start',
  in_progress: 'Continue',
  completed: 'Review',
}

export default function ExperimentCard({ card }: { card: ExperimentCardData }) {
  const { experiment, status } = card
  const locked = status === 'locked'
  const comingSoon = locked && !experiment.is_open && card.reason !== 'prerequisite'

  return (
    <Link
      href={`/experiments/${experimentCode(experiment.number)}`}
      className={`card group flex h-full flex-col p-6 transition hover:border-ink ${locked ? 'bg-white/60' : ''}`}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-[11px] font-semibold tracking-label text-tiffany-dark">
          EXPERIMENT {experimentCode(experiment.number)}
        </p>
        <StatusPill status={status} comingSoon={comingSoon} />
      </div>

      <h3 className={`mt-4 text-lg font-bold leading-snug ${locked ? 'text-ink/50' : ''}`}>{experiment.title}</h3>
      {experiment.subtitle ? (
        <p className={`mt-1 text-sm font-medium ${locked ? 'text-muted/70' : 'text-muted'}`}>{experiment.subtitle}</p>
      ) : null}
      {experiment.description ? (
        <p className={`mt-4 text-sm leading-relaxed ${locked ? 'text-ink/40' : 'text-ink/80'}`}>
          {experiment.description}
        </p>
      ) : null}

      <div className="mt-auto flex items-center justify-between pt-6 text-sm">
        {experiment.estimated_time ? (
          <span className="flex items-center gap-1.5 text-muted">
            <Clock className="h-4 w-4" />
            {experiment.estimated_time}
          </span>
        ) : (
          <span />
        )}
        <span className={`flex items-center gap-1 font-semibold ${locked ? 'text-muted' : 'text-ink'}`}>
          {ACTION_TEXT[status]}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}

function StatusPill({ status, comingSoon }: { status: ExperimentCardData['status']; comingSoon: boolean }) {
  const base = 'inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold'
  if (status === 'completed') {
    return (
      <span className={`${base} bg-tiffany-soft text-ink`}>
        <Check className="h-3.5 w-3.5" /> {STATUS_TEXT.completed}
      </span>
    )
  }
  if (status === 'locked') {
    return (
      <span className={`${base} bg-cream text-muted`}>
        <Lock className="h-3.5 w-3.5" /> {comingSoon ? 'Coming Soon' : STATUS_TEXT.locked}
      </span>
    )
  }
  if (status === 'ready_to_unlock') {
    return <span className={`${base} bg-tiffany text-ink`}>{STATUS_TEXT.ready_to_unlock}</span>
  }
  return <span className={`${base} bg-ink text-white`}>{STATUS_TEXT[status]}</span>
}
