import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { authError: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { data: organizer } = await supabase
    .from('organizer_profiles')
    .select('role, full_name, email')
    .eq('user_id', user.id)
    .maybeSingle()

  if (organizer?.role !== 'admin') return { authError: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { supabase, organizer: organizer as { role: string; full_name: string | null; email: string } }
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const PRIORITY_HEX: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#9ca3af',
}

function buildEmail(
  task: { title: string; description: string | null; module: string; priority: string; deadline: string | null; status: string },
  comments: Array<{ content: string; created_at: string; author: { full_name: string | null; email: string } | null }>,
  senderName: string,
  customMessage: string | null,
): string {
  const pc = PRIORITY_HEX[task.priority] ?? '#9ca3af'
  const moduleLabel = task.module.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const isOverdue = task.deadline && new Date(task.deadline) < new Date()
  const deadlineLabel = task.deadline
    ? new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(task.deadline))
    : null

  const customBlock = customMessage ? `
    <div style="background:#eff6ff;border-radius:8px;padding:16px 18px;margin-bottom:20px;border:1px solid #bfdbfe;">
      <p style="font-size:11px;font-weight:600;color:#3b82f6;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 6px 0;">Message from ${escHtml(senderName)}</p>
      <p style="font-size:14px;color:#1e40af;margin:0;line-height:1.6;white-space:pre-wrap;">${escHtml(customMessage)}</p>
    </div>` : ''

  const descBlock = task.description ? `
    <p style="font-size:14px;color:#374151;line-height:1.65;white-space:pre-wrap;margin:0 0 20px 0;">${escHtml(task.description)}</p>` : ''

  const commentItems = comments.map((c) => {
    const name = c.author?.full_name ?? c.author?.email ?? 'Organizer'
    const date = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(c.created_at))
    return `
      <div style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
        <p style="font-size:11px;color:#9ca3af;margin:0 0 4px 0;font-weight:500;">${escHtml(name)} · ${date}</p>
        <p style="font-size:14px;color:#374151;margin:0;line-height:1.55;white-space:pre-wrap;">${escHtml(c.content)}</p>
      </div>`
  }).join('')

  const commentsBlock = comments.length > 0 ? `
    <div style="margin-top:20px;">
      <p style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px 0;">Comments (${comments.length})</p>
      ${commentItems}
    </div>` : ''

  const deadlineBadge = deadlineLabel ? `
    <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:${isOverdue ? '#fee2e2' : '#f3f4f6'};color:${isOverdue ? '#b91c1c' : '#374151'};">${isOverdue ? 'Overdue · ' : ''}${deadlineLabel}</span>` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
  <tr><td align="center">
    <table width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08),0 4px 16px rgba(0,0,0,0.06);">
      <tr><td style="background:#0a1628;padding:22px 28px 20px;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#60a5fa;text-transform:uppercase;letter-spacing:0.06em;">RocketHacks · Task Reminder</p>
        <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;line-height:1.3;">${escHtml(task.title)}</h1>
      </td></tr>
      <tr><td style="padding:24px 28px 28px;">
        ${customBlock}
        <div style="margin-bottom:18px;display:flex;flex-wrap:wrap;gap:6px;">
          <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.03em;background:${pc}20;color:${pc};">${escHtml(task.priority)}</span>
          <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:#fef3c7;color:#92400e;">${escHtml(moduleLabel)}</span>
          ${deadlineBadge}
        </div>
        ${descBlock}
        ${commentsBlock}
        <div style="margin-top:24px;padding-top:18px;border-top:1px solid #e5e7eb;">
          <p style="font-size:12px;color:#9ca3af;margin:0;">Sent by <strong style="color:#6b7280;">${escHtml(senderName)}</strong> via the RocketHacks Organizer Portal.</p>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

export async function POST(request: Request) {
  const gate = await requireAdmin()
  if ('authError' in gate) return gate.authError

  const { supabase, organizer } = gate
  const body = await request.json()
  const taskId = typeof body.taskId === 'string' ? body.taskId : null
  const customMessage = typeof body.message === 'string' && body.message.trim() ? body.message.trim() : null

  if (!taskId) return NextResponse.json({ error: 'taskId required' }, { status: 400 })

  const { data: task, error: taskErr } = await supabase
    .from('tasks')
    .select('id, title, description, module, priority, deadline, status')
    .eq('id', taskId)
    .single()

  if (taskErr || !task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  const { data: assigneeRows } = await supabase
    .from('task_assignees')
    .select('organizer_profiles(full_name, email)')
    .eq('task_id', taskId)

  const assignees = ((assigneeRows ?? []) as unknown as Array<{ organizer_profiles: { full_name: string | null; email: string } | null }>)
    .map((r) => r.organizer_profiles)
    .filter(Boolean) as Array<{ full_name: string | null; email: string }>

  if (assignees.length === 0) {
    return NextResponse.json({ error: 'This task has no assignees to remind.' }, { status: 400 })
  }

  const { data: commentRows } = await supabase
    .from('task_comments')
    .select('content, created_at, author:organizer_profiles!author_id(full_name, email)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  const comments = (commentRows ?? []) as unknown as Array<{
    content: string
    created_at: string
    author: { full_name: string | null; email: string } | null
  }>

  const senderName = organizer.full_name ?? organizer.email
  const html = buildEmail(task, comments, senderName, customMessage)
  const to = assignees.map((a) => a.email)

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${process.env.EMAIL_FROM_NAME ?? 'RocketHacks'} <${process.env.EMAIL_FROM ?? 'noreply@mail.rockethacks.org'}>`,
      to,
      subject: `[RocketHacks] Reminder: ${task.title}`,
      html,
    }),
  })

  if (!emailRes.ok) {
    const errBody = await emailRes.json().catch(() => ({}))
    console.error('[remind] Resend error:', errBody)
    return NextResponse.json({ error: 'Email delivery failed. Check your Resend configuration.' }, { status: 502 })
  }

  return NextResponse.json({ sent: to.length })
}
