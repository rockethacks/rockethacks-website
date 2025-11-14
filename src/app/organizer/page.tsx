'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { Applicant } from '@/types/database'

export default function OrganizerPortal() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [stats, setStats] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [checkinFilter, setCheckinFilter] = useState('all')
  const [selectedApp, setSelectedApp] = useState<Applicant | null>(null)
  const [checkingIn, setCheckingIn] = useState<string | null>(null)

  useEffect(() => {
    async function checkOrganizerAndLoadData() {
      // Check if user is organizer or admin
      const authResponse = await fetch('/api/auth/user')
      const authData = await authResponse.json()

      if (!authData.isOrganizer && !authData.isAdmin) {
        router.push('/dashboard')
        return
      }

      await loadApplicants()
      await loadStats()
      setLoading(false)
    }
    checkOrganizerAndLoadData()
  }, [])

  const loadApplicants = async () => {
    // Only load accepted applicants for check-in
    const { data, error } = await supabase
      .from('applicants')
      .select('*')
      .eq('status', 'accepted')
      .order('last_name', { ascending: true })

    if (error) {
      console.error('Error loading applicants:', error)
    } else {
      setApplicants((data as Applicant[]) || [])
    }
  }

  const loadStats = async () => {
    const response = await fetch('/api/organizer/checkin')
    if (response.ok) {
      const data = await response.json()
      setStats(data.stats)
    }
  }

  const handleCheckIn = async (applicantId: string, currentStatus: boolean) => {
    setCheckingIn(applicantId)

    const response = await fetch('/api/organizer/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicant_id: applicantId,
        checked_in: !currentStatus
      })
    })

    if (response.ok) {
      await loadApplicants()
      await loadStats()
      setSelectedApp(null)
    } else {
      const error = await response.json()
      alert(`Error: ${error.error}`)
    }

    setCheckingIn(null)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const filteredApplicants = applicants.filter(app => {
    const matchesCheckin =
      checkinFilter === 'all' ||
      (checkinFilter === 'checked-in' && app.checked_in) ||
      (checkinFilter === 'not-checked-in' && !app.checked_in)

    const fullName = `${app.first_name} ${app.last_name}`.toLowerCase()
    const matchesSearch =
      searchTerm === '' ||
      fullName.includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.school.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesCheckin && matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#030c1b] via-[#0a1628] to-[#030c1b]">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030c1b] via-[#0a1628] to-[#030c1b] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Check-In Portal</h1>
            <p className="text-gray-400">RocketHacks 2026 Participant Check-In</p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-lg transition-all duration-200"
            >
              My Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-lg transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
              <div className="text-sm text-gray-400 uppercase font-semibold mb-2">Total Accepted</div>
              <div className="text-4xl font-bold text-white">{stats.total_accepted || 0}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
              <div className="text-sm text-gray-400 uppercase font-semibold mb-2">Checked In</div>
              <div className="text-4xl font-bold text-green-400">{stats.checked_in_count || 0}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
              <div className="text-sm text-gray-400 uppercase font-semibold mb-2">Not Checked In</div>
              <div className="text-4xl font-bold text-yellow-400">{stats.not_checked_in_count || 0}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
              <div className="text-sm text-gray-400 uppercase font-semibold mb-2">Check-In Rate</div>
              <div className="text-4xl font-bold text-blue-400">{stats.checkin_percentage || 0}%</div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <input
              type="text"
              placeholder="Search by name, email, or school..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={checkinFilter}
              onChange={(e) => setCheckinFilter(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-[#0a1628] [&>option]:text-white"
            >
              <option value="all">All Participants</option>
              <option value="checked-in">Checked In</option>
              <option value="not-checked-in">Not Checked In</option>
            </select>
          </div>
          <div className="mt-4 text-sm text-gray-400">
            Showing {filteredApplicants.length} of {applicants.length} accepted participants
          </div>
        </div>

        {/* Applicants Table */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr className="text-left text-gray-400 text-sm uppercase tracking-wider">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">School</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredApplicants.map((app) => (
                  <tr key={app.id} className="text-white hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold">{app.first_name} {app.last_name}</div>
                      <div className="text-sm text-gray-400">{app.school}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{app.school}</td>
                    <td className="px-6 py-4 text-gray-300 text-sm">{app.email}</td>
                    <td className="px-6 py-4">
                      {app.checked_in ? (
                        <div>
                          <span className="px-3 py-1 rounded-lg text-xs font-semibold uppercase bg-green-500/20 text-green-400">
                            ✓ Checked In
                          </span>
                          {app.checked_in_at && (
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(app.checked_in_at).toLocaleString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="px-3 py-1 rounded-lg text-xs font-semibold uppercase bg-yellow-500/20 text-yellow-400">
                          Not Checked In
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all duration-200"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleCheckIn(app.id, app.checked_in)}
                          disabled={checkingIn === app.id}
                          className={`px-4 py-2 text-white text-sm font-semibold rounded-lg transition-all duration-200 ${
                            app.checked_in
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'bg-green-600 hover:bg-green-700'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {checkingIn === app.id ? 'Processing...' : app.checked_in ? 'Undo' : 'Check In'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredApplicants.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No participants found matching your criteria.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Participant Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setSelectedApp(null)}>
          <div className="bg-[#0a1628] border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white">{selectedApp.first_name} {selectedApp.last_name}</h2>
                  <p className="text-gray-400">{selectedApp.email}</p>
                  {selectedApp.checked_in && selectedApp.checked_in_at && (
                    <p className="text-sm text-green-400 mt-2">
                      ✓ Checked in: {new Date(selectedApp.checked_in_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Personal</h3>
                    <div className="space-y-1 text-white">
                      <p>Phone: {selectedApp.phone_number || 'N/A'}</p>
                      <p>Age: {selectedApp.age || 'N/A'}</p>
                      <p>Country: {selectedApp.country_of_residence || 'N/A'}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Education</h3>
                    <div className="space-y-1 text-white">
                      <p>School: {selectedApp.school}</p>
                      <p>Major: {selectedApp.major || 'N/A'}</p>
                      <p>Level: {selectedApp.level_of_study || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Event Details</h3>
                    <div className="space-y-1 text-white">
                      <p>First Hackathon: {selectedApp.first_hackathon ? 'Yes' : 'No'}</p>
                      <p>T-Shirt: {selectedApp.tshirt_size || 'N/A'}</p>
                      <p>Dietary: {Array.isArray(selectedApp.dietary_restrictions) ? selectedApp.dietary_restrictions.join(', ') : 'None'}</p>
                    </div>
                  </div>

                  {selectedApp.special_accommodations && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Special Accommodations</h3>
                      <p className="text-white bg-white/5 p-3 rounded-lg text-sm">{selectedApp.special_accommodations}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Check-In Button */}
              <button
                onClick={() => handleCheckIn(selectedApp.id, selectedApp.checked_in)}
                disabled={checkingIn === selectedApp.id}
                className={`w-full px-6 py-4 text-white font-bold text-lg rounded-lg transition-all duration-200 ${
                  selectedApp.checked_in
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {checkingIn === selectedApp.id
                  ? 'Processing...'
                  : selectedApp.checked_in
                  ? '✗ Undo Check-In'
                  : '✓ Check In Participant'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
