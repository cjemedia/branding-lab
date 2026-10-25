'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { safeNext } from '@/lib/safe-redirect'

export default function LoginForm({ next, linkExpired }: { next: string | null; linkExpired?: boolean }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(
    linkExpired ? 'That link has expired or was already used. Sign in, or reset your password for a new link.' : ''
  )
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError('That email and password combination did not work. Try again or reset your password.')
      setLoading(false)
      return
    }

    window.location.href = safeNext(next)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="text-[11px] font-semibold tracking-label text-white/60">
          EMAIL
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input mt-2"
        />
      </div>
      <div>
        <label htmlFor="password" className="text-[11px] font-semibold tracking-label text-white/60">
          PASSWORD
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input mt-2"
        />
      </div>

      {error ? (
        <p role="alert" className="rounded-xl bg-white/10 px-4 py-3 text-sm text-white">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={loading} className="btn-accent w-full">
        {loading ? 'Signing in...' : 'Sign In'}
        {!loading ? <ArrowRight className="h-4 w-4" /> : null}
      </button>

      <p className="pt-2 text-center text-sm">
        <Link href="/forgot-password" className="text-white/70 underline-offset-4 hover:text-white hover:underline">
          Forgot your password?
        </Link>
      </p>
    </form>
  )
}
