'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { BrandsScreen, GroupChatScreen, ImpressionScreen, IntroScreen, MixScreen, RealityScreen, RoomScreen } from './screens'
import Results from './Results'
import { COPY } from '@/lib/experiments/room-test/config'
import { emptyAnswers, missingForGeneration, type RoomTestAnswers, type RoomTestResult } from '@/lib/experiments/room-test/schema'

// Screens: 0 intro, 1 brands, 2 room, 3 group chat, 4 impression, 5 reality, 6 mix, 7 reveal + save
const LAST_QUESTION_STEP = 6
const REVEAL_STEP = 7
const QUESTION_STEPS = 6

export interface RoomTestInitial {
  experimentId: string
  answers: RoomTestAnswers
  step: number
  result: RoomTestResult | null
  saved: boolean
  needsRefresh: boolean
  brandName: string
  nextExperimentHref: string | null
}

function stepErrors(step: number, a: RoomTestAnswers): string[] {
  switch (step) {
    case 1: {
      const brands = [0, 1, 2].map((i) => a.brands[i])
      const filled = brands.filter((b) => b && b.name.trim() && b.noticed.trim() && b.interested.trim() && b.miss.trim())
      return filled.length < 3 ? ['Name three brands and answer all three questions for each.'] : []
    }
    case 2:
      if (!a.primaryPersonality) return ['Choose a primary personality.']
      if (!a.stage) return ['Tell us if this describes your brand today.']
      return []
    case 3:
      if (a.soundsLike.length === 0) return ['Choose at least one style that sounds like your brand.']
      if (!a.wouldFeelFake) return ['Choose the style that would feel fake.']
      return []
    case 4:
      if (a.feelings.length === 0) return ['Choose at least one feeling.']
      if (!a.neverSay.trim()) return ["Share the one thing you never want said about your brand."]
      return []
    case 5:
      if (a.tenSeconds.length < 2) return ['Choose two things people should understand in 10 seconds.']
      if (!a.challenge) return ['Choose the hardest part of showing up as your brand.']
      if (!a.chooseBecause.trim()) return ['Finish the sentence about why people should choose your brand.']
      return []
    case 6:
      return Object.keys(a.sliders).length < 5 ? ['Rate your brand on all five sliders.'] : []
    default:
      return []
  }
}

export default function RoomTestClient({ initial }: { initial: RoomTestInitial }) {
  const [answers, setAnswers] = useState<RoomTestAnswers>({ ...emptyAnswers, ...initial.answers })
  const [step, setStep] = useState(initial.result ? REVEAL_STEP : Math.min(initial.step, LAST_QUESTION_STEP))
  const [showReflection, setShowReflection] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [result, setResult] = useState<RoomTestResult | null>(initial.result)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [answersChangedSinceResult, setAnswersChangedSinceResult] = useState(false)

  const firstRender = useRef(true)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const topRef = useRef<HTMLDivElement>(null)

  const save = useCallback(
    async (nextAnswers: RoomTestAnswers, nextStep: number) => {
      setSaveState('saving')
      try {
        const res = await fetch(`/api/experiments/${initial.experimentId}/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: nextAnswers, currentStep: Math.min(nextStep, LAST_QUESTION_STEP) }),
        })
        setSaveState(res.ok ? 'saved' : 'error')
      } catch {
        setSaveState('error')
      }
    },
    [initial.experimentId]
  )

  // Autosave shortly after typing stops, and right away when the screen changes
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(answers, step), 900)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [answers, step, save])

  function update(patch: Partial<RoomTestAnswers>) {
    setAnswers((a) => ({ ...a, ...patch }))
    setErrors([])
    if (result) setAnswersChangedSinceResult(true)
  }

  function goTo(next: number) {
    setErrors([])
    setStep(next)
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  async function generate(kind: 'result' | 'regenerate') {
    const missing = missingForGeneration(answers)
    if (missing.length) {
      setGenerateError(`A few answers are still missing: ${missing.join(', ')}.`)
      return
    }
    setGenerating(true)
    setGenerateError('')
    goTo(REVEAL_STEP)

    try {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      await save(answers, LAST_QUESTION_STEP)
      const res = await fetch(`/api/experiments/${initial.experimentId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong while building your results.')
      setResult(data.result)
      setAnswersChangedSinceResult(false)
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : 'Something went wrong while building your results.')
    } finally {
      setGenerating(false)
    }
  }

  function next() {
    const problems = stepErrors(step, answers)
    if (problems.length) {
      setErrors(problems)
      return
    }
    if (step === 1 && !showReflection) {
      setShowReflection(true)
      return
    }
    if (step === 1 && showReflection) setShowReflection(false)
    if (step === LAST_QUESTION_STEP) {
      if (result && !answersChangedSinceResult) {
        goTo(REVEAL_STEP)
      } else {
        generate(result ? 'regenerate' : 'result')
      }
      return
    }
    goTo(step + 1)
  }

  function back() {
    if (step === 1 && showReflection) {
      setShowReflection(false)
      return
    }
    goTo(Math.max(0, step - 1))
  }

  const progress = step === 0 ? 0 : Math.min(step, QUESTION_STEPS) / QUESTION_STEPS

  return (
    <div ref={topRef} className="scroll-mt-6 space-y-8">
      {step > 0 ? (
        <div className="flex items-center gap-4">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-tiffany transition-all duration-500" style={{ width: `${progress * 100}%` }} />
          </div>
          <span className="w-28 text-right text-xs font-medium text-muted" aria-live="polite">
            {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved' : saveState === 'error' ? 'Not saved' : ''}
          </span>
        </div>
      ) : null}

      {step === 0 ? <IntroScreen onStart={() => goTo(1)} /> : null}
      {step === 1 ? <BrandsScreen answers={answers} update={update} showReflection={showReflection} /> : null}
      {step === 2 ? <RoomScreen answers={answers} update={update} /> : null}
      {step === 3 ? <GroupChatScreen answers={answers} update={update} /> : null}
      {step === 4 ? <ImpressionScreen answers={answers} update={update} /> : null}
      {step === 5 ? <RealityScreen answers={answers} update={update} /> : null}
      {step === 6 ? <MixScreen answers={answers} update={update} /> : null}

      {step === REVEAL_STEP ? (
        generating ? (
          <GeneratingState />
        ) : generateError && !result ? (
          <div className="card space-y-5 p-8">
            <p className="text-base font-medium">{generateError}</p>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => generate('result')} className="btn-primary">
                Try Again
              </button>
              <button type="button" onClick={() => goTo(1)} className="btn-ghost">
                Review My Answers
              </button>
            </div>
          </div>
        ) : result ? (
          <Results
            experimentId={initial.experimentId}
            answers={answers}
            result={result}
            onResultChange={setResult}
            initialBrandName={initial.brandName}
            saved={initial.saved}
            needsRefresh={initial.needsRefresh}
            answersChanged={answersChangedSinceResult}
            generateError={generateError}
            onRegenerate={() => generate('regenerate')}
            onEditAnswers={() => goTo(1)}
            nextExperimentHref={initial.nextExperimentHref}
          />
        ) : (
          <div className="card p-8">
            <button type="button" onClick={() => generate('result')} className="btn-primary">
              Reveal My Brand
            </button>
          </div>
        )
      ) : null}

      {step > 0 && step < REVEAL_STEP ? (
        <div className="space-y-4">
          {errors.length ? (
            <p role="alert" className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-red-800">
              {errors[0]}
            </p>
          ) : null}
          <div className="flex items-center justify-between gap-4">
            <button type="button" onClick={back} className="btn-ghost">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button type="button" onClick={next} className="btn-primary">
              {step === LAST_QUESTION_STEP ? (result && !answersChangedSinceResult ? 'See My Results' : 'Reveal My Brand') : 'Next'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function GeneratingState() {
  return (
    <div className="card-dark flex flex-col items-center justify-center gap-6 px-8 py-20 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-tiffany" aria-hidden />
      <div>
        <p className="text-2xl font-bold">{COPY.reveal.headline}</p>
        <p className="mt-2 text-white/70" aria-live="polite">
          Putting your Brand Identity Snapshot together...
        </p>
      </div>
    </div>
  )
}
