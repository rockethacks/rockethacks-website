'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { terminal } from '../fonts/fonts'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [application, setApplication] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function loadData() {
      // Get user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirect=/dashboard')
        return
      }
      setUser(user)
      
      // DEBUG: Log the current user ID
      console.log('🔍 Dashboard - Current user ID:', user.id)
      console.log('🔍 Dashboard - Current user email:', user.email)

      // Check if user is admin
      const adminResponse = await fetch('/api/auth/user')
      const adminData = await adminResponse.json()
      setIsAdmin(adminData.isAdmin)

      // Get application
      const { data: app, error } = await supabase
        .from('applicants')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error('❌ Dashboard - Error loading application:', error)
      } else {
        console.log('📋 Dashboard - Application found:', app ? 'YES' : 'NO')
        if (app) {
          console.log('📋 Dashboard - Application ID:', app.id)
          console.log('📋 Dashboard - Application user_id:', app.user_id)
        }
        setApplication(app)
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
                <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-6 py-4 rounded-xl backdrop-blur-sm">
                  <p className={`${terminal.className} font-semibold mb-2 text-lg`}>🎉 Congratulations! You've been accepted!</p>
                  <p className="text-sm text-rh-white/80">Check your email for next steps and important information about the event.</p>
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
                      <p>
                        <span className="text-rh-white/60">Resume:</span>{' '}
                        <a href={application.resume_url} target="_blank" rel="noopener noreferrer" className="text-rh-yellow hover:text-rh-orange transition-colors underline">
                          View Resume
                        </a>
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
            href="/#schedule"
            className="glass rounded-xl p-6 hover:border-rh-yellow/50 transition-all duration-300 group animate-slide-up"
            style={{ animationDelay: '0.4s' }}
          >
            <h3 className={`${terminal.className} text-lg font-semibold text-rh-yellow group-hover:text-rh-orange transition-colors mb-2 uppercase tracking-wide`}>
              Event Schedule
            </h3>
            <p className="text-rh-white/60 text-sm">View the hackathon timeline</p>
          </Link>
          <Link
            href="/#faq"
            className="glass rounded-xl p-6 hover:border-rh-yellow/50 transition-all duration-300 group animate-slide-up"
            style={{ animationDelay: '0.5s' }}
          >
            <h3 className={`${terminal.className} text-lg font-semibold text-rh-yellow group-hover:text-rh-orange transition-colors mb-2 uppercase tracking-wide`}>
              FAQs
            </h3>
            <p className="text-rh-white/60 text-sm">Get answers to common questions</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
