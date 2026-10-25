'use client'

import { useState } from 'react'
import AuthShell from '@/components/AuthShell'
import { createClient } from '@/lib/supabase/client'

export default function SetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Use at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError("Those passwords don't match.")
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError('Your link may have expired. Request a new one from the sign in page.')
      setLoading(false)
      return
    }

    window.location.href = '/dashboard'
  }

  return (
    <AuthShell title="Set your password" subtitle="You'll use this with your email to sign in.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="text-[11px] font-semibold tracking-label text-white/60">
            NEW PASSWORD
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input mt-2"
          />
        </div>
        <div>
          <label htmlFor="confirm" className="text-[11px] font-semibold tracking-label text-white/60">
            CONFIRM PASSWORD
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="input mt-2"
          />
        </div>
        {error ? (
          <p role="alert" className="rounded-xl bg-white/10 px-4 py-3 text-sm text-white">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={loading} className="btn-accent w-full">
          {loading ? 'Saving...' : 'Save Password'}
        </button>
      </form>
    </AuthShell>
  )
}
