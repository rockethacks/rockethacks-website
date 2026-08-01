'use client'

import { useState, Suspense, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { getPasswordRequirementsText, passwordsMatch } from '@/lib/utils/passwordValidation'
import { terminal } from '../fonts/fonts'

type AuthMode = 'password' | 'magic-link'
type StaffMode = 'signin' | 'activate'

export const dynamic = 'force-dynamic'

function LoginForm() {
  const [authMode, setAuthMode] = useState<AuthMode>('password')
  const [staffMode, setStaffMode] = useState<StaffMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get('redirect') || '/dashboard'
  const orgCodeFromUrl = (searchParams.get('org_code') || '').toUpperCase()
  const isStaffInvite = !!orgCodeFromUrl || staffMode === 'activate'

  useEffect(() => {
    if (orgCodeFromUrl) {
      setInviteCode(orgCodeFromUrl)
      setStaffMode('activate')
    }
  }, [orgCodeFromUrl])

  const redeemStaffInvite = useCallback(
    async (code: string) => {
      const supabase = createClient()
      const { error: rpcError } = await supabase.rpc('redeem_organizer_invite', {
        p_invite_code: code.trim().toUpperCase(),
      })
      if (rpcError) {
        throw new Error(
          rpcError.message.includes('hacker application')
            ? 'This email has a hacker application. Staff must use a different email.'
            : rpcError.message.includes('does not match')
              ? 'This invite belongs to a different email. Sign out and use the invited address.'
              : rpcError.message
        )
      }
      const auth = await fetch('/api/auth/user').then((r) => r.json())
      router.replace(auth.isAdmin ? '/admin' : '/organizer')
    },
    [router]
  )

  // If already signed in with org_code, try redeem
  useEffect(() => {
    if (!orgCodeFromUrl) return
    let cancelled = false
    ;(async () => {
      const auth = await fetch('/api/auth/user').then((r) => r.json())
      if (cancelled || !auth.user) return
      if (auth.isOrganizer) {
        router.replace(auth.isAdmin ? '/admin' : '/organizer')
        return
      }
      try {
        setLoading(true)
        await redeemStaffInvite(orgCodeFromUrl)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not redeem invite')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [orgCodeFromUrl, redeemStaffInvite, router])

  const handleStaffActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (!passwordsMatch(password, confirmPassword)) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/organizer/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, inviteCode, password }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Could not create your staff account.')
        if (data.accountExists) setStaffMode('signin')
        return
      }

      if (data.signedIn) {
        await redeemStaffInvite(inviteCode)
        return
      }

      setMessage(data.message || 'Check your email to confirm, then sign in.')
      setStaffMode('signin')
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          authMode: 'password',
          redirect: inviteCode ? `/login?org_code=${encodeURIComponent(inviteCode)}` : redirectPath,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Invalid email or password')
        return
      }

      if (inviteCode) {
        try {
          await redeemStaffInvite(inviteCode)
          return
        } catch (e) {
          // Already staff — login redirect may already be correct
          const auth = await fetch('/api/auth/user').then((r) => r.json())
          if (auth.isOrganizer) {
            router.push(auth.isAdmin ? '/admin' : '/organizer')
            return
          }
          setError(e instanceof Error ? e.message : 'Could not redeem invite')
          return
        }
      }

      router.push(data.redirect || redirectPath)
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          authMode: 'magic-link',
          redirect: inviteCode
            ? `/login?org_code=${encodeURIComponent(inviteCode)}`
            : redirectPath,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message || 'Check your email for the authentication link!')
      } else {
        setError(data.error || 'Failed to send authentication email')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit =
    staffMode === 'activate' && isStaffInvite
      ? handleStaffActivate
      : authMode === 'password'
        ? handlePasswordLogin
        : handleMagicLinkLogin

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/rh_26/rh_26_folder/rh_26_bg.png"
          alt="RocketHacks Background"
          fill
          className="object-cover object-center"
          priority
          quality={75}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/70"></div>
      </div>

      <div className="absolute left-[10%] top-[20%] w-4 h-4 bg-rh-yellow rounded-full animate-float opacity-60"></div>
      <div className="absolute right-[15%] top-[30%] w-6 h-6 bg-rh-orange rounded-full animate-float opacity-40" style={{ animationDelay: '1s' }}></div>
      <div className="absolute left-[15%] bottom-[25%] w-3 h-3 bg-rh-purple-light rounded-full animate-float opacity-70" style={{ animationDelay: '2s' }}></div>
      <div className="absolute right-[10%] bottom-[20%] w-5 h-5 bg-rh-pink rounded-full animate-float opacity-50" style={{ animationDelay: '0.5s' }}></div>

      <div className="relative z-10 max-w-md w-full">
        <div className="glass rounded-2xl p-8 space-y-6 animate-slide-up">
          <div className="text-center space-y-2">
            <h1 className={`${terminal.className} text-4xl font-bold gradient-text uppercase tracking-wider`}>
              {staffMode === 'activate' && isStaffInvite ? 'Staff Invite' : 'Welcome'}
            </h1>
            <p className="text-rh-white/70 text-sm">
              {staffMode === 'activate' && isStaffInvite
                ? 'Create your organizer account with the invite code from an admin'
                : 'Sign in to access your RocketHacks dashboard'}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm backdrop-blur-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg text-sm backdrop-blur-sm">
              <p className="font-semibold mb-1">✓ Email Sent!</p>
              <p>{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-rh-white/80 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rh-yellow focus:border-transparent transition-all backdrop-blur-sm"
                placeholder="your.email@example.com"
                disabled={loading}
              />
            </div>

            {(staffMode === 'activate' || !!inviteCode) && (
              <div>
                <label htmlFor="org_code" className="block text-sm font-medium text-rh-white/80 mb-2">
                  Staff invite code
                </label>
                <input
                  id="org_code"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rh-yellow tracking-widest uppercase"
                  placeholder="ABCD1234"
                  disabled={loading}
                  required={staffMode === 'activate'}
                />
              </div>
            )}

            {(authMode === 'password' || staffMode === 'activate') && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-medium text-rh-white/80">
                    Password
                  </label>
                  {staffMode !== 'activate' && (
                    <Link
                      href="/forgot-password"
                      className="text-xs text-rh-yellow hover:text-rh-orange transition-colors"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rh-yellow focus:border-transparent transition-all backdrop-blur-sm"
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-rh-white/50 hover:text-rh-white transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {staffMode === 'activate' && (
                  <p className="mt-2 text-xs text-rh-white/50">
                    {getPasswordRequirementsText().join(' · ')}
                  </p>
                )}
              </div>
            )}

            {staffMode === 'activate' && (
              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-rh-white/80 mb-2">
                  Confirm password
                </label>
                <input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rh-yellow"
                  disabled={loading}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full font-semibold py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Please wait…'
                : staffMode === 'activate'
                  ? 'Activate staff account'
                  : authMode === 'password'
                    ? 'Sign In'
                    : 'Send Authentication Link'}
            </button>
          </form>

          {isStaffInvite && (
            <button
              type="button"
              onClick={() => {
                setStaffMode(staffMode === 'activate' ? 'signin' : 'activate')
                setError('')
                setMessage('')
                setConfirmPassword('')
              }}
              className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-rh-white text-sm font-medium transition-all"
            >
              {staffMode === 'activate'
                ? 'Already activated? Sign in instead'
                : 'First time? Activate with invite code'}
            </button>
          )}

          {staffMode !== 'activate' && authMode === 'password' && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 py-1 bg-white/5 backdrop-blur-sm text-rh-white/70 rounded-full border border-white/10 font-medium">
                    Or
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('magic-link')
                  setError('')
                  setMessage('')
                  setPassword('')
                }}
                className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-rh-white text-sm font-medium transition-all"
              >
                Sign in with Magic Link
              </button>
            </>
          )}

          {staffMode !== 'activate' && authMode === 'magic-link' && (
            <button
              type="button"
              onClick={() => {
                setAuthMode('password')
                setError('')
                setMessage('')
              }}
              className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-rh-white text-sm font-medium transition-all"
            >
              Back to Password Sign In
            </button>
          )}

          {staffMode !== 'activate' && !orgCodeFromUrl && (
            <div className="text-center pt-2">
              <p className="text-sm text-rh-white/60">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-rh-yellow hover:text-rh-orange transition-colors font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          )}

          <div className="text-center pt-4 border-t border-white/10">
            <Link
              href="/"
              className="text-sm text-rh-white/60 hover:text-rh-yellow transition-colors inline-flex items-center gap-2"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-rh-yellow border-t-transparent rounded-full"></div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
