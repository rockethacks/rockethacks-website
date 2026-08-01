'use client'

import { useState, Suspense, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getPasswordRequirementsText, passwordsMatch } from '@/lib/utils/passwordValidation'
import { Banner, Field, InlineSpinner, LoadingScreen, inputClass } from '@/components/judging/ui'
import { loadSession } from '@/lib/judging/session'

type Mode = 'activate' | 'signin'

function JudgeLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const codeFromUrl = (searchParams.get('code') || '').toUpperCase()
  const requestedRedirect = searchParams.get('redirect') || ''

  const [checking, setChecking] = useState(true)
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('activate')

  const [email, setEmail] = useState('')
  const [inviteCode, setInviteCode] = useState(codeFromUrl)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [busy, setBusy] = useState(false)
  const [redeeming, setRedeeming] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const destination = requestedRedirect.startsWith('/judge') ? requestedRedirect : '/judge'

  const redeem = useCallback(
    async (code: string) => {
      setRedeeming(true)
      setError('')
      const supabase = createClient()
      const { error: rpcError } = await supabase.rpc('redeem_judge_invite', {
        p_invite_code: code.trim().toUpperCase(),
      })
      if (rpcError) {
        setError(
          rpcError.message.includes('does not match')
            ? 'This invite belongs to a different email address. Sign out and use the email the organizers invited.'
            : rpcError.message
        )
        setRedeeming(false)
        return
      }
      router.replace(destination)
    },
    [router, destination]
  )

  useEffect(() => {
    let cancelled = false
    async function checkSession() {
      let data
      try {
        data = await loadSession()
      } catch (e) {
        if (cancelled) return
        // Still show the form; they can retry by submitting it
        setError(e instanceof Error ? e.message : 'Could not verify your session.')
        setChecking(false)
        return
      }
      if (cancelled) return

      if (data.user) {
        setSignedInEmail(data.user.email || '')
        if (data.isJudge) {
          router.replace(destination)
          return
        }
        if (codeFromUrl) {
          setChecking(false)
          redeem(codeFromUrl)
          return
        }
      }
      setChecking(false)
    }
    checkSession()
    return () => {
      cancelled = true
    }
  }, [codeFromUrl, redeem, router, destination])

  const activate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!passwordsMatch(password, confirmPassword)) {
      setError('Passwords do not match.')
      return
    }

    setBusy(true)
    try {
      const response = await fetch('/api/judge/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, inviteCode, password }),
      })
      const data = await response.json()

      if (response.ok) {
        if (data.signedIn) {
          await redeem(inviteCode)
          return
        }
        setMessage(data.message)
      } else {
        setError(data.error || 'Could not create your judge account.')
        if (data.accountExists) {
          setMode('signin')
          setPassword('')
          setConfirmPassword('')
        }
      }
    } catch {
      setError('Network error. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setBusy(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, authMode: 'password', redirect: destination }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Invalid email or password.')
        return
      }

      const auth = await fetch('/api/auth/user').then((r) => r.json())
      if (auth.isJudge) {
        router.replace(destination)
        return
      }
      if (inviteCode) {
        await redeem(inviteCode)
        return
      }
      setSignedInEmail(auth.user?.email || email)
      setError('Signed in, but this account is not a judge yet. Enter your invite code to activate it.')
    } catch {
      setError('Network error. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setSignedInEmail(null)
    setMode('activate')
    setMessage('')
    setError('')
  }

  if (checking) return <LoadingScreen message="Checking your judge access…" />

  const showCodeOnly = !!signedInEmail

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030c1b] via-[#0a1628] to-[#030c1b] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-4">
        <div className="text-center space-y-2">
          <p className="text-yellow-400 text-sm font-semibold uppercase tracking-[0.2em]">RocketHacks</p>
          <h1 className="text-3xl font-bold text-white">Judge Portal</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            {showCodeOnly
              ? 'You are signed in. Enter the invite code the organizers sent you to unlock judging.'
              : mode === 'activate'
                ? 'First time here? Create your judge account with the invite the organizers sent you.'
                : 'Sign in with the password you set when you activated your judge account.'}
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 space-y-5">
          {error && <Banner tone="error">{error}</Banner>}
          {message && <Banner tone="success">{message}</Banner>}
          {redeeming && (
            <Banner tone="info">
              <InlineSpinner /> <span className="ml-2">Activating your judge access…</span>
            </Banner>
          )}

          {showCodeOnly ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                redeem(inviteCode)
              }}
              className="space-y-4"
            >
              <p className="text-sm text-gray-400">
                Signed in as <span className="text-white">{signedInEmail}</span>
              </p>

              <Field
                label="Invite code"
                required
                hint="This links your account to your judge profile. You only do this once."
              >
                <input
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className={`${inputClass} font-mono tracking-widest`}
                  placeholder="XXXXXXXX"
                  maxLength={16}
                />
              </Field>

              <button
                type="submit"
                disabled={redeeming}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-lg transition"
              >
                {redeeming ? 'Activating…' : 'Activate judge access'}
              </button>

              <button
                type="button"
                onClick={signOut}
                className="w-full px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm font-semibold rounded-lg transition"
              >
                Use a different account
              </button>
            </form>
          ) : mode === 'activate' ? (
            <form onSubmit={activate} className="space-y-4">
              <Field
                label="Invite email"
                required
                hint="Must match exactly the address the organizers invited."
              >
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="you@company.com"
                />
              </Field>

              <Field
                label="Invite code"
                required
                hint="An 8-character code from your invite, for example K7M2QP4X. Codes expire after the event weekend."
              >
                <input
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className={`${inputClass} font-mono tracking-widest`}
                  placeholder="XXXXXXXX"
                  maxLength={16}
                />
              </Field>

              <Field label="Create a password" required hint="You will use this every time you sign in.">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    placeholder="Choose a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
                    tabIndex={-1}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </Field>

              <Field label="Confirm password" required>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Repeat your password"
                />
              </Field>

              <ul className="text-xs text-gray-500 space-y-1">
                {getPasswordRequirementsText().map((req) => (
                  <li key={req}>• {req}</li>
                ))}
              </ul>

              <button
                type="submit"
                disabled={busy || redeeming}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition"
              >
                {busy ? 'Creating account…' : 'Create judge account'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('signin')
                  setError('')
                  setMessage('')
                }}
                className="w-full px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm font-semibold rounded-lg transition"
              >
                I already have an account
              </button>
            </form>
          ) : (
            <form onSubmit={signIn} className="space-y-4">
              <Field label="Email" required>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="you@company.com"
                />
              </Field>

              <Field label="Password" required>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Your password"
                />
              </Field>

              <Field
                label="Invite code"
                hint="Only needed if you have not activated judging on this account yet."
              >
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className={`${inputClass} font-mono tracking-widest`}
                  placeholder="XXXXXXXX"
                  maxLength={16}
                />
              </Field>

              <button
                type="submit"
                disabled={busy || redeeming}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition"
              >
                {busy ? 'Signing in…' : 'Sign in'}
              </button>

              <div className="flex justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setMode('activate')
                    setError('')
                    setMessage('')
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ← Activate a new invite
                </button>
                <Link href="/forgot-password" className="text-blue-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-500">
          Once activated you can also sign in from the{' '}
          <Link href="/login" className="text-blue-400 hover:underline">
            main login page
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

export default function JudgeLoginPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <JudgeLoginForm />
    </Suspense>
  )
}
