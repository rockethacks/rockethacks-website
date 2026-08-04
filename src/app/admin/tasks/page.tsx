import { redirect } from 'next/navigation'

export default function TasksRoot() {
  redirect('/admin/tasks/all')
}
