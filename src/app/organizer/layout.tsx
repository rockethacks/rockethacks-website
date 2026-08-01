'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { StaffLoadingScreen, StaffShell } from '@/components/staff/StaffShell'

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [canAccessJudging, setCanAccessJudging] = useState(false)

  const gate = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/user')
      const data = await res.json()

      if (!data.isOrganizer && !data.isAdmin) {
        router.replace('/login')
        return
      }

      setIsAdmin(!!data.isAdmin)
      setCanAccessJudging(!!data.isJudgingTeam || !!data.isAdmin)
      setReady(true)
    } catch {
      router.replace('/login?redirect=/organizer')
    }
  }, [router])

  useEffect(() => {
    gate()
  }, [gate])

  if (!ready) {
    return <StaffLoadingScreen message="Loading organizer portal…" />
  }

  return (
    <StaffShell
      isAdmin={isAdmin}
      canAccessJudging={canAccessJudging}
      title={isAdmin ? 'Admin Portal' : 'Organizer Portal'}
    >
      {children}
    </StaffShell>
  )
}
