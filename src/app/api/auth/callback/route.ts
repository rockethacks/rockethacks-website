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
      if (type === 'recovery') {
        finalRedirectPath = '/reset-password'
      } else {
        // Get user data to check if they have an application
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Check if user has an application - use maybeSingle() to avoid errors
          const { data: application, error: appError } = await supabase
            .from('applicants')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle()

          if (appError) {
            console.error('Error checking for application:', appError)
          }

          // If no application exists and not going to apply page, redirect to apply
          if (!application && redirect !== '/apply') {
            finalRedirectPath = '/apply'
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
