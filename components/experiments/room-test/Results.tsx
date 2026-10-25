'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Download, Loader2, Pencil, RefreshCw, Check } from 'lucide-react'
import { COMMUNICATION_STYLES, COPY, PERSONALITIES, STAGES } from '@/lib/experiments/room-test/config'
import type { RoomTestAnswers, RoomTestResult } from '@/lib/experiments/room-test/schema'

interface Props {
  experimentId: string
  answers: RoomTestAnswers
  result: RoomTestResult
  onResultChange: (r: RoomTestResult) => void
  initialBrandName: string
  saved: boolean
  needsRefresh: boolean
  answersChanged: boolean
  generateError: string
  onRegenerate: () => void
  onEditAnswers: () => void
  nextExperimentHref: string | null
}

export default function Results(props: Props) {
  const { answers, result, onResultChange } = props
  const [editing, setEditing] = useState(false)
  const [brandName, setBrandName] = useState(props.initialBrandName)
  const [saving, setSaving] = useState<'idle' | 'saving' | 'downloading'>('idle')
  const [saved, setSaved] = useState(props.saved && !props.needsRefresh)
  const [message, setMessage] = useState('')

  const primary = PERSONALITIES.find((p) => p.id === answers.primaryPersonality)
  const secondary = PERSONALITIES.find((p) => p.id === answers.secondaryPersonality)
  const stage = STAGES.find((s) => s.id === answers.stage)
  const styles = COMMUNICATION_STYLES.filter((s) => answers.soundsLike.includes(s.id))

  function set<K extends keyof RoomTestResult>(key: K, value: RoomTestResult[K]) {
    onResultChange({ ...result, [key]: value })
    setSaved(false)
  }

  async function persist(approve: boolean) {
    const res = await fetch(`/api/experiments/${props.experimentId}/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result, brandName, approve }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error ?? 'Could not save. Please try again.')
  }

  async function saveToBlueprint() {
    setSaving('saving')
    setMessage('')
    try {
      await persist(true)
      setSaved(true)
      setEditing(false)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save. Please try again.')
    } finally {
      setSaving('idle')
    }
  }

  async function download() {
    setSaving('downloading')
    setMessage('')
    try {
      if (!saved) await persist(false)
      window.location.href = `/api/experiments/${props.experimentId}/pdf`
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not prepare the PDF. Please try again.')
    } finally {
      setTimeout(() => setSaving('idle'), 1200)
    }
  }

  return (
    <div className="space-y-8">
      <div className="card-dark p-8 sm:p-12">
        <p className="text-[11px] font-semibold tracking-label text-tiffany">THE BRAND IDENTITY SNAPSHOT</p>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{COPY.reveal.headline}</h2>
        <p className="mt-3 text-lg text-white/80">{COPY.reveal.subheadline}</p>
        <label className="mt-8 block max-w-md">
          <span className="text-[11px] font-semibold tracking-label text-white/60">BRAND OR BUSINESS NAME</span>
          <input
            value={brandName}
            onChange={(e) => {
              setBrandName(e.target.value)
              setSaved(false)
            }}
            maxLength={120}
            className="input mt-2"
          />
        </label>
      </div>

      {props.needsRefresh ? (
        <Notice>Some of your earlier answers changed since these results were saved. Regenerate to refresh them, or keep them as they are.</Notice>
      ) : null}
      {props.answersChanged ? (
        <Notice>You changed some answers. Regenerate to include them in your results.</Notice>
      ) : null}
      {props.generateError ? <Notice tone="error">{props.generateError}</Notice> : null}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => setEditing((e) => !e)} className="btn-ghost">
          <Pencil className="h-4 w-4" /> {editing ? 'Done Editing' : 'Edit Results'}
        </button>
        <button type="button" onClick={props.onRegenerate} className="btn-ghost">
          <RefreshCw className="h-4 w-4" /> Regenerate
        </button>
        <button type="button" onClick={props.onEditAnswers} className="btn-ghost">
          Edit My Answers
        </button>
      </div>

      <Section number="01" title="Your brand in one sentence">
        <EditableText editing={editing} value={result.brand_sentence} onChange={(v) => set('brand_sentence', v)} large />
      </Section>

      <Section number="02" title="Your brand's personality mix">
        <div className="grid gap-6 sm:grid-cols-2">
          {primary ? <Labeled label="Primary personality">{primary.name}</Labeled> : null}
          {secondary ? <Labeled label="Secondary personality">{secondary.name}</Labeled> : null}
        </div>
        <Labeled label={stage ? `Where you are: ${stage.label}` : 'Where you are'}>
          <EditableText editing={editing} value={result.personality_mix.stage_note} onChange={(v) => set('personality_mix', { ...result.personality_mix, stage_note: v })} />
        </Labeled>
        <Labeled label="Defining traits">
          <EditableList editing={editing} items={result.personality_mix.traits} onChange={(v) => set('personality_mix', { ...result.personality_mix, traits: v })} pills />
        </Labeled>
        <Labeled label="Desired first impression">
          <EditableText editing={editing} value={result.personality_mix.first_impression} onChange={(v) => set('personality_mix', { ...result.personality_mix, first_impression: v })} />
        </Labeled>
        <Labeled label="Desired customer experience">
          <EditableText editing={editing} value={result.personality_mix.customer_experience} onChange={(v) => set('personality_mix', { ...result.personality_mix, customer_experience: v })} />
        </Labeled>
      </Section>

      <Section number="03" title="How your brand speaks">
        {styles.length ? (
          <p className="text-sm text-muted">You chose: {styles.map((s) => s.name).join(' and ')}</p>
        ) : null}
        <Labeled label="Primary communication style">
          <EditableText editing={editing} value={result.how_it_speaks.primary_style} onChange={(v) => set('how_it_speaks', { ...result.how_it_speaks, primary_style: v })} />
        </Labeled>
        <Labeled label="Supporting tone">
          <EditableText editing={editing} value={result.how_it_speaks.supporting_tone} onChange={(v) => set('how_it_speaks', { ...result.how_it_speaks, supporting_tone: v })} />
        </Labeled>
        <Labeled label="Phrases that fit">
          <EditableList editing={editing} items={result.how_it_speaks.example_phrases} onChange={(v) => set('how_it_speaks', { ...result.how_it_speaks, example_phrases: v })} quoted />
        </Labeled>
        <Labeled label="Habits to avoid">
          <EditableList editing={editing} items={result.how_it_speaks.habits_to_avoid} onChange={(v) => set('how_it_speaks', { ...result.how_it_speaks, habits_to_avoid: v })} />
        </Labeled>
      </Section>

      <Section number="04" title="What makes your brand memorable">
        <Labeled label="What your favorite brands have in common">
          <EditableList editing={editing} items={result.memorable.common_qualities} onChange={(v) => set('memorable', { ...result.memorable, common_qualities: v })} pills />
        </Labeled>
        <EditableText editing={editing} value={result.memorable.explanation} onChange={(v) => set('memorable', { ...result.memorable, explanation: v })} />
      </Section>

      <Section number="05" title="Your brand's reality check">
        <div className="space-y-4">
          {result.reality_check.map((item, i) => (
            <div key={i} className="rounded-2xl bg-cream p-5">
              <EditableText
                editing={editing}
                value={item.area}
                onChange={(v) => set('reality_check', result.reality_check.map((r, j) => (j === i ? { ...r, area: v } : r)))}
                bold
              />
              <div className="mt-2">
                <EditableText editing={editing} value={item.why} onChange={(v) => set('reality_check', result.reality_check.map((r, j) => (j === i ? { ...r, why: v } : r)))} />
              </div>
              <div className="mt-3">
                <p className="text-[11px] font-semibold tracking-label text-tiffany-dark">TRY THIS</p>
                <EditableText editing={editing} value={item.action} onChange={(v) => set('reality_check', result.reality_check.map((r, j) => (j === i ? { ...r, action: v } : r)))} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section number="06" title="Your creative direction">
        {(
          [
            ['visual_mood', 'Visual mood'],
            ['imagery_style', 'Photography and imagery'],
            ['typography_direction', 'Typography direction'],
            ['color_characteristics', 'Color characteristics'],
            ['brand_experience', 'Overall brand experience'],
          ] as const
        ).map(([key, label]) => (
          <Labeled key={key} label={label}>
            <EditableText editing={editing} value={result.creative_direction[key]} onChange={(v) => set('creative_direction', { ...result.creative_direction, [key]: v })} />
          </Labeled>
        ))}
      </Section>

      <Section number="07" title="Your next move">
        <EditableList editing={editing} items={result.next_moves} onChange={(v) => set('next_moves', v)} numbered />
        <p className="border-t border-line pt-6 text-lg font-semibold leading-snug">{COPY.reveal.closing}</p>
      </Section>

      <div className="card-dark p-8 sm:p-10">
        <h3 className="text-2xl font-bold">{COPY.save.headline}</h3>
        {message ? <p role="alert" className="mt-4 text-sm text-white">{message}</p> : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={saveToBlueprint} disabled={saving !== 'idle' || saved} className="btn-accent">
            {saving === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
            {saved ? 'Saved to My Brand Blueprint' : 'Save to My Brand Blueprint'}
          </button>
          <button type="button" onClick={download} disabled={saving !== 'idle'} className="btn border border-white/30 text-white hover:border-white">
            {saving === 'downloading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download PDF
          </button>
          {saved && props.nextExperimentHref ? (
            <Link href={props.nextExperimentHref} className="btn border border-white/30 text-white hover:border-white">
              Continue to the Next Lesson <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-6 p-6 sm:p-8">
      <div className="flex items-baseline gap-3">
        <span className="text-sm font-bold text-tiffany-dark">{number}</span>
        <h3 className="text-xl font-bold">{title}</h3>
      </div>
      {children}
    </section>
  )
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="mt-2 text-base leading-relaxed">{children}</div>
    </div>
  )
}

function Notice({ children, tone = 'info' }: { children: React.ReactNode; tone?: 'info' | 'error' }) {
  return (
    <p role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl px-4 py-3 text-sm font-medium ${tone === 'error' ? 'bg-red-50 text-red-800' : 'bg-tiffany-soft'}`}>
      {children}
    </p>
  )
}

function EditableText({
  editing,
  value,
  onChange,
  large,
  bold,
}: {
  editing: boolean
  value: string
  onChange: (v: string) => void
  large?: boolean
  bold?: boolean
}) {
  if (editing) {
    return <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={large ? 3 : 2} maxLength={900} className="input resize-y" />
  }
  return <p className={`${large ? 'text-2xl font-semibold leading-snug' : ''} ${bold ? 'font-semibold' : ''}`}>{value}</p>
}

function EditableList({
  editing,
  items,
  onChange,
  pills,
  quoted,
  numbered,
}: {
  editing: boolean
  items: string[]
  onChange: (v: string[]) => void
  pills?: boolean
  quoted?: boolean
  numbered?: boolean
}) {
  if (editing) {
    return (
      <div className="space-y-2">
        {items.map((item, i) => (
          <input key={i} value={item} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} maxLength={300} className="input" />
        ))}
      </div>
    )
  }
  if (pills) {
    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span key={i} className="rounded-full bg-tiffany-soft px-4 py-1.5 text-sm font-medium">
            {item}
          </span>
        ))}
      </div>
    )
  }
  const List = numbered ? 'ol' : 'ul'
  return (
    <List className={`space-y-2 ${numbered ? 'list-decimal pl-5' : ''}`}>
      {items.map((item, i) => (
        <li key={i} className={numbered ? 'pl-1' : 'flex gap-2'}>
          {!numbered ? <span className="text-tiffany-dark" aria-hidden>|</span> : null}
          <span>{quoted ? `"${item}"` : item}</span>
        </li>
      ))}
    </List>
  )
}
