'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { terminal } from '../fonts/fonts'

type AuthMode = 'password' | 'magic-link'

// Disable static generation for this page
export const dynamic = 'force-dynamic'

function LoginForm() {
  const [authMode, setAuthMode] = useState<AuthMode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get('redirect') || '/dashboard'

  // Handle password-based login
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
          redirect: redirectPath
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Successful login - redirect to dashboard
        router.push(redirectPath)
      } else {
        setError(data.error || 'Invalid email or password')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Magic Link login
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
          redirect: redirectPath
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message || 'Check your email for the authentication link!')
      } else {
        setError(data.error || 'Failed to send authentication email')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = authMode === 'password' ? handlePasswordLogin : handleMagicLinkLogin

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden">
      {/* Background Image */}
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

      {/* Floating Elements */}
      <div className="absolute left-[10%] top-[20%] w-4 h-4 bg-rh-yellow rounded-full animate-float opacity-60"></div>
      <div className="absolute right-[15%] top-[30%] w-6 h-6 bg-rh-orange rounded-full animate-float opacity-40" style={{ animationDelay: '1s' }}></div>
      <div className="absolute left-[15%] bottom-[25%] w-3 h-3 bg-rh-purple-light rounded-full animate-float opacity-70" style={{ animationDelay: '2s' }}></div>
      <div className="absolute right-[10%] bottom-[20%] w-5 h-5 bg-rh-pink rounded-full animate-float opacity-50" style={{ animationDelay: '0.5s' }}></div>

      {/* Login Card */}
      <div className="relative z-10 max-w-md w-full">
        <div className="glass rounded-2xl p-8 space-y-6 animate-slide-up">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className={`${terminal.className} text-4xl font-bold gradient-text uppercase tracking-wider`}>
              Welcome
            </h1>
            <p className="text-rh-white/70 text-sm">
              Sign in to access your RocketHacks dashboard
            </p>
          </div>

          {/* Auth Mode Toggle */}
          <div className="flex gap-2 p-1 bg-white/5 rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => {
                setAuthMode('password')
                setError('')
                setMessage('')
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                authMode === 'password'
                  ? 'bg-rh-yellow text-black shadow-lg'
                  : 'text-rh-white/60 hover:text-rh-white'
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('magic-link')
                setError('')
                setMessage('')
                setPassword('')
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                authMode === 'magic-link'
                  ? 'bg-rh-yellow text-black shadow-lg'
                  : 'text-rh-white/60 hover:text-rh-white'
              }`}
            >
              Magic Link
            </button>
          </div>

          {/* Alert Messages */}
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

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
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

            {/* Password Input (only for password mode) */}
            {authMode === 'password' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-medium text-rh-white/80">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-rh-yellow hover:text-rh-orange transition-colors"
                  >
                    Forgot password?
                  </Link>
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
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full font-semibold py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {authMode === 'password' ? 'Signing in...' : 'Sending...'}
                </span>
              ) : (
                authMode === 'password' ? 'Sign In' : 'Send Authentication Link'
              )}
            </button>
          </form>

          {/* Signup Link */}
          <div className="text-center pt-2">
            <p className="text-sm text-rh-white/60">
              Don't have an account?{' '}
              <Link
                href="/signup"
                className="text-rh-yellow hover:text-rh-orange transition-colors font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>

          {/* Back Link */}
          <div className="text-center pt-4 border-t border-white/10">
            <Link
              href="/"
              className="text-sm text-rh-white/60 hover:text-rh-yellow transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to home
            </Link>
          </div>
        </div>

        {/* Helper Text */}
        <div className="mt-6 text-center">
          {authMode === 'password' ? (
            <p className="text-rh-white/50 text-sm">
              Sign in with your email and password for instant access
            </p>
          ) : (
            <p className="text-rh-white/50 text-sm">
              You'll receive a secure authentication link via email
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-rh-yellow border-t-transparent rounded-full"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
