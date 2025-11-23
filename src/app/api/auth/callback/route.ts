import { createClientForRouteHandler } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  const origin = requestUrl.origin
  const redirect = requestUrl.searchParams.get('redirect') || '/dashboard'

  if (code) {
    // Use Route Handler specific client that properly sets cookies
    const { supabase, response } = createClientForRouteHandler(request)
    
    // Exchange code for session - this MUST happen before any redirects
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      // If this is a password recovery, always go to reset-password
      if (type === 'recovery') {
        // Clone the response with cookies and redirect
        const recoveryResponse = NextResponse.redirect(`${origin}/reset-password`)
        // Copy all cookies from the supabase response
        response.cookies.getAll().forEach(cookie => {
          recoveryResponse.cookies.set(cookie.name, cookie.value, {
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: cookie.name.includes('auth-token'),
            maxAge: 60 * 60 * 24 * 7,
          })
        })
        return recoveryResponse
      }

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
          // Clone the response with cookies and redirect to apply
          const applyResponse = NextResponse.redirect(`${origin}/apply`)
          response.cookies.getAll().forEach(cookie => {
            applyResponse.cookies.set(cookie.name, cookie.value, {
              path: '/',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              httpOnly: cookie.name.includes('auth-token'),
              maxAge: 60 * 60 * 24 * 7,
            })
          })
          return applyResponse
        }
      }

      // Create final redirect response with all cookies
      const finalResponse = NextResponse.redirect(`${origin}${redirect}`)
      response.cookies.getAll().forEach(cookie => {
        finalResponse.cookies.set(cookie.name, cookie.value, {
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          httpOnly: cookie.name.includes('auth-token'),
          maxAge: 60 * 60 * 24 * 7,
        })
      })
      return finalResponse
    }
    
    console.error('Auth callback error:', error)
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
