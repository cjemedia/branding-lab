import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Banner from '@/components/Banner'
import ConfirmSubmit from '@/components/ConfirmSubmit'
import { deleteQuestion, saveQuestion } from '../../../actions'
import { createServiceClient } from '@/lib/supabase/service'
import { experimentCode } from '@/lib/types'

interface Question {
  id: string
  prompt: string
  options: string[]
  correct_index: number
  explanation: string | null
  sort_order: number
}

export default async function QuestionsPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { saved?: string; error?: string }
}) {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound()
  const supabase = createServiceClient()
  const [{ data: experiment }, { data: questions }] = await Promise.all([
    supabase.from('experiments').select('id, number, title').eq('id', params.id).maybeSingle(),
    supabase.from('knowledge_check_questions').select('*').eq('experiment_id', params.id).order('sort_order'),
  ])
  if (!experiment) notFound()

  return (
    <div className="space-y-8">
      <Link href="/admin/experiments" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Experiments
      </Link>
      <div>
        <p className="text-[11px] font-semibold tracking-label text-tiffany-dark">EXPERIMENT {experimentCode(experiment.number)}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{experiment.title}: knowledge check</h1>
        <p className="mt-1 text-sm text-muted">Students must answer every question correctly to unlock. Two or three questions work best.</p>
      </div>

      {searchParams.saved ? <Banner tone="success">Saved.</Banner> : null}
      {searchParams.error ? <Banner tone="error">{searchParams.error}</Banner> : null}

      {((questions ?? []) as Question[]).map((q, i) => (
        <div key={q.id} className="card p-6">
          <p className="label">Question {i + 1}</p>
          <QuestionForm experimentId={experiment.id} question={q} />
          <form action={deleteQuestion} className="mt-3">
            <input type="hidden" name="experimentId" value={experiment.id} />
            <input type="hidden" name="questionId" value={q.id} />
            <ConfirmSubmit label="Delete question" message="Delete this question?" className="text-sm font-semibold text-red-700 hover:underline" />
          </form>
        </div>
      ))}

      <div className="card p-6">
        <p className="label">Add a question</p>
        <QuestionForm experimentId={experiment.id} />
      </div>
    </div>
  )
}

function QuestionForm({ experimentId, question }: { experimentId: string; question?: Question }) {
  const options = question?.options ?? []
  return (
    <form action={saveQuestion} className="mt-4 space-y-4">
      <input type="hidden" name="experimentId" value={experimentId} />
      {question ? <input type="hidden" name="questionId" value={question.id} /> : null}
      <label className="block">
        <span className="label">Question</span>
        <input name="prompt" required defaultValue={question?.prompt ?? ''} className="input mt-2" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4].map((n) => (
          <label key={n} className="block">
            <span className="label">Option {n}</span>
            <input name={`option${n}`} defaultValue={options[n - 1] ?? ''} required={n <= 2} className="input mt-2" />
          </label>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-[200px_1fr_120px]">
        <label className="block">
          <span className="label">Correct option</span>
          <select name="correct" defaultValue={String((question?.correct_index ?? 0) + 1)} className="input mt-2">
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                Option {n}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Shown when answered wrong</span>
          <input name="explanation" defaultValue={question?.explanation ?? ''} className="input mt-2" />
        </label>
        <label className="block">
          <span className="label">Order</span>
          <input name="sort_order" type="number" defaultValue={question?.sort_order ?? 0} className="input mt-2" />
        </label>
      </div>
      <button type="submit" className="btn-primary">{question ? 'Save' : 'Add Question'}</button>
    </form>
  )
}
