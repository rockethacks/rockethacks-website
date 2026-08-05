export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type TaskStatus = 'open' | 'completed'

export interface Task {
  id: string
  title: string
  description: string | null
  module: string
  creator_id: string
  deadline: string | null
  priority: TaskPriority
  status: TaskStatus
  completed_at: string | null
  created_at: string
  updated_at: string
  // joined
  creator?: { full_name: string | null; email: string }
  assignees?: TaskAssignee[]
  labels?: TaskLabel[]
  comment_count?: number
  is_watching?: boolean
  is_mentioned?: boolean
}

export interface TaskAssignee {
  organizer_id: string
  full_name: string | null
  email: string
}

export interface TaskComment {
  id: string
  task_id: string
  author_id: string
  content: string
  created_at: string
  author?: { full_name: string | null; email: string }
}

export interface TaskLabel {
  id: string
  task_id: string
  label: string
}

export interface TaskNotification {
  id: string
  user_id: string
  task_id: string
  type: 'assigned' | 'commented' | 'completed' | 'watching' | 'mentioned'
  is_read: boolean
  created_at: string
}

export interface OrganizerOption {
  user_id: string
  full_name: string | null
  email: string
}
