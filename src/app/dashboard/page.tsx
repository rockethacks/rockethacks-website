'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { terminal } from '../fonts/fonts'
import { checkApplicationCompleteness, groupMissingFieldsByCategory, getCategoryDisplayName, type CompletenessResult } from '@/lib/utils/applicationCompleteness'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [application, setApplication] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isOrganizer, setIsOrganizer] = useState(false)
  const [completeness, setCompleteness] = useState<CompletenessResult | null>(null)
  const [showMissingFields, setShowMissingFields] = useState(false)

  useEffect(() => {
    async function loadData() {
      // Get user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirect=/dashboard')
        return
      }
      setUser(user)

      // Check if user is admin or organizer
      const authResponse = await fetch('/api/auth/user')
      const authData = await authResponse.json()
      setIsAdmin(authData.isAdmin)
      setIsOrganizer(authData.isOrganizer)

      // Get application
      const { data: app, error } = await supabase
        .from('applicants')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Error loading application:', error)
      } else {
        setApplication(app)
        // Check completeness if application exists
        if (app) {
          const completenessResult = checkApplicationCompleteness(app)
          setCompleteness(completenessResult)
        }
      }

      setLoading(false)
    }
    loadData()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-rh-yellow/20 text-rh-yellow border-rh-yellow/50'
      case 'accepted':
        return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/50'
      case 'waitlisted':
        return 'bg-rh-purple-light/20 text-rh-purple-light border-rh-purple-light/50'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/rh_26/rh_26_folder/rh_26_bg.png"
            alt="Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/60"></div>
        </div>
        <div className="relative z-10 text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative py-16 px-4">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/assets/rh_26/rh_26_folder/rh_26_bg.png"
          alt="RocketHacks Background"
          fill
          className="object-cover object-center"
          priority
          quality={75}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70"></div>
      </div>

      {/* Floating Elements */}
      <div className="fixed left-[5%] top-[15%] w-4 h-4 bg-rh-yellow rounded-full animate-float opacity-60"></div>
      <div className="fixed right-[8%] top-[25%] w-6 h-6 bg-rh-orange rounded-full animate-float opacity-40" style={{ animationDelay: '1s' }}></div>
      <div className="fixed left-[10%] bottom-[20%] w-3 h-3 bg-rh-purple-light rounded-full animate-float opacity-70" style={{ animationDelay: '2s' }}></div>
      <div className="fixed right-[6%] bottom-[15%] w-5 h-5 bg-rh-pink rounded-full animate-float opacity-50" style={{ animationDelay: '0.5s' }}></div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="glass rounded-2xl p-8 mb-6 animate-slide-up">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className={`${terminal.className} text-4xl md:text-5xl font-bold gradient-text uppercase tracking-wider mb-2`}>
                Dashboard
              </h1>
              <p className="text-rh-white/70">Welcome back, {user?.email}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="btn-primary px-6 py-2 text-sm font-semibold"
                >
                  Admin Portal
                </Link>
              )}
              {(isOrganizer || isAdmin) && (
                <Link
                  href="/organizer"
                  className="btn-primary px-6 py-2 text-sm font-semibold"
                >
                  Check-In Portal
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="btn-secondary px-6 py-2 text-sm font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Application Status */}
        {application ? (
          <div className="space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {/* Application Completeness Card */}
            {completeness && (
              <div className="glass rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`${terminal.className} text-xl font-semibold uppercase tracking-wide ${completeness.isComplete ? 'text-green-400' : 'text-yellow-400'}`}>
                        {completeness.isComplete ? '✓ Application Complete' : '⚠️ Application Incomplete'}
                      </h3>
                      {!completeness.isComplete && (
                        <span className="text-sm text-rh-white/60">
                          ({completeness.filledFields}/{completeness.totalFields} fields)
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-rh-white/70">
                      {completeness.isComplete
                        ? 'Great! Your application is 100% complete.'
                        : `You're ${completeness.percentage}% complete. Fill out all fields to improve your chances!`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${completeness.isComplete ? 'text-green-400' : 'text-yellow-400'}`}>
                        {completeness.percentage}%
                      </div>
                    </div>
                    {!completeness.isComplete && (
                      <button
                        onClick={() => setShowMissingFields(!showMissingFields)}
                        className="btn-secondary px-4 py-2 text-sm font-semibold whitespace-nowrap"
                      >
                        {showMissingFields ? 'Hide' : 'Show'} Missing Fields
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                      completeness.isComplete
                        ? 'bg-gradient-to-r from-green-500 to-green-400'
                        : 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                    }`}
                    style={{ width: `${completeness.percentage}%` }}
                  />
                </div>

                {/* Missing Fields Dropdown */}
                {!completeness.isComplete && showMissingFields && (
                  <div className="mt-6 space-y-4 animate-slide-down">
                    <div className="border-t border-white/10 pt-4">
                      <h4 className={`${terminal.className} text-sm font-semibold text-rh-orange uppercase tracking-wide mb-3`}>
                        Missing Fields ({completeness.missingFields.length})
                      </h4>
                      <div className="space-y-3">
                        {Object.entries(groupMissingFieldsByCategory(completeness.missingFields)).map(([category, fields]) => (
                          <div key={category} className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <h5 className="text-sm font-semibold text-rh-yellow mb-2">{getCategoryDisplayName(category)}</h5>
                            <ul className="space-y-1">
                              {fields.map((field) => (
                                <li key={field.field} className="text-sm text-rh-white/70 flex items-start gap-2">
                                  <span className="text-rh-orange mt-0.5">•</span>
                                  <span>{field.label}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4">
                        <Link
                          href="/apply"
                          className="btn-primary px-6 py-2 text-sm font-semibold inline-block"
                        >
                          Complete Your Application →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Status Card */}
            <div className="glass rounded-2xl p-8">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
                <div>
                  <h2 className={`${terminal.className} text-2xl md:text-3xl font-semibold text-rh-yellow uppercase tracking-wide mb-2`}>
                    Application Status
                  </h2>
                  <p className="text-rh-white/70">Submitted on {new Date(application.submitted_at).toLocaleDateString()}</p>
                </div>
                <span className={`px-4 py-2 rounded-lg border font-semibold uppercase text-sm backdrop-blur-sm ${getStatusColor(application.status)}`}>
                  {application.status}
                </span>
              </div>

              {application.status === 'pending' && (
                <div className="bg-rh-yellow/10 border border-rh-yellow/50 text-rh-yellow px-6 py-4 rounded-xl backdrop-blur-sm">
                  <p className={`${terminal.className} font-semibold mb-2 text-lg`}>Application Under Review</p>
                  <p className="text-sm text-rh-white/80">We're reviewing your application. You'll receive an email once a decision is made.</p>
                </div>
              )}

              {application.status === 'accepted' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Acceptance Card */}
                  <div className="relative rounded-2xl backdrop-blur-xl overflow-hidden border-2 border-green-500/40 shadow-2xl" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)' }}>
                    {/* Decorative gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-400/5 via-transparent to-green-600/10 pointer-events-none"></div>
                    
                    <div className="relative p-6 sm:p-8">
                      {/* Icon Badge */}
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/20 border-2 border-green-400/40 mb-4 shadow-lg">
                        <svg className="w-9 h-9 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>

                      {/* Content */}
                      <div className="space-y-3">
                        <div>
                          <h3 className={`${terminal.className} text-2xl sm:text-3xl font-bold text-green-400 uppercase tracking-wide mb-2`}>
                            Accepted!
                          </h3>
                          <p className="text-green-300/90 text-base sm:text-lg font-semibold">
                            🎉 Congratulations! You're in!
                          </p>
                        </div>
                        
                        <div className="pt-2 pb-1">
                          <div className="h-1 w-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full"></div>
                        </div>

                        <p className="text-sm sm:text-base text-rh-white/80 leading-relaxed">
                          Check your email for next steps and important information about the event.
                        </p>

                        {/* Stats */}
                        <div className="pt-4 flex items-center gap-4 text-xs sm:text-sm text-green-300/70">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{new Date(application.submitted_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Decorative corner accent */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-400/10 to-transparent rounded-bl-full"></div>
                    </div>
                  </div>

                  {/* Check-In Badge Card */}
                  <div className={`relative rounded-2xl backdrop-blur-xl overflow-hidden border-2 shadow-2xl ${
                    application.checked_in
                      ? 'border-blue-500/40'
                      : 'border-yellow-500/40'
                  }`} style={{ 
                    background: application.checked_in 
                      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.08) 100%)'
                      : 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.08) 100%)'
                  }}>
                    {/* Decorative gradient overlay */}
                    <div className={`absolute inset-0 pointer-events-none ${
                      application.checked_in
                        ? 'bg-gradient-to-br from-blue-400/5 via-transparent to-blue-600/10'
                        : 'bg-gradient-to-br from-yellow-400/5 via-transparent to-yellow-600/10'
                    }`}></div>
                    
                    <div className="relative p-6 sm:p-8">
                      {/* Badge Icon */}
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl border-2 mb-4 shadow-lg ${
                        application.checked_in
                          ? 'bg-blue-500/20 border-blue-400/40'
                          : 'bg-yellow-500/20 border-yellow-400/40'
                      }`}>
                        {application.checked_in ? (
                          <svg className="w-9 h-9 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        ) : (
                          <svg className="w-9 h-9 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>

                      {/* Content */}
                      <div className="space-y-3">
                        <div>
                          <h3 className={`${terminal.className} text-2xl sm:text-3xl font-bold uppercase tracking-wide mb-2 ${
                            application.checked_in ? 'text-blue-400' : 'text-yellow-400'
                          }`}>
                            Check-In Badge
                          </h3>
                          <p className={`text-base sm:text-lg font-semibold ${
                            application.checked_in ? 'text-blue-300/90' : 'text-yellow-300/90'
                          }`}>
                            {application.checked_in ? '✓ Verified & Active' : '⏳ Pending Check-In'}
                          </p>
                        </div>
                        
                        <div className="pt-2 pb-1">
                          <div className={`h-1 w-20 rounded-full ${
                            application.checked_in
                              ? 'bg-gradient-to-r from-blue-400 to-blue-600'
                              : 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                          }`}></div>
                        </div>

                        {application.checked_in ? (
                          <>
                            <p className="text-sm sm:text-base text-rh-white/80 leading-relaxed">
                              Show this badge to organizers at the event for verification.
                            </p>

                            {/* Badge Display */}
                            <div className="mt-6 p-6 rounded-xl bg-white/5 border border-blue-400/30 backdrop-blur-sm">
                              <div className="flex flex-col items-center justify-center space-y-3">
                                {/* Large Check Icon */}
                                <div className="w-20 h-20 rounded-full bg-blue-500/30 border-4 border-blue-400 flex items-center justify-center shadow-lg">
                                  <svg className="w-12 h-12 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                
                                {/* User Info */}
                                <div className="text-center">
                                  <p className={`${terminal.className} text-xl font-bold text-blue-300 uppercase tracking-wider`}>
                                    {application.first_name} {application.last_name}
                                  </p>
                                  <p className="text-sm text-blue-200/70 mt-1">{application.school}</p>
                                </div>

                                {/* Check-in Time */}
                                <div className="pt-2 text-center">
                                  <p className="text-xs text-blue-300/60 uppercase tracking-wide mb-1">Checked In</p>
                                  <p className="text-sm text-blue-200/80 font-mono">
                                    {new Date(application.checked_in_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-sm sm:text-base text-rh-white/80 leading-relaxed">
                              You will be checked in when you arrive at the event. See you there!
                            </p>

                            {/* Placeholder Badge */}
                            <div className="mt-6 p-6 rounded-xl bg-white/5 border border-yellow-400/30 backdrop-blur-sm">
                              <div className="flex flex-col items-center justify-center space-y-3 opacity-50">
                                <div className="w-20 h-20 rounded-full bg-yellow-500/20 border-4 border-yellow-400/40 flex items-center justify-center">
                                  <svg className="w-12 h-12 text-yellow-300/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                </div>
                                <p className="text-sm text-yellow-200/60 text-center">
                                  Badge will activate upon check-in
                                </p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Decorative corner accent */}
                      <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full ${
                        application.checked_in
                          ? 'bg-gradient-to-bl from-blue-400/10 to-transparent'
                          : 'bg-gradient-to-bl from-yellow-400/10 to-transparent'
                      }`}></div>
                    </div>
                  </div>
                </div>
              )}

              {application.status === 'waitlisted' && (
                <div className="bg-rh-purple-light/10 border border-rh-purple-light/50 text-rh-purple-light px-6 py-4 rounded-xl backdrop-blur-sm">
                  <p className={`${terminal.className} font-semibold mb-2 text-lg`}>You're on the Waitlist</p>
                  <p className="text-sm text-rh-white/80">We'll notify you if a spot becomes available. Keep an eye on your email!</p>
                </div>
              )}
            </div>

            {/* Application Details */}
            <div className="glass rounded-2xl p-8" style={{ animationDelay: '0.2s' }}>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                <h2 className={`${terminal.className} text-2xl md:text-3xl font-semibold text-rh-yellow uppercase tracking-wide`}>
                  Your Application
                </h2>
                <Link
                  href="/apply"
                  className="btn-primary px-6 py-2 text-sm font-semibold"
                >
                  Edit Application
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-rh-white/90">
                <div>
                  <h3 className={`${terminal.className} text-lg font-semibold text-rh-orange uppercase tracking-wide mb-3`}>
                    Personal Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-rh-white/60">Name:</span> {application.first_name} {application.last_name}</p>
                    {application.phone_number && <p><span className="text-rh-white/60">Phone:</span> {application.phone_number}</p>}
                    {application.age && <p><span className="text-rh-white/60">Age:</span> {application.age}</p>}
                    {application.country_of_residence && <p><span className="text-rh-white/60">Country:</span> {application.country_of_residence}</p>}
                    {application.gender && <p><span className="text-rh-white/60">Gender:</span> {application.gender}</p>}
                    {application.pronouns && <p><span className="text-rh-white/60">Pronouns:</span> {application.pronouns}</p>}
                  </div>
                </div>

                <div>
                  <h3 className={`${terminal.className} text-lg font-semibold text-rh-orange uppercase tracking-wide mb-3`}>
                    Education
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-rh-white/60">School:</span> {application.school}</p>
                    {application.major && <p><span className="text-rh-white/60">Major:</span> {application.major}</p>}
                    {application.level_of_study && <p><span className="text-rh-white/60">Level:</span> {application.level_of_study}</p>}
                  </div>
                </div>

                <div>
                  <h3 className={`${terminal.className} text-lg font-semibold text-rh-orange uppercase tracking-wide mb-3`}>
                    Links
                  </h3>
                  <div className="space-y-2 text-sm">
                    {application.github_url && (
                      <p>
                        <span className="text-rh-white/60">GitHub:</span>{' '}
                        <a href={application.github_url} target="_blank" rel="noopener noreferrer" className="text-rh-yellow hover:text-rh-orange transition-colors underline">
                          {application.github_url}
                        </a>
                      </p>
                    )}
                    {application.linkedin_url && (
                      <p>
                        <span className="text-rh-white/60">LinkedIn:</span>{' '}
                        <a href={application.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-rh-yellow hover:text-rh-orange transition-colors underline">
                          {application.linkedin_url}
                        </a>
                      </p>
                    )}
                    {application.portfolio_url && (
                      <p>
                        <span className="text-rh-white/60">Portfolio:</span>{' '}
                        <a href={application.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-rh-yellow hover:text-rh-orange transition-colors underline">
                          {application.portfolio_url}
                        </a>
                      </p>
                    )}
                    {application.resume_url && (
                      <p className="flex items-center gap-3">
                        <span className="text-rh-white/60">Resume:</span>{' '}
                        <span className="flex gap-2">
                          <a 
                            href={application.resume_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-rh-yellow/10 text-rh-yellow border border-rh-yellow/30 rounded-lg hover:bg-rh-yellow/20 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </a>
                          <a 
                            href={application.resume_url} 
                            download 
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-rh-purple-light/10 text-rh-purple-light border border-rh-purple-light/30 rounded-lg hover:bg-rh-purple-light/20 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                          </a>
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className={`${terminal.className} text-lg font-semibold text-rh-orange uppercase tracking-wide mb-3`}>
                    Event Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-rh-white/60">First Hackathon:</span> {application.first_hackathon ? 'Yes' : 'No'}</p>
                    {application.team_name && <p><span className="text-rh-white/60">Team:</span> {application.team_name}</p>}
                    {application.tshirt_size && <p><span className="text-rh-white/60">T-Shirt:</span> {application.tshirt_size}</p>}
                    {application.dietary_restrictions && <p><span className="text-rh-white/60">Dietary:</span> {Array.isArray(application.dietary_restrictions) ? application.dietary_restrictions.join(', ') : application.dietary_restrictions}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass rounded-2xl p-12 text-center animate-slide-up">
            <h2 className={`${terminal.className} text-3xl md:text-4xl font-semibold gradient-text uppercase tracking-wider mb-4`}>
              No Application Found
            </h2>
            <p className="text-rh-white/70 mb-8 text-lg">You haven't submitted an application yet.</p>
            <Link
              href="/apply"
              className="btn-primary px-8 py-3 text-lg font-semibold inline-block"
            >
              Start Application
            </Link>
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/"
            className="glass rounded-xl p-6 hover:border-rh-yellow/50 transition-all duration-300 group animate-slide-up"
            style={{ animationDelay: '0.3s' }}
          >
            <h3 className={`${terminal.className} text-lg font-semibold text-rh-yellow group-hover:text-rh-orange transition-colors mb-2 uppercase tracking-wide`}>
              ← Back to Home
            </h3>
            <p className="text-rh-white/60 text-sm">Return to the main website</p>
          </Link>
          <Link
            href="/#faq"
            target="_blank"
            rel="noopener noreferrer"
            className="glass rounded-xl p-6 hover:border-rh-yellow/50 transition-all duration-300 group animate-slide-up"
            style={{ animationDelay: '0.4s' }}
          >
            <h3 className={`${terminal.className} text-lg font-semibold text-rh-yellow group-hover:text-rh-orange transition-colors mb-2 uppercase tracking-wide flex items-center gap-2`}>
              FAQs
              <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </h3>
            <p className="text-rh-white/60 text-sm">Get answers to common questions</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
