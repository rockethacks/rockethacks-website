'use client'

import { TaskBoard } from '@/components/tasks/TaskBoard'

export default function AllTasksPage() {
  return <TaskBoard module={null} isAdmin={true} />
}
