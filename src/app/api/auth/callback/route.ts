import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  const origin = requestUrl.origin
  const redirect = requestUrl.searchParams.get('redirect') || '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      // Create response with proper cookie settings for iOS Safari
      const response = NextResponse.redirect(`${origin}${redirect}`)
      
      // iOS Safari fix: Explicitly set auth cookies with correct attributes
      // This ensures cookies are saved when navigating from email client
      const cookieOptions = {
        path: '/',
        sameSite: 'lax' as const, // Critical for iOS Safari
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7, // 7 days
      }

      // Set the session cookies explicitly (Supabase creates these)
      response.cookies.set(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`, 
        JSON.stringify(data.session), 
        cookieOptions
      )

      // If this is a password recovery, always go to reset-password
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password`)
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
          return NextResponse.redirect(`${origin}/apply`)
        }
      }

      return response
    }
    
    console.error('Auth callback error:', error)
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
