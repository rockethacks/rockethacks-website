'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import * as XLSX from 'xlsx'

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedApp, setSelectedApp] = useState<any>(null)
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)

  useEffect(() => {
    async function checkAdminAndLoadData() {
      // Check if user is admin
      const adminResponse = await fetch('/api/auth/user')
      const adminData = await adminResponse.json()

      if (!adminData.isAdmin) {
        router.push('/dashboard')
        return
      }

      await loadApplications()
      await loadStats()
      setLoading(false)
    }
    checkAdminAndLoadData()
  }, [])

  const loadApplications = async () => {
    const { data, error } = await supabase
      .from('applicants')
      .select('*')
      .order('submitted_at', { ascending: false })

    if (error) {
      console.error('Error loading applications:', error)
    } else {
      setApplications(data || [])
    }
  }

  const loadStats = async () => {
    const { data, error } = await supabase
      .from('application_stats')
      .select('*')

    if (error) {
      console.error('Error loading stats:', error)
    } else {
      setStats(data)
    }
  }

  const updateStatus = async (applicantId: string, newStatus: string) => {
    const { error } = await supabase
      .from('applicants')
      .update({ status: newStatus })
      .eq('id', applicantId)

    if (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    } else {
      await loadApplications()
      await loadStats()
      setSelectedApp(null)
    }
  }

  const updateRole = async (applicantId: string, newRole: string) => {
    setUpdatingRole(applicantId)

    const response = await fetch('/api/admin/roles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicant_id: applicantId,
        new_role: newRole
      })
    })

    if (response.ok) {
      await loadApplications()
      // Update selected app if it's the one being modified
      if (selectedApp && selectedApp.id === applicantId) {
        const updated = applications.find(app => app.id === applicantId)
        if (updated) setSelectedApp(updated)
      }
    } else {
      const error = await response.json()
      alert(`Error: ${error.error}`)
    }

    setUpdatingRole(null)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const filteredApplications = applications.filter(app => {
    const matchesFilter = filter === 'all' || app.status === filter
    const fullName = `${app.first_name} ${app.last_name}`.toLowerCase()
    const matchesSearch = 
      searchTerm === '' ||
      fullName.includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.school.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'accepted':
        return 'bg-green-500/20 text-green-400'
      case 'rejected':
        return 'bg-red-500/20 text-red-400'
      case 'waitlisted':
        return 'bg-blue-500/20 text-blue-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  const exportToExcel = () => {
    // Prepare data with headers
    const data = filteredApplications.map(app => ({
      'First Name': app.first_name || '',
      'Last Name': app.last_name || '',
      'Email': app.email,
      'Phone': app.phone_number || '',
      'Age': app.age || '',
      'School': app.school,
      'Major': app.major || '',
      'Level of Study': app.level_of_study || '',
      'Country': app.country_of_residence || '',
      'Gender': app.gender || '',
      'Pronouns': app.pronouns || '',
      'Status': app.status,
      'Role': app.role || 'participant',
      'First Hackathon': app.first_hackathon ? 'Yes' : 'No',
      'T-Shirt Size': app.tshirt_size || '',
      'Dietary Restrictions': Array.isArray(app.dietary_restrictions) 
        ? app.dietary_restrictions.join('; ') 
        : app.dietary_restrictions || '',
      'Race/Ethnicity': Array.isArray(app.race_ethnicity) 
        ? app.race_ethnicity.join('; ') 
        : app.race_ethnicity || '',
      'Team Name': app.team_name || '',
      'GitHub': app.github_url || '',
      'LinkedIn': app.linkedin_url || '',
      'Portfolio': app.portfolio_url || '',
      'Special Accommodations': app.special_accommodations || '',
      'Submitted At': new Date(app.submitted_at).toLocaleString()
    }))

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data)
    
    // Set column widths for better readability
    const columnWidths = [
      { wch: 15 }, // First Name
      { wch: 15 }, // Last Name
      { wch: 30 }, // Email
      { wch: 15 }, // Phone
      { wch: 8 },  // Age
      { wch: 35 }, // School
      { wch: 25 }, // Major
      { wch: 15 }, // Level of Study
      { wch: 20 }, // Country
      { wch: 12 }, // Gender
      { wch: 12 }, // Pronouns
      { wch: 12 }, // Status
      { wch: 12 }, // Role
      { wch: 15 }, // First Hackathon
      { wch: 12 }, // T-Shirt Size
      { wch: 25 }, // Dietary Restrictions
      { wch: 25 }, // Race/Ethnicity
      { wch: 20 }, // Team Name
      { wch: 30 }, // GitHub
      { wch: 30 }, // LinkedIn
      { wch: 30 }, // Portfolio
      { wch: 40 }, // Special Accommodations
      { wch: 20 }  // Submitted At
    ]
    worksheet['!cols'] = columnWidths

    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications')

    // Generate Excel file and trigger download
    const fileName = `RocketHacks_2026_Applications_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(workbook, fileName)
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Admin Portal</h1>
            <p className="text-gray-400">Manage RocketHacks 2026 applications</p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/organizer"
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-lg transition-all duration-200"
            >
              Check-In Portal
            </Link>
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
        {stats && stats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map((stat: any) => (
              <div key={stat.status} className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
                <div className={`inline-block px-3 py-1 rounded-lg text-sm font-semibold uppercase mb-2 ${getStatusColor(stat.status)}`}>
                  {stat.status}
                </div>
                <div className="text-3xl font-bold text-white">{stat.count}</div>
                <div className="text-sm text-gray-400 mt-2">
                  {stat.first_time_hackers} first-timers
                </div>
              </div>
            ))}
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
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-[#0a1628] [&>option]:text-white"
            >
              <option value="all">All Applications</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="waitlisted">Waitlisted</option>
            </select>
            <button
              onClick={exportToExcel}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-200"
            >
              Export Excel
            </button>
          </div>
          <div className="mt-4 text-sm text-gray-400">
            Showing {filteredApplications.length} of {applications.length} applications
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr className="text-left text-gray-400 text-sm uppercase tracking-wider">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">School</th>
                  <th className="px-6 py-4">Major</th>
                  <th className="px-6 py-4">Age</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Submitted</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredApplications.map((app) => (
                  <tr key={app.id} className="text-white hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold">{app.first_name} {app.last_name}</div>
                      <div className="text-sm text-gray-400">{app.email}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{app.school}</td>
                    <td className="px-6 py-4 text-gray-300">{app.major || '-'}</td>
                    <td className="px-6 py-4 text-gray-300">{app.age || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {new Date(app.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all duration-200"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredApplications.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No applications found matching your criteria.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Application Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setSelectedApp(null)}>
          <div className="bg-[#0a1628] border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white">{selectedApp.first_name} {selectedApp.last_name}</h2>
                  <p className="text-gray-400">{selectedApp.email}</p>

                  {/* Role Management */}
                  <div className="mt-4 flex items-center gap-3">
                    <label className="text-sm font-semibold text-gray-400 uppercase">User Role:</label>
                    <select
                      value={selectedApp.role || 'participant'}
                      onChange={(e) => updateRole(selectedApp.id, e.target.value)}
                      disabled={updatingRole === selectedApp.id}
                      className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-[#0a1628]"
                    >
                      <option value="participant">Participant</option>
                      <option value="organizer">Organizer</option>
                      <option value="admin">Admin</option>
                    </select>
                    {updatingRole === selectedApp.id && (
                      <span className="text-xs text-yellow-400">Updating...</span>
                    )}
                  </div>
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
                      <p>Gender: {selectedApp.gender || 'N/A'}</p>
                      <p>Pronouns: {selectedApp.pronouns || 'N/A'}</p>
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
                    <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Links</h3>
                    <div className="space-y-1 text-white">
                      {selectedApp.github_url && (
                        <p>
                          <a href={selectedApp.github_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                            GitHub →
                          </a>
                        </p>
                      )}
                      {selectedApp.linkedin_url && (
                        <p>
                          <a href={selectedApp.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                            LinkedIn →
                          </a>
                        </p>
                      )}
                      {selectedApp.portfolio_url && (
                        <p>
                          <a href={selectedApp.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                            Portfolio →
                          </a>
                        </p>
                      )}
                      {selectedApp.resume_url && (
                        <p>
                          <a href={selectedApp.resume_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                            Resume →
                          </a>
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Event Details</h3>
                    <div className="space-y-1 text-white">
                      <p>First Hackathon: {selectedApp.first_hackathon ? 'Yes' : 'No'}</p>
                      <p>Team: {selectedApp.team_name || 'N/A'}</p>
                      <p>T-Shirt: {selectedApp.tshirt_size || 'N/A'}</p>
                      <p>Dietary: {Array.isArray(selectedApp.dietary_restrictions) ? selectedApp.dietary_restrictions.join(', ') : selectedApp.dietary_restrictions || 'None'}</p>
                      <p>Race/Ethnicity: {Array.isArray(selectedApp.race_ethnicity) ? selectedApp.race_ethnicity.join(', ') : selectedApp.race_ethnicity || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedApp.special_accommodations && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Special Accommodations</h3>
                  <p className="text-white bg-white/5 p-4 rounded-lg">{selectedApp.special_accommodations}</p>
                </div>
              )}

              {selectedApp.resume_markdown && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Resume (Parsed)</h3>
                  <div className="text-white bg-white/5 p-4 rounded-lg max-h-64 overflow-y-auto prose prose-invert prose-sm">
                    <pre className="whitespace-pre-wrap text-sm">{selectedApp.resume_markdown}</pre>
                  </div>
                </div>
              )}

              {/* Status Update */}
              <div className="flex gap-4">
                <button
                  onClick={() => updateStatus(selectedApp.id, 'accepted')}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-200"
                >
                  Accept
                </button>
                <button
                  onClick={() => updateStatus(selectedApp.id, 'waitlisted')}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200"
                >
                  Waitlist
                </button>
                <button
                  onClick={() => updateStatus(selectedApp.id, 'rejected')}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200"
                >
                  Reject
                </button>
                <button
                  onClick={() => updateStatus(selectedApp.id, 'pending')}
                  className="flex-1 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition-all duration-200"
                >
                  Pending
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
