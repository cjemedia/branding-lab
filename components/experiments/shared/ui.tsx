'use client'

import { Check } from 'lucide-react'

export function ScreenHeader({ headline, subheadline }: { headline: string; subheadline?: string }) {
  return (
    <div className="max-w-3xl">
      <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{headline}</h2>
      {subheadline ? <p className="mt-4 text-lg text-muted">{subheadline}</p> : null}
    </div>
  )
}

export function Question({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <p className="text-lg font-semibold">{children}</p>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
    </div>
  )
}

export function ChoiceCard({
  selected,
  onClick,
  title,
  body,
  badge,
  disabled,
}: {
  selected: boolean
  onClick: () => void
  title: string
  body?: string
  badge?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`group relative flex h-full w-full flex-col rounded-2xl border p-5 text-left transition ${
        selected ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink/50'
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="text-base font-semibold leading-snug">{title}</span>
        {selected ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-tiffany px-2.5 py-1 text-[11px] font-bold text-ink">
            {badge ?? <Check className="h-3.5 w-3.5" />}
          </span>
        ) : null}
      </span>
      {body ? <span className={`mt-2 text-sm leading-relaxed ${selected ? 'text-white/80' : 'text-muted'}`}>{body}</span> : null}
    </button>
  )
}

export function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
        selected ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink/50'
      }`}
    >
      {children}
    </button>
  )
}

export function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
  maxLength = 600,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
  maxLength?: number
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        className="input mt-2 resize-y"
      />
    </label>
  )
}

export function toggleInList<T>(list: T[], value: T, max: number): T[] {
  if (list.includes(value)) return list.filter((v) => v !== value)
  if (max === 1) return [value]
  if (list.length >= max) return list
  return [...list, value]
}
