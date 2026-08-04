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
  return { supabase, senderName: organizer.full_name ?? organizer.email ?? 'Admin' }
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"
const DARK = '#0a1628'
const BLUE = '#3b82f6'
const YELLOW = '#fbbf24'

function emailShell(headerContent: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:${FONT};">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
  <tr><td align="center">
    <table width="100%" style="max-width:580px;" cellpadding="0" cellspacing="0">

      <!-- Header -->
      <tr><td style="background:${DARK};border-radius:12px 12px 0 0;padding:32px 36px 28px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:${YELLOW};text-transform:uppercase;letter-spacing:0.1em;">RocketHacks 2026</p>
        ${headerContent}
      </td></tr>

      <!-- Body -->
      <tr><td style="background:#ffffff;padding:32px 36px 28px;">
        ${bodyContent}
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:${DARK};border-radius:0 0 12px 12px;padding:20px 36px;">
        <p style="margin:0;font-size:12px;color:#64748b;line-height:1.6;">
          RocketHacks 2026 &mdash; <a href="https://rockethacks.org" style="color:#60a5fa;text-decoration:none;">rockethacks.org</a>
        </p>
        <p style="margin:6px 0 0;font-size:11px;color:#475569;">
          You received this because you were invited to join RocketHacks. If this was a mistake, you can ignore this email.
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

function codeBox(code: string): string {
  return `
<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px 24px;text-align:center;">
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">Your invite code</p>
    <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:30px;font-weight:700;color:#0f172a;letter-spacing:0.18em;">${esc(code)}</p>
  </td></tr>
</table>`
}

function ctaButton(url: string, label: string): string {
  return `
<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr><td style="background:${BLUE};border-radius:8px;">
    <a href="${url}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.01em;">${label} &rarr;</a>
  </td></tr>
</table>`
}

function stepsList(steps: string[]): string {
  return `
<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
  ${steps.map((s, i) => `
  <tr>
    <td style="vertical-align:top;padding:0 12px 10px 0;width:26px;">
      <span style="display:inline-block;width:22px;height:22px;background:${DARK};border-radius:50%;font-size:11px;font-weight:700;color:#fff;text-align:center;line-height:22px;">${i + 1}</span>
    </td>
    <td style="vertical-align:top;padding:0 0 10px;font-size:14px;color:#374151;line-height:1.55;">${s}</td>
  </tr>`).join('')}
</table>`
}

function expiryNote(expiresAt: string): string {
  const date = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(expiresAt))
  const isExpired = new Date(expiresAt) < new Date()
  return `<p style="margin:20px 0 0;font-size:12px;color:${isExpired ? '#ef4444' : '#94a3b8'};border-top:1px solid #f1f5f9;padding-top:16px;">
    ${isExpired ? '⚠️ This invite has expired.' : `This invite expires on <strong>${date}</strong>.`}
  </p>`
}

// ─── Organizer Email ──────────────────────────────────────────────────────────

function buildOrganizerEmail(
  invite: { email: string; full_name: string | null; role: string; invite_code: string; expires_at: string },
  teamNames: string[],
  activationUrl: string,
): string {
  const firstName = invite.full_name?.trim().split(/\s+/)[0] ?? null
  const greeting = firstName ? `Hi ${esc(firstName)},` : 'Hi there,'

  const roleLabel = invite.role === 'admin' ? 'Admin' : invite.role === 'judging_team' ? 'Judging Team' : 'Organizer'

  const teamLine = teamNames.length > 0
    ? `<p style="margin:12px 0 0;font-size:14px;color:#374151;">You&rsquo;ll be working with the <strong>${teamNames.map(esc).join(', ')}</strong> team${teamNames.length > 1 ? 's' : ''}.</p>`
    : ''

  const header = `<h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;line-height:1.2;">You&rsquo;re on the team.</h1>
<p style="margin:10px 0 0;font-size:15px;color:#94a3b8;">Welcome to RocketHacks 2026 Staff.</p>`

  const body = `
<p style="margin:0 0 4px;font-size:16px;color:#0f172a;font-weight:600;">${greeting}</p>
<p style="margin:12px 0 0;font-size:15px;color:#374151;line-height:1.65;">
  You&rsquo;ve been invited to join the <strong>RocketHacks 2026</strong> organizing team as <strong>${esc(roleLabel)}</strong>.
  We&rsquo;re building something great this year, and we&rsquo;re glad you&rsquo;re part of it.
</p>
${teamLine}

${ctaButton(activationUrl, 'Activate your account')}

<p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">Button not working? Paste this into your browser:</p>
<p style="margin:4px 0 0;font-size:11px;color:#60a5fa;word-break:break-all;text-align:center;">${esc(activationUrl)}</p>

${codeBox(invite.invite_code)}

<p style="margin:20px 0 10px;font-size:13px;font-weight:600;color:#0f172a;">How to get started</p>
${stepsList([
  `Click the button above &mdash; it takes you directly to the activation page.`,
  `Enter your email (<strong>${esc(invite.email)}</strong>) and the invite code above.`,
  `Set a password and confirm your account via the email we send you.`,
  `Sign in at <a href="${activationUrl.split('?')[0]}" style="color:${BLUE};">${new URL(activationUrl).origin}/login</a> any time after that.`,
])}

${expiryNote(invite.expires_at)}
<p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">Questions? Find us on Slack or reply to this email.</p>`

  return emailShell(header, body)
}

// ─── Judge Email ──────────────────────────────────────────────────────────────

function buildJudgeEmail(
  invite: { email: string; full_name: string | null; role: string; invite_code: string; expires_at: string; industry: string | null; job_title: string | null; company: string | null },
  activationUrl: string,
): string {
  const firstName = invite.full_name?.trim().split(/\s+/)[0] ?? null
  const greeting = firstName ? `Hi ${esc(firstName)},` : 'Hi there,'
  const isHeadJudge = invite.role === 'head_judge'

  const proContext: string[] = []
  if (invite.job_title) proContext.push(esc(invite.job_title))
  if (invite.company) proContext.push(`at ${esc(invite.company)}`)
  if (invite.industry) proContext.push(`in ${esc(invite.industry)}`)
  const proLine = proContext.length > 0
    ? `<p style="margin:12px 0 0;font-size:14px;color:#374151;">Your experience ${proContext.join(' ')} is exactly what our teams need to build something meaningful.</p>`
    : ''

  const headJudgeLine = isHeadJudge
    ? `<p style="margin:12px 0 0;font-size:14px;color:#374151;">As a <strong>Head Judge</strong>, you&rsquo;ll help guide the overall judging process and work closely with our team leads.</p>`
    : ''

  const header = `<h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;line-height:1.2;">You&rsquo;re invited to judge.</h1>
<p style="margin:10px 0 0;font-size:15px;color:#94a3b8;">RocketHacks 2026 &mdash; ${isHeadJudge ? 'Head Judge' : 'Judge'}</p>`

  const body = `
<p style="margin:0 0 4px;font-size:16px;color:#0f172a;font-weight:600;">${greeting}</p>
<p style="margin:12px 0 0;font-size:15px;color:#374151;line-height:1.65;">
  We&rsquo;d love to have you as a <strong>${isHeadJudge ? 'Head Judge' : 'judge'}</strong> at <strong>RocketHacks 2026</strong>.
  You&rsquo;ll be evaluating student-built projects and helping us find the ones that deserve to win.
</p>
${proLine}
${headJudgeLine}

${ctaButton(activationUrl, 'Accept your invitation')}

<p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">Button not working? Paste this link into your browser:</p>
<p style="margin:4px 0 0;font-size:11px;color:#60a5fa;word-break:break-all;text-align:center;">${esc(activationUrl)}</p>

${codeBox(invite.invite_code)}

<p style="margin:20px 0 10px;font-size:13px;font-weight:600;color:#0f172a;">How it works</p>
${stepsList([
  `Click <strong>Accept your invitation</strong> above &mdash; it takes you to our judge login page.`,
  `Enter your email (<strong>${esc(invite.email)}</strong>) and the invite code above, then set a password.`,
  `Confirm your account via the email we&rsquo;ll send you.`,
  `Once confirmed, sign in at <a href="${new URL(activationUrl).origin}/judge/login" style="color:${BLUE};">${new URL(activationUrl).origin}/judge/login</a> any time.`,
  `We&rsquo;ll follow up with judging guidelines, your project assignments, and what to expect on the day.`,
])}

<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;">
  <tr><td style="padding:14px 18px;">
    <p style="margin:0;font-size:13px;color:#92400e;line-height:1.55;">
      <strong>What to expect:</strong> Judging typically takes 2&ndash;3 hours on the day of the event.
      Projects are presented in short demos. You&rsquo;ll score on criteria we&rsquo;ll share in advance.
    </p>
  </td></tr>
</table>

${expiryNote(invite.expires_at)}
<p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">Questions? Reply to this email and we&rsquo;ll get back to you.</p>`

  return emailShell(header, body)
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const gate = await requireAdmin()
  if ('authError' in gate) return gate.authError
  const { supabase } = gate

  const body = await request.json()
  const type = body.type as 'organizer' | 'judge' | undefined
  const invite_code = typeof body.invite_code === 'string' ? body.invite_code.trim().toUpperCase() : null

  if (!type || !invite_code) {
    return NextResponse.json({ error: 'type and invite_code are required' }, { status: 400 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rockethacks.org'
  const fromName = process.env.EMAIL_FROM_NAME ?? 'RocketHacks'
  const fromAddr = process.env.EMAIL_FROM ?? 'noreply@mail.rockethacks.org'

  let subject: string
  let html: string
  let toEmail: string

  if (type === 'organizer') {
    const { data: invite, error } = await supabase
      .from('organizer_invites')
      .select('email, full_name, role, invite_code, expires_at, team_assignments')
      .eq('invite_code', invite_code)
      .single()

    if (error || !invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })

    const assignments = (invite.team_assignments as Array<{ team_id: string }> | null) ?? []
    let teamNames: string[] = []
    if (assignments.length > 0) {
      const { data: teams } = await supabase
        .from('org_teams')
        .select('id, name')
        .in('id', assignments.map((a) => a.team_id))
      teamNames = (teams ?? []).map((t: { name: string }) => t.name)
    }

    const activationUrl = `${siteUrl}/login?org_code=${invite_code}`
    subject = `You're invited to the RocketHacks 2026 staff team`
    html = buildOrganizerEmail(invite, teamNames, activationUrl)
    toEmail = invite.email
  } else if (type === 'judge') {
    const { data: invite, error } = await supabase
      .from('judge_invites')
      .select('email, full_name, role, invite_code, expires_at, industry, job_title, company')
      .eq('invite_code', invite_code)
      .single()

    if (error || !invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })

    const activationUrl = `${siteUrl}/judge/login?code=${invite_code}`
    subject = `You're invited to judge at RocketHacks 2026`
    html = buildJudgeEmail(invite, activationUrl)
    toEmail = invite.email
  } else {
    return NextResponse.json({ error: 'type must be "organizer" or "judge"' }, { status: 400 })
  }

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${fromName} <${fromAddr}>`,
      to: [toEmail],
      subject,
      html,
    }),
  })

  if (!emailRes.ok) {
    const errBody = await emailRes.json().catch(() => ({}))
    console.error('[invite-email] Resend error:', errBody)
    return NextResponse.json({ error: 'Email delivery failed. Check your Resend configuration.' }, { status: 502 })
  }

  return NextResponse.json({ sent: true, to: toEmail })
}
