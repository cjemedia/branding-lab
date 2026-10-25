'use client'

import { Clock } from 'lucide-react'
import { ChoiceCard, Chip, Question, ScreenHeader, TextArea, toggleInList } from '@/components/experiments/shared/ui'
import {
  CHALLENGES,
  COMMUNICATION_STYLES,
  COPY,
  FEELINGS,
  INSPIRATION_TAGS,
  PERSONALITIES,
  SLIDERS,
  STAGES,
  TEN_SECONDS,
} from '@/lib/experiments/room-test/config'
import type { RoomTestAnswers } from '@/lib/experiments/room-test/schema'

interface ScreenProps {
  answers: RoomTestAnswers
  update: (patch: Partial<RoomTestAnswers>) => void
}

// ---------------------------------------------------------- Screen 01

export function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="card-dark p-8 sm:p-12">
      <p className="text-[11px] font-semibold tracking-label text-tiffany">THE BRANDING LAB. | EXPERIMENT 001</p>
      <h2 className="mt-4 text-4xl font-bold uppercase leading-tight tracking-tight sm:text-5xl">{COPY.intro.headline}</h2>
      <p className="mt-4 text-xl text-white/80">{COPY.intro.subheadline}</p>
      <div className="mt-8 max-w-2xl space-y-4 text-base leading-relaxed text-white/80">
        {COPY.intro.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      <div className="mt-10 flex flex-col gap-5 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-2 text-sm text-white/60">
          <Clock className="h-4 w-4" /> {COPY.intro.time}
        </span>
        <button type="button" onClick={onStart} className="btn-accent">
          {COPY.intro.button}
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------- Screen 02

export function BrandsScreen({ answers, update, showReflection }: ScreenProps & { showReflection: boolean }) {
  const brands = [0, 1, 2].map(
    (i) => answers.brands[i] ?? { name: '', noticed: '', interested: '', miss: '', tags: [] }
  )

  function setBrand(index: number, patch: Partial<(typeof brands)[number]>) {
    const next = brands.map((b, i) => (i === index ? { ...b, ...patch } : b))
    update({ brands: next })
  }

  if (showReflection) {
    return (
      <div className="card-dark p-8 sm:p-12">
        <p className="max-w-2xl text-2xl font-semibold leading-snug sm:text-3xl">{COPY.brands.reflection}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <ScreenHeader headline={COPY.brands.headline} subheadline={COPY.brands.subheadline} />
      {brands.map((brand, i) => (
        <div key={i} className="card space-y-5 p-6 sm:p-8">
          <p className="text-[11px] font-semibold tracking-label text-tiffany-dark">BRAND {i + 1} OF 3</p>
          <label className="block">
            <span className="text-sm font-semibold">{COPY.brands.questions.name}</span>
            <input
              value={brand.name}
              onChange={(e) => setBrand(i, { name: e.target.value })}
              maxLength={120}
              className="input mt-2"
            />
          </label>
          <TextArea label={COPY.brands.questions.noticed} value={brand.noticed} onChange={(v) => setBrand(i, { noticed: v })} rows={2} />
          <TextArea label={COPY.brands.questions.interested} value={brand.interested} onChange={(v) => setBrand(i, { interested: v })} rows={2} />
          <TextArea label={COPY.brands.questions.miss} value={brand.miss} onChange={(v) => setBrand(i, { miss: v })} rows={2} />
          <div>
            <p className="text-sm font-semibold">
              What stands out? <span className="font-normal text-muted">(optional)</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {INSPIRATION_TAGS.map((tag) => (
                <Chip key={tag} selected={brand.tags.includes(tag)} onClick={() => setBrand(i, { tags: toggleInList(brand.tags, tag, 8) })}>
                  {tag}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------- Screen 03

export function RoomScreen({ answers, update }: ScreenProps) {
  function pick(id: (typeof PERSONALITIES)[number]['id']) {
    if (answers.primaryPersonality === id) {
      update({ primaryPersonality: answers.secondaryPersonality, secondaryPersonality: null })
    } else if (answers.secondaryPersonality === id) {
      update({ secondaryPersonality: null })
    } else if (!answers.primaryPersonality) {
      update({ primaryPersonality: id })
    } else {
      update({ secondaryPersonality: id })
    }
  }

  return (
    <div className="space-y-10">
      <ScreenHeader headline={COPY.room.headline} subheadline={COPY.room.subheadline} />
      <div>
        <Question hint="Tap one for your primary. Tap a second for an optional secondary.">First impression</Question>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PERSONALITIES.map((p) => {
            const isPrimary = answers.primaryPersonality === p.id
            const isSecondary = answers.secondaryPersonality === p.id
            return (
              <ChoiceCard
                key={p.id}
                selected={isPrimary || isSecondary}
                badge={isPrimary ? 'PRIMARY' : isSecondary ? 'SECONDARY' : undefined}
                onClick={() => pick(p.id)}
                title={p.name}
                body={p.description}
              />
            )
          })}
        </div>
      </div>

      {answers.primaryPersonality ? (
        <div>
          <Question>{COPY.room.stageQuestion}</Question>
          <div className="mt-4 flex flex-wrap gap-3">
            {STAGES.map((s) => (
              <Chip key={s.id} selected={answers.stage === s.id} onClick={() => update({ stage: s.id })}>
                {s.label}
              </Chip>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------- Screen 04

export function GroupChatScreen({ answers, update }: ScreenProps) {
  return (
    <div className="space-y-10">
      <ScreenHeader headline={COPY.groupChat.headline} subheadline={COPY.groupChat.subheadline} />
      <p className="text-sm font-medium text-muted">{COPY.groupChat.scenario}</p>

      <div>
        <Question hint="Choose one or two.">{COPY.groupChat.soundsLike}</Question>
        <div className="mt-5 grid gap-3">
          {COMMUNICATION_STYLES.map((s) => (
            <MessageBubble
              key={s.id}
              name={s.name}
              sample={s.sample}
              selected={answers.soundsLike.includes(s.id)}
              disabled={answers.wouldFeelFake === s.id}
              onClick={() => update({ soundsLike: toggleInList(answers.soundsLike, s.id, 2) })}
            />
          ))}
        </div>
      </div>

      {answers.soundsLike.length > 0 ? (
        <div>
          <Question hint="Pick one you didn't choose above.">{COPY.groupChat.fake}</Question>
          <div className="mt-5 grid gap-3">
            {COMMUNICATION_STYLES.map((s) => (
              <MessageBubble
                key={s.id}
                name={s.name}
                sample={s.sample}
                tone="avoid"
                selected={answers.wouldFeelFake === s.id}
                disabled={answers.soundsLike.includes(s.id)}
                onClick={() => update({ wouldFeelFake: answers.wouldFeelFake === s.id ? null : s.id })}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function MessageBubble({
  name,
  sample,
  selected,
  disabled,
  onClick,
  tone = 'choose',
}: {
  name: string
  sample: string
  selected: boolean
  disabled?: boolean
  onClick: () => void
  tone?: 'choose' | 'avoid'
}) {
  const selectedClass = tone === 'avoid' ? 'border-red-300 bg-red-50' : 'border-ink bg-tiffany-soft'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`flex w-full flex-col items-start gap-2 rounded-2xl border p-5 text-left transition sm:flex-row sm:items-center sm:justify-between ${
        selected ? selectedClass : 'border-line bg-white hover:border-ink/50'
      } disabled:cursor-not-allowed disabled:opacity-35`}
    >
      <span className="rounded-2xl rounded-bl-sm bg-cream px-4 py-3 text-base">{sample}</span>
      <span className="shrink-0 text-xs font-semibold tracking-label text-muted">{name.toUpperCase()}</span>
    </button>
  )
}

// ---------------------------------------------------------- Screen 05

export function ImpressionScreen({ answers, update }: ScreenProps) {
  return (
    <div className="space-y-10">
      <ScreenHeader headline={COPY.impression.headline} subheadline={COPY.impression.subheadline} />
      <div>
        <Question hint="Choose up to three.">{COPY.impression.question}</Question>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {FEELINGS.map((f) => (
            <ChoiceCard
              key={f}
              selected={answers.feelings.includes(f)}
              disabled={!answers.feelings.includes(f) && answers.feelings.length >= 3}
              onClick={() => update({ feelings: toggleInList(answers.feelings, f, 3) })}
              title={`"${f}"`}
            />
          ))}
        </div>
      </div>
      <TextArea label={COPY.impression.never} value={answers.neverSay} onChange={(v) => update({ neverSay: v })} rows={2} />
    </div>
  )
}

// ---------------------------------------------------------- Screen 06

export function RealityScreen({ answers, update }: ScreenProps) {
  return (
    <div className="space-y-10">
      <ScreenHeader headline={COPY.reality.headline} subheadline={COPY.reality.subheadline} />
      <div>
        <Question hint="Choose two.">{COPY.reality.q1}</Question>
        <div className="mt-4 flex flex-wrap gap-3">
          {TEN_SECONDS.map((o) => (
            <Chip key={o} selected={answers.tenSeconds.includes(o)} onClick={() => update({ tenSeconds: toggleInList(answers.tenSeconds, o, 2) })}>
              {o}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <Question>{COPY.reality.q2}</Question>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {CHALLENGES.map((c) => (
            <ChoiceCard key={c} selected={answers.challenge === c} onClick={() => update({ challenge: answers.challenge === c ? null : c })} title={c} />
          ))}
        </div>
      </div>
      <TextArea label={COPY.reality.q3} value={answers.chooseBecause} onChange={(v) => update({ chooseBecause: v })} rows={2} />
    </div>
  )
}

// ---------------------------------------------------------- Screen 07

export function MixScreen({ answers, update }: ScreenProps) {
  return (
    <div className="space-y-10">
      <ScreenHeader headline={COPY.mix.headline} subheadline={COPY.mix.subheadline} />
      <div className="card divide-y divide-line">
        {SLIDERS.map((s) => {
          const value = answers.sliders[s.id]
          return (
            <div key={s.id} className="p-6 sm:p-8">
              <div className="flex items-center justify-between text-base font-semibold">
                <span>{s.left}</span>
                <span>{s.right}</span>
              </div>
              <div className="mt-4 grid grid-cols-5 gap-2" role="radiogroup" aria-label={`${s.left} to ${s.right}`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={value === n}
                    aria-label={`${n} of 5`}
                    onClick={() => update({ sliders: { ...answers.sliders, [s.id]: n } })}
                    className={`h-11 rounded-xl border text-sm font-semibold transition ${
                      value === n ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink/50'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex justify-between gap-6 text-xs text-muted">
                <span className="max-w-[45%]">{s.leftHint}</span>
                <span className="max-w-[45%] text-right">{s.rightHint}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
