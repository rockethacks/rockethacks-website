'use client'

import { TaskBoard } from '@/components/tasks/TaskBoard'

export default function TeamTasksPage({ params }: { params: { team: string } }) {
  return <TaskBoard module={params.team} isAdmin={true} />
}
