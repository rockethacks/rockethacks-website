'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { HelpTip, LoadingScreen } from '@/components/judging/ui'
import { loadSession } from '@/lib/judging/session'
import { NAV_TIPS } from '@/lib/judging/tips'

const NAV = [
  { href: '/admin/judging', label: 'Overview', exact: true },
  { href: '/admin/judging/tracks', label: 'Tracks' },
  { href: '/admin/judging/criteria', label: 'Criteria' },
  { href: '/admin/judging/judges', label: 'Judges' },
  { href: '/admin/judging/import', label: 'CSV Import' },
  { href: '/admin/judging/assignments', label: 'Assignments' },
  { href: '/admin/judging/tables', label: 'Tables' },
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
    <div className="min-h-screen bg-gradient-to-br from-[#030c1b] via-[#0a1628] to-[#030c1b] py-6 px-4 sm:py-8 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6">
        <header className="space-y-3">
          <Link
            href="/admin"
            className="inline-block text-sm text-blue-400 hover:text-blue-300 hover:underline"
          >
            ← Admin
          </Link>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              Judging Portal
            </h1>
            <HelpTip
              text="Day-of order: Tracks → Criteria → Judges → CSV Import → Assignments → Tables → Workload → (judges score) → Results / Scorecards. Hover any tab or ? for what it means."
              label="About the judging portal"
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="text-gray-300 font-medium">Visit</span>
              <HelpTip tip="visit" />
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-gray-300 font-medium">Sheet</span>
              <HelpTip tip="sheet" />
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-gray-300 font-medium">Window</span>
              <HelpTip tip="window" />
            </span>
          </div>
        </header>

        <nav
          className="rounded-xl border border-white/10 bg-white/[0.03] p-2 sm:p-2.5"
          aria-label="Judging sections"
        >
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {NAV.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
              const tip = NAV_TIPS[item.href]
              return (
                <span key={item.href} className="relative group/nav inline-flex">
                  <Link
                    href={item.href}
                    title={tip}
                    className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold border whitespace-nowrap transition-colors duration-150 motion-reduce:transition-none ${
                      active
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </Link>
                  {tip && (
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute left-0 top-full z-50 mt-2 w-60 max-w-[min(15rem,calc(100vw-2rem))] rounded-lg border border-white/15 bg-[#0a1628] px-3 py-2 text-left text-xs font-normal leading-relaxed text-gray-200 opacity-0 shadow-lg transition-opacity duration-150 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100 motion-reduce:transition-none"
                    >
                      {tip}
                    </span>
                  )}
                </span>
              )
            })}
          </div>
        </nav>

        <div className="space-y-5 sm:space-y-6">{children}</div>
      </div>
    </div>
  )
}
