'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { LoadingScreen } from '@/components/judging/ui'
import { loadSession } from '@/lib/judging/session'
import { createClient } from '@/lib/supabase/client'

type OrgTeam = {
  id: string
  name: string
  portal_key: string
  sort_order: number
}

export default function TasksAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [teams, setTeams] = useState<OrgTeam[]>([])

  const gate = useCallback(async () => {
    setError('')
    try {
      const data = await loadSession()
      if (!data.isAdmin) {
        router.push('/login')
        return
      }

      const supabase = createClient()
      const { data: rows, error: dbError } = await supabase
        .from('org_teams')
        .select('id, name, portal_key, sort_order')
        .not('portal_key', 'is', null)
        .neq('portal_key', 'judging')
        .order('sort_order')

      if (dbError) throw new Error(dbError.message)

      setTeams((rows ?? []) as OrgTeam[])
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
      <div className="px-4 py-12 flex justify-center">
        <div className="max-w-sm w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-4">
          <p className="text-white font-semibold">Cannot open the tasks portal</p>
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

  const nav = [
    { href: '/admin/tasks/all', label: 'All Teams' },
    ...teams.map((team) => ({
      href: `/admin/tasks/${team.portal_key}`,
      label: team.name,
    })),
  ]

  return (
    <div className="space-y-5 sm:space-y-6">
      <header className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">Tasks Portal</h2>
        <p className="text-sm text-gray-400">View and manage tasks across all organizer teams.</p>
      </header>

      <nav
        className="rounded-xl border border-white/10 bg-white/[0.03] p-2 sm:p-2.5"
        aria-label="Tasks sections"
      >
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold border whitespace-nowrap transition-colors duration-150 motion-reduce:transition-none ${
                  active
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="space-y-5 sm:space-y-6">{children}</div>
    </div>
  )
}
