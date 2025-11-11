import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin
  const redirect = requestUrl.searchParams.get('redirect') || '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
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

      return NextResponse.redirect(`${origin}${redirect}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
