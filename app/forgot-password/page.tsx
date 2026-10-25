'use client'

import { useState } from 'react'
import Link from 'next/link'
import AuthShell from '@/components/AuthShell'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/auth/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <AuthShell title="Reset your password">
      {sent ? (
        <div className="space-y-6">
          <p className="text-sm text-white/80">
            If that email has Branding Lab access, a reset link is on its way. Check your inbox and spam folder.
          </p>
          <Link href="/login" className="btn-ghost w-full">
            Back to Sign In
          </Link>
        </div>
      ) : (
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
          <button type="submit" disabled={loading} className="btn-accent w-full">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
          <p className="pt-2 text-center text-sm">
            <Link href="/login" className="text-white/70 hover:text-white">
              Back to Sign In
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  )
}
