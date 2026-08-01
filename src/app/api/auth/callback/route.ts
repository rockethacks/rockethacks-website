import { createClientForRouteHandler, applyCookiesToResponse } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  const origin = requestUrl.origin
  const redirect = requestUrl.searchParams.get('redirect') || '/dashboard'

  if (code) {
    // Use Route Handler specific client that captures cookies
    const { supabase, cookiesToSet } = createClientForRouteHandler(request)
    
    // Exchange code for session - this MUST complete before redirects
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      let finalRedirectPath = redirect

      // If this is a password recovery, always go to reset-password
      if (type === 'recovery' || redirect === '/reset-password') {
        finalRedirectPath = '/reset-password'
      } else if (redirect.startsWith('/judge')) {
        // Judges are guests without an application; never divert them to /apply
        finalRedirectPath = redirect
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Staff first
          const { data: organizerProfile } = await supabase
            .from('organizer_profiles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle()

          if (organizerProfile) {
            const staffHome = organizerProfile.role === 'admin' ? '/admin' : '/organizer'
            if (
              !redirect ||
              redirect === '/dashboard' ||
              redirect === '/apply' ||
              (organizerProfile.role !== 'admin' && redirect.startsWith('/admin') && !redirect.startsWith('/admin/judging'))
            ) {
              finalRedirectPath = staffHome
            } else {
              finalRedirectPath = redirect
            }
          } else {
            const { data: application, error: appError } = await supabase
              .from('applicants')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle()

            if (appError) {
              console.error('Error checking for application:', appError)
            }

            if (!application) {
              const { data: judgeProfile } = await supabase
                .from('judge_profiles')
                .select('user_id')
                .eq('user_id', user.id)
                .maybeSingle()

              if (judgeProfile) {
                finalRedirectPath = '/judge'
              } else if (redirect !== '/apply') {
                finalRedirectPath = '/apply'
              }
            }
          }
        }
      }

      // Create redirect response and apply all captured cookies
      const response = NextResponse.redirect(`${origin}${finalRedirectPath}`)
      applyCookiesToResponse(response, cookiesToSet)
      
      // Add cache control headers to prevent stale sessions on mobile
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      
      return response
    }
    
    console.error('Auth callback error:', error?.message || 'Unknown error')
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
