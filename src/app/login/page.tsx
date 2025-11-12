'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { terminal } from '../fonts/fonts'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get('redirect') || '/dashboard'

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
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

          {/* Email Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
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
                  Sending...
                </span>
              ) : (
                'Send Authentication Link'
              )}
            </button>
          </form>

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
          <p className="text-rh-white/50 text-sm">
            You'll receive a secure authentication link via email
          </p>
        </div>
      </div>
    </div>
  )
}
