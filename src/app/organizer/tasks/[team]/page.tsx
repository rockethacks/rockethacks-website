'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadSession } from '@/lib/judging/session'
import { TaskBoard } from '@/components/tasks/TaskBoard'

export default function OrganizerTeamTasksPage({ params }: { params: { team: string } }) {
  const { team } = params
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')

  const gate = useCallback(async () => {
    try {
      const data = await loadSession()
      if (!data.isOrganizer && !data.isAdmin) {
        router.push('/login')
        return
      }
      setReady(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not verify your session.')
    }
  }, [router])

  useEffect(() => { gate() }, [gate])

  if (error) {
    return (
      <div className="px-4 py-12 flex justify-center">
        <div className="max-w-sm w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-4">
          <p className="text-white font-semibold">Cannot open this portal</p>
          <p className="text-sm text-gray-400">{error}</p>
          <button onClick={gate} className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition">
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!ready) return null

  return <TaskBoard module={team} isAdmin={false} />
}
