'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { StaffLoadingScreen, StaffShell } from '@/components/staff/StaffShell'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [portalKeys, setPortalKeys] = useState<string[]>([])
  const [isHeadJudgeOnly, setIsHeadJudgeOnly] = useState(false)

  const isJudgingPath = pathname.startsWith('/admin/judging')

  const gate = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/user')
      const data = await res.json()
      const admin = !!data.isAdmin
      const keys: string[] = Array.isArray(data.portalKeys) ? data.portalKeys : []
      const judgingTeam = !!data.isJudgingTeam || keys.includes('judging')
      const headJudge = !!data.isHeadJudge

      setIsAdmin(admin)
      setPortalKeys(admin ? Array.from(new Set([...keys, 'judging'])) : keys)

      if (admin) {
        setIsHeadJudgeOnly(false)
        setReady(true)
        return
      }

      if (isJudgingPath && (judgingTeam || headJudge)) {
        setIsHeadJudgeOnly(headJudge && !data.isOrganizer)
        setReady(true)
        return
      }

      if (data.isOrganizer) {
        router.replace('/organizer')
        return
      }
      router.replace('/login')
    } catch {
      router.replace('/login?redirect=/admin')
    }
  }, [router, isJudgingPath])

  useEffect(() => {
    gate()
  }, [gate])

  if (!ready) {
    return <StaffLoadingScreen />
  }

  if (!isAdmin && isHeadJudgeOnly && isJudgingPath) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#030c1b] via-[#0a1628] to-[#030c1b] py-6 px-4 sm:py-8 sm:px-6">
        <div className="max-w-7xl mx-auto">{children}</div>
      </div>
    )
  }

  return (
    <StaffShell isAdmin={isAdmin} portalKeys={portalKeys}>
      {children}
    </StaffShell>
  )
}
