import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refreshing the auth token
  const { data: { user } } = await supabase.auth.getUser()

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirect', '/admin')
      return NextResponse.redirect(redirectUrl)
    }

    // Check if user is admin (database role only)
    const { data: userData } = await supabase
      .from('applicants')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const isAdmin = userData?.role === 'admin'

    if (!isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Protect organizer routes
  if (request.nextUrl.pathname.startsWith('/organizer')) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirect', '/organizer')
      return NextResponse.redirect(redirectUrl)
    }

    // Check if user is organizer or admin (database role only)
    const { data: userData } = await supabase
      .from('applicants')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const isAuthorized = userData?.role === 'admin' || userData?.role === 'organizer'

    if (!isAuthorized) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Protect dashboard and apply routes
  if (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/apply')) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}
