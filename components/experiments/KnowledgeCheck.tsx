'use client'

import { useState } from 'react'
import { ArrowRight, Check, X } from 'lucide-react'

interface Question {
  id: string
  prompt: string
  options: string[]
}

interface Props {
  experimentId: string
  questions: Question[]
  requiresCheck: boolean
  title: string
  intro: string
  failedMessage: string
}

export default function KnowledgeCheck({ experimentId, questions, requiresCheck, title, intro, failedMessage }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [results, setResults] = useState<Record<string, { correct: boolean; explanation: string | null }>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const allAnswered = !requiresCheck || questions.every((q) => answers[q.id] !== undefined)

  async function submit() {
    setLoading(true)
    setError('')
    setResults({})

    const response = await fetch(`/api/experiments/${experimentId}/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    })
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    if (data.passed) {
      window.location.reload()
      return
    }

    const map: Record<string, { correct: boolean; explanation: string | null }> = {}
    for (const r of data.results ?? []) map[r.id] = { correct: r.correct, explanation: r.explanation }
    setResults(map)
    setError(failedMessage)
    setLoading(false)
  }

  if (!requiresCheck) {
    return (
      <div className="card p-8">
        <button onClick={submit} disabled={loading} className="btn-primary">
          {loading ? 'Opening...' : 'Start Experiment'}
          <ArrowRight className="h-4 w-4" />
        </button>
        {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}
      </div>
    )
  }

  return (
    <div className="card p-6 sm:p-8">
      {title ? <h2 className="text-xl font-bold">{title}</h2> : null}
      {intro ? <p className="mt-2 text-sm text-muted">{intro}</p> : null}

      <ol className="mt-8 space-y-8">
        {questions.map((q, qi) => {
          const result = results[q.id]
          return (
            <li key={q.id}>
              <fieldset>
                <legend className="text-base font-semibold">
                  <span className="mr-2 text-tiffany-dark">{qi + 1}.</span>
                  {q.prompt}
                </legend>
                <div className="mt-4 grid gap-3">
                  {q.options.map((option, oi) => {
                    const selected = answers[q.id] === oi
                    return (
                      <label
                        key={oi}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                          selected ? 'border-ink bg-tiffany-soft' : 'border-line bg-white hover:border-ink/40'
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          className="sr-only"
                          checked={selected}
                          onChange={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                        />
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            selected ? 'border-ink bg-ink' : 'border-line'
                          }`}
                          aria-hidden
                        >
                          {selected ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
                        </span>
                        {option}
                      </label>
                    )
                  })}
                </div>
                {result ? (
                  <p className={`mt-3 flex items-start gap-2 text-sm ${result.correct ? 'text-ink' : 'text-red-700'}`}>
                    {result.correct ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : <X className="mt-0.5 h-4 w-4 shrink-0" />}
                    <span>{result.correct ? 'Correct.' : result.explanation ?? 'Not quite.'}</span>
                  </p>
                ) : null}
              </fieldset>
            </li>
          )
        })}
      </ol>

      {error ? (
        <p role="alert" className="mt-8 rounded-xl bg-cream px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}

      <button onClick={submit} disabled={!allAnswered || loading} className="btn-primary mt-8">
        {loading ? 'Checking...' : 'Unlock Experiment'}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}
