/** Shared post-login homes for staff roles on organizer_profiles. */
export type StaffRole = 'admin' | 'organizer' | 'judging_team' | string

export function staffHome(role: StaffRole | null | undefined): '/admin' | '/organizer' {
  return role === 'admin' ? '/admin' : '/organizer'
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
