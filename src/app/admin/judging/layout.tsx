'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { LoadingScreen } from '@/components/judging/ui'
import { loadSession } from '@/lib/judging/session'

const NAV = [
  { href: '/admin/judging', label: 'Overview', exact: true },
  { href: '/admin/judging/tracks', label: 'Tracks' },
  { href: '/admin/judging/criteria', label: 'Criteria' },
  { href: '/admin/judging/judges', label: 'Judges' },
  { href: '/admin/judging/import', label: 'CSV Import' },
  { href: '/admin/judging/assignments', label: 'Assignments' },
  { href: '/admin/judging/workload', label: 'Workload' },
  { href: '/admin/judging/results', label: 'Results' },
  { href: '/admin/judging/scorecards', label: 'Scorecards' },
  { href: '/admin/judging/audit', label: 'Audit' },
]

export default function JudgingAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')

  const gate = useCallback(async () => {
    setError('')
    try {
      const data = await loadSession()
      if (!data.isAdmin && !data.isHeadJudge) {
        router.push('/dashboard')
        return
      }
      setReady(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not verify your session.')
    }
  }, [router])

  useEffect(() => {
    gate()
  }, [gate])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#030c1b] via-[#0a1628] to-[#030c1b] px-4">
        <div className="max-w-sm w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-4">
          <p className="text-white font-semibold">Cannot open the judging portal</p>
          <p className="text-sm text-gray-400 leading-relaxed">{error}</p>
          <button
            onClick={gate}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            Try again
          </button>
          <Link href="/admin" className="block text-sm text-blue-400 hover:underline">
            Back to Admin
          </Link>
        </div>
      </div>
    )
  }

  if (!ready) {
    return <LoadingScreen message="Checking your organizer access…" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030c1b] via-[#0a1628] to-[#030c1b] py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/admin" className="text-sm text-blue-400 hover:underline">
              ← Admin
            </Link>
            <h1 className="text-3xl font-bold text-white mt-1">Judging Portal</h1>
          </div>
        </div>

        <nav className="flex flex-wrap gap-2">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  active
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {children}
      </div>
    </div>
  )
}
