'use client'

import { useEffect, useState } from 'react'
import { TaskBoard } from '@/components/tasks/TaskBoard'

export default function OrganizerAllTasksPage() {
  const [modules, setModules] = useState<string[] | null>(null)

  useEffect(() => {
    fetch('/api/auth/user')
      .then((r) => r.json())
      .then((data) => {
        const keys: string[] = Array.isArray(data.portalKeys) ? data.portalKeys : []
        setModules(keys.filter((k) => k !== 'judging'))
      })
      .catch(() => setModules([]))
  }, [])

  if (modules === null) return null

  return <TaskBoard modules={modules} module={null} isAdmin={false} />
}
