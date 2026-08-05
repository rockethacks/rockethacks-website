'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OrganizerTasksPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/organizer/tasks/all')
  }, [router])

  return null
}
