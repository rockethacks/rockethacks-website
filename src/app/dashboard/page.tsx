'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

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
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      case 'accepted':
        return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/50'
      case 'waitlisted':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#030c1b] via-[#0a1628] to-[#030c1b]">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030c1b] via-[#0a1628] to-[#030c1b] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-gray-400">Welcome back, {user?.email}</p>
          </div>
          <div className="flex gap-4">
            {isAdmin && (
              <Link
                href="/admin"
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all duration-200"
              >
                Admin Portal
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-lg transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Application Status */}
        {application ? (
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-2">Application Status</h2>
                  <p className="text-gray-400">Submitted on {new Date(application.submitted_at).toLocaleDateString()}</p>
                </div>
                <span className={`px-4 py-2 rounded-lg border font-semibold uppercase text-sm ${getStatusColor(application.status)}`}>
                  {application.status}
                </span>
              </div>

              {application.status === 'pending' && (
                <div className="bg-blue-500/10 border border-blue-500/50 text-blue-400 px-4 py-3 rounded-lg">
                  <p className="font-semibold mb-1">Application Under Review</p>
                  <p className="text-sm">We're reviewing your application. You'll receive an email once a decision is made.</p>
                </div>
              )}

              {application.status === 'accepted' && (
                <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg">
                  <p className="font-semibold mb-1">🎉 Congratulations! You've been accepted!</p>
                  <p className="text-sm">Check your email for next steps and important information about the event.</p>
                </div>
              )}

              {application.status === 'waitlisted' && (
                <div className="bg-blue-500/10 border border-blue-500/50 text-blue-400 px-4 py-3 rounded-lg">
                  <p className="font-semibold mb-1">You're on the Waitlist</p>
                  <p className="text-sm">We'll notify you if a spot becomes available. Keep an eye on your email!</p>
                </div>
              )}
            </div>

            {/* Application Details */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-white">Your Application</h2>
                <Link
                  href="/apply"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200"
                >
                  Edit Application
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Personal Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-400">Name:</span> {application.first_name} {application.last_name}</p>
                    {application.phone_number && <p><span className="text-gray-400">Phone:</span> {application.phone_number}</p>}
                    {application.age && <p><span className="text-gray-400">Age:</span> {application.age}</p>}
                    {application.country_of_residence && <p><span className="text-gray-400">Country:</span> {application.country_of_residence}</p>}
                    {application.gender && <p><span className="text-gray-400">Gender:</span> {application.gender}</p>}
                    {application.pronouns && <p><span className="text-gray-400">Pronouns:</span> {application.pronouns}</p>}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Education</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-400">School:</span> {application.school}</p>
                    {application.major && <p><span className="text-gray-400">Major:</span> {application.major}</p>}
                    {application.level_of_study && <p><span className="text-gray-400">Level:</span> {application.level_of_study}</p>}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Links</h3>
                  <div className="space-y-2 text-sm">
                    {application.github_url && (
                      <p>
                        <span className="text-gray-400">GitHub:</span>{' '}
                        <a href={application.github_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                          {application.github_url}
                        </a>
                      </p>
                    )}
                    {application.linkedin_url && (
                      <p>
                        <span className="text-gray-400">LinkedIn:</span>{' '}
                        <a href={application.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                          {application.linkedin_url}
                        </a>
                      </p>
                    )}
                    {application.portfolio_url && (
                      <p>
                        <span className="text-gray-400">Portfolio:</span>{' '}
                        <a href={application.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                          {application.portfolio_url}
                        </a>
                      </p>
                    )}
                    {application.resume_url && (
                      <p>
                        <span className="text-gray-400">Resume:</span>{' '}
                        <a href={application.resume_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                          View Resume
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Event Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-400">First Hackathon:</span> {application.first_hackathon ? 'Yes' : 'No'}</p>
                    {application.team_name && <p><span className="text-gray-400">Team:</span> {application.team_name}</p>}
                    {application.tshirt_size && <p><span className="text-gray-400">T-Shirt:</span> {application.tshirt_size}</p>}
                    {application.dietary_restrictions && <p><span className="text-gray-400">Dietary:</span> {Array.isArray(application.dietary_restrictions) ? application.dietary_restrictions.join(', ') : application.dietary_restrictions}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">No Application Found</h2>
            <p className="text-gray-400 mb-6">You haven't submitted an application yet.</p>
            <Link
              href="/apply"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200"
            >
              Start Application
            </Link>
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/"
            className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-200"
          >
            <h3 className="text-lg font-semibold text-white mb-2">← Back to Home</h3>
            <p className="text-gray-400 text-sm">Return to the main website</p>
          </Link>
          <Link
            href="/schedule"
            className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-200"
          >
            <h3 className="text-lg font-semibold text-white mb-2">Event Schedule</h3>
            <p className="text-gray-400 text-sm">View the hackathon timeline</p>
          </Link>
          <Link
            href="/faq"
            className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-200"
          >
            <h3 className="text-lg font-semibold text-white mb-2">FAQs</h3>
            <p className="text-gray-400 text-sm">Get answers to common questions</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
