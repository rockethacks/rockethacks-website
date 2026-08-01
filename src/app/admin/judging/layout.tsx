'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LoadingScreen } from '@/components/judging/ui'

const NAV = [
  { href: '/admin/judging', label: 'Overview', exact: true },
  { href: '/admin/judging/tracks', label: 'Tracks' },
  { href: '/admin/judging/criteria', label: 'Criteria' },
  { href: '/admin/judging/judges', label: 'Judges' },
  { href: '/admin/judging/import', label: 'CSV Import' },
  { href: '/admin/judging/assignments', label: 'Assignments' },
  { href: '/admin/judging/results', label: 'Results' },
  { href: '/admin/judging/audit', label: 'Audit' },
]

export default function JudgingAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function gate() {
      const res = await fetch('/api/auth/user')
      const data = await res.json()
      if (!data.isAdmin && !data.isHeadJudge) {
        router.push('/dashboard')
        return
      }
      setReady(true)
    }
    gate()
  }, [router])

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
