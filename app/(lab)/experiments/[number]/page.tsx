import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, Lock } from 'lucide-react'
import KnowledgeCheck from '@/components/experiments/KnowledgeCheck'
import { experimentTools } from '@/components/experiments/registry'
import { requireMember } from '@/lib/session'
import { checkExperimentAccess } from '@/lib/access'
import { getContent } from '@/lib/content'
import { getExperimentByNumber, getPublicQuestions, parseExperimentNumber } from '@/lib/experiments'
import { createServiceClient } from '@/lib/supabase/service'
import { experimentCode } from '@/lib/types'

export default async function ExperimentPage({ params }: { params: { number: string } }) {
  const n = parseExperimentNumber(params.number)
  if (!n) notFound()

  const session = await requireMember(`/experiments/${params.number}`)
  const experiment = await getExperimentByNumber(n)
  if (!experiment) notFound()

  const [access, content] = await Promise.all([
    checkExperimentAccess(experiment.id, session.userId),
    getContent([
      'locked.prerequisite',
      'locked.not_open',
      'locked.inactive',
      'locked.tier',
      'knowledge_check.not_set_up',
      'knowledge_check.title',
      'knowledge_check.intro',
      'knowledge_check.failed',
    ]),
  ])

  const code = experimentCode(experiment.number)
  const header = (
    <div className="card-dark p-8 sm:p-10">
      <p className="text-[11px] font-semibold tracking-label text-tiffany">THE BRANDING LAB. | EXPERIMENT {code}</p>
      <h1 className="mt-3 text-3xl font-bold uppercase tracking-tight sm:text-4xl">{experiment.title}</h1>
      {experiment.description ? <p className="mt-3 text-white/80">{experiment.description}</p> : null}
      {experiment.estimated_time ? (
        <p className="mt-6 border-t border-white/10 pt-4 text-sm text-white/60">{experiment.estimated_time}</p>
      ) : null}
    </div>
  )

  // Open: show the tool
  if (access.allowed) {
    const Tool = experimentTools[experiment.slug]
    return (
      <div className="space-y-8">
        <BackLink />
        {Tool ? await Tool({ experimentId: experiment.id, userId: session.userId }) : <>{header}<Notice text={content['locked.not_open']} /></>}
      </div>
    )
  }

  // Ready to unlock: knowledge check
  if (access.reason === 'ready_to_unlock' && experiment.is_open) {
    const questions = experiment.requires_knowledge_check ? await getPublicQuestions(experiment.id) : []
    const notSetUp = experiment.requires_knowledge_check && questions.length === 0

    return (
      <div className="space-y-8">
        <BackLink />
        {header}
        {notSetUp ? (
          <Notice text={content['knowledge_check.not_set_up']} />
        ) : (
          <KnowledgeCheck
            experimentId={experiment.id}
            questions={questions}
            requiresCheck={experiment.requires_knowledge_check}
            title={content['knowledge_check.title']}
            intro={content['knowledge_check.intro']}
            failedMessage={content['knowledge_check.failed']}
          />
        )}
        {experiment.lesson_url ? (
          <a href={experiment.lesson_url} target="_blank" rel="noopener noreferrer" className="btn-ghost">
            Review the Lesson
            <ArrowRight className="h-4 w-4" />
          </a>
        ) : null}
      </div>
    )
  }

  // Locked for another reason
  let message = content['locked.not_open']
  let previous: { code: string; title: string } | null = null

  if (access.reason === 'prerequisite' && experiment.prerequisite_id) {
    message = content['locked.prerequisite']
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('experiments')
      .select('number, title')
      .eq('id', experiment.prerequisite_id)
      .maybeSingle()
    if (data) previous = { code: experimentCode(data.number), title: data.title }
  } else if (access.reason === 'tier') {
    message = content['locked.tier']
  } else if (access.reason === 'inactive_membership') {
    message = content['locked.inactive']
  }

  return (
    <div className="space-y-8">
      <BackLink />
      {header}
      <div className="card flex flex-col gap-6 p-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-3 text-base font-medium">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
          {message}
        </p>
        {previous ? (
          <Link href={`/experiments/${previous.code}`} className="btn-primary shrink-0">
            Go to {previous.code} | {previous.title}
          </Link>
        ) : null}
      </div>
    </div>
  )
}

function BackLink() {
  return (
    <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink">
      <ArrowLeft className="h-4 w-4" /> Back to dashboard
    </Link>
  )
}

function Notice({ text }: { text: string }) {
  return <div className="card p-8 text-base font-medium">{text}</div>
}
