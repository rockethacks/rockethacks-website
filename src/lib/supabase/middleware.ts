import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { staffHome } from '@/lib/auth/routing'

/**
 * Middleware to refresh Supabase auth sessions
 * This runs on every request to keep the user's session valid
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            // iOS Safari fix: Ensure cookies work in cross-site context
            // Enhanced for mobile browser cookie persistence
            const cookieOptions = {
              ...options,
              sameSite: 'lax' as const, // Critical for iOS Safari
              secure: process.env.NODE_ENV === 'production',
              path: '/',
              // Extend maxAge for mobile browsers
              maxAge: options?.maxAge || 60 * 60 * 24 * 7, // 7 days default
            }
            supabaseResponse.cookies.set(name, value, cookieOptions)
          })
        },
      },
    }
  )

  // Refreshing the auth token
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Load staff profile once when needed
  async function getOrganizerProfile() {
    if (!user) return null
    const { data } = await supabase
      .from('organizer_profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()
    return data
  }

  /** Portal access via org_teams.portal_key (plus legacy judging role/name). */
  async function hasOrgPortal(portalKey: string) {
    if (!user) return false
    const organizer = await getOrganizerProfile()
    if (!organizer) return false
    if (organizer.role === 'admin') return true
    if (portalKey === 'judging' && organizer.role === 'judging_team') return true

    const { data } = await supabase
      .from('organizer_team_members')
      .select('team_id, org_teams(name, portal_key)')
      .eq('organizer_id', user.id)

    return (data || []).some((row) => {
      const team = row.org_teams as
        | { name?: string; portal_key?: string | null }
        | { name?: string; portal_key?: string | null }[]
        | null
      const teams = Array.isArray(team) ? team : team ? [team] : []
      return teams.some(
        (t) =>
          t.portal_key === portalKey ||
          (portalKey === 'judging' && t.name === 'Judging')
      )
    })
  }

  // Protect admin routes
  if (path.startsWith('/admin')) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirect', '/admin')
      return NextResponse.redirect(redirectUrl)
    }

    const organizer = await getOrganizerProfile()
    const isAdmin = organizer?.role === 'admin'
    const isJudgingTeam = await hasOrgPortal('judging')

    // Head judges and judging staff may access /admin/judging/* only
    const isJudgingPath = path.startsWith('/admin/judging')
    let isHeadJudge = false
    if (!isAdmin && isJudgingPath) {
      const { data: jp } = await supabase
        .from('judge_profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()
      isHeadJudge = jp?.role === 'head_judge'
    }

    const canAccessJudging = isAdmin || isHeadJudge || isJudgingTeam

    if (isJudgingPath) {
      if (!canAccessJudging) {
        if (organizer) {
          return NextResponse.redirect(new URL('/organizer', request.url))
        }
        return NextResponse.redirect(new URL('/login', request.url))
      }
    } else if (!isAdmin) {
      if (organizer) {
        return NextResponse.redirect(new URL('/organizer', request.url))
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Protect organizer routes
  if (path.startsWith('/organizer')) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirect', '/organizer')
      return NextResponse.redirect(redirectUrl)
    }

    const organizer = await getOrganizerProfile()
    if (!organizer) {
      // Keep session; send to login with context (invite may still need redeeming)
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirect', '/organizer')
      redirectUrl.searchParams.set('error', 'staff_access_required')
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Staff are exclusive from hacker flows
  if (path.startsWith('/dashboard') || path.startsWith('/apply')) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirect', path)
      return NextResponse.redirect(redirectUrl)
    }

    let organizer = await getOrganizerProfile()
    // Email-confirm can establish a session without password login (which normally
    // redeems a pending staff invite). Only attempt redeem for non-hackers so
    // applicant dashboard traffic is untouched.
    const { data: applicant } = await supabase
      .from('applicants')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!organizer && !applicant) {
      const meta = user.user_metadata || {}
      const staffCode =
        typeof meta.staff_invite_code === 'string'
          ? meta.staff_invite_code.trim().toUpperCase()
          : ''
      if (staffCode) {
        await supabase.rpc('redeem_organizer_invite', { p_invite_code: staffCode })
      } else {
        await supabase.rpc('redeem_pending_organizer_invite')
      }
      organizer = await getOrganizerProfile()
    }
    if (organizer) {
      return NextResponse.redirect(new URL(staffHome(organizer.role), request.url))
    }

    // Confirmed account with no application → never leave an empty dashboard
    if (path.startsWith('/dashboard') && !applicant) {
      const { data: judgeProfile } = await supabase
        .from('judge_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (judgeProfile) {
        return NextResponse.redirect(new URL('/judge', request.url))
      }
      const judgeCode =
        typeof user.user_metadata?.judge_invite_code === 'string'
          ? user.user_metadata.judge_invite_code.trim().toUpperCase()
          : ''
      if (judgeCode) {
        return NextResponse.redirect(
          new URL(`/judge/login?code=${encodeURIComponent(judgeCode)}`, request.url)
        )
      }
      const staffCode =
        typeof user.user_metadata?.staff_invite_code === 'string'
          ? user.user_metadata.staff_invite_code.trim().toUpperCase()
          : ''
      if (staffCode) {
        return NextResponse.redirect(
          new URL(`/login?org_code=${encodeURIComponent(staffCode)}`, request.url)
        )
      }
      return NextResponse.redirect(new URL('/apply', request.url))
    }
  }

  // Protect judge portal (login page is public)
  if (path.startsWith('/judge') && !path.startsWith('/judge/login')) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/judge/login'
      redirectUrl.searchParams.set('redirect', path)
      return NextResponse.redirect(redirectUrl)
    }

    const { data: judgeProfile } = await supabase
      .from('judge_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    const organizer = await getOrganizerProfile()
    const isAdmin = organizer?.role === 'admin'
    if (!judgeProfile && !isAdmin) {
      return NextResponse.redirect(new URL('/judge/login?need_invite=1', request.url))
    }
  }

  return supabaseResponse
}
