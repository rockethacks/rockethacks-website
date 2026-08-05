/** Shared post-login homes for staff roles on organizer_profiles. */
export type StaffRole = 'admin' | 'organizer' | 'judging_team' | string

export function staffHome(role: StaffRole | null | undefined): string {
  return role === 'admin' ? '/admin/team' : '/organizer/tasks'
}

/** Parse a relative redirect like `/login?org_code=ABC` into path + query. */
export function parseAppRedirect(redirect: string): {
  path: string
  params: URLSearchParams
} {
  const trimmed = (redirect || '').trim() || '/dashboard'
  const q = trimmed.indexOf('?')
  if (q < 0) return { path: trimmed, params: new URLSearchParams() }
  return {
    path: trimmed.slice(0, q) || '/',
    params: new URLSearchParams(trimmed.slice(q + 1)),
  }
}

/** Invite codes stored on auth.users raw_user_meta_data at activate signup. */
export const META_STAFF_INVITE = 'staff_invite_code'
export const META_JUDGE_INVITE = 'judge_invite_code'

export function readInviteMeta(meta: Record<string, unknown> | null | undefined): {
  staffCode: string
  judgeCode: string
} {
  const staff =
    typeof meta?.[META_STAFF_INVITE] === 'string'
      ? String(meta[META_STAFF_INVITE]).trim().toUpperCase()
      : ''
  const judge =
    typeof meta?.[META_JUDGE_INVITE] === 'string'
      ? String(meta[META_JUDGE_INVITE]).trim().toUpperCase()
      : ''
  return { staffCode: staff, judgeCode: judge }
}

/**
 * Deterministic destination after email confirm / OAuth callback.
 * Never leaves staff or brand-new accounts on an empty hacker /dashboard.
 */
export function resolvePostAuthPath(input: {
  redirect: string
  organizerRole: StaffRole | null
  isApplicant: boolean
  isJudge: boolean
  staffInviteCode?: string
  judgeInviteCode?: string
}): string {
  const redirect = (input.redirect || '').trim()
  const { path } = parseAppRedirect(redirect || '/dashboard')

  if (path === '/reset-password') return '/reset-password'

  if (input.organizerRole) {
    if (
      !redirect ||
      path === '/dashboard' ||
      path === '/apply' ||
      path === '/login' ||
      path.startsWith('/login') ||
      (input.organizerRole !== 'admin' &&
        path.startsWith('/admin') &&
        !path.startsWith('/admin/judging'))
    ) {
      return staffHome(input.organizerRole)
    }
    return redirect.startsWith('/') ? redirect : staffHome(input.organizerRole)
  }

  if (input.isApplicant) {
    if (
      path.startsWith('/admin') ||
      path.startsWith('/organizer') ||
      path.startsWith('/judge') ||
      path === '/login' ||
      path.startsWith('/login')
    ) {
      return '/dashboard'
    }
    return redirect.startsWith('/') ? redirect : '/dashboard'
  }

  if (input.isJudge || path.startsWith('/judge')) {
    if (path.startsWith('/judge')) {
      return redirect.startsWith('/') ? redirect : '/judge'
    }
    return '/judge'
  }

  // Confirmed account with no roles yet: never empty /dashboard
  if (input.staffInviteCode) {
    return `/login?org_code=${encodeURIComponent(input.staffInviteCode)}`
  }
  if (input.judgeInviteCode) {
    return `/judge/login?code=${encodeURIComponent(input.judgeInviteCode)}`
  }
  if (path === '/dashboard' || !redirect) {
    return '/apply'
  }
  if (path === '/login' || path.startsWith('/login')) {
    return '/apply'
  }
  return redirect.startsWith('/') ? redirect : '/apply'
}
