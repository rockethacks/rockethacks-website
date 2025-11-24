import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password, authMode, provider, redirect } = await request.json()
  const supabase = await createClient()

  const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`

  // Support multiple OAuth providers
  if (provider && provider !== 'email') {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as 'google' | 'github',
      options: {
        redirectTo: redirectUrl,
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ url: data.url })
  }

  // Password-based login
  if (authMode === 'password' && password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Check if user exists but no password set
      if (error.message.includes('Invalid login credentials')) {
        // Try to check if user exists with Magic Link history
        return NextResponse.json(
          {
            error: 'Invalid email or password. If you signed up with Magic Link, please use that option or set up a password first.',
          },
          { status: 401 }
        )
      }

      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Check if user needs to set up password (existing Magic Link users)
    const { data: applicant } = await supabase
      .from('applicants')
      .select('password_setup_completed')
      .eq('user_id', data.user.id)
      .maybeSingle()

    // If user has never set up a password, redirect to setup page
    if (applicant && applicant.password_setup_completed === false) {
      return NextResponse.json({
        redirect: `/setup-password?redirect=${encodeURIComponent(redirect || '/dashboard')}`,
      })
    }

    return NextResponse.json({
      message: 'Login successful',
      user: data.user,
    })
  }

  // Magic Link login (email OTP)
  if (authMode === 'magic-link' || (!password && !authMode)) {
    // Send magic link with shouldCreateUser: false to prevent new account creation
    // Supabase will handle checking if the user exists in auth.users
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
        shouldCreateUser: false, // Prevent creating new users via magic link
      },
    })

    if (error) {
      // If user doesn't exist, Supabase will return an error
      if (error.message.includes('User not found') || error.message.includes('Signups not allowed')) {
        return NextResponse.json(
          {
            error: 'No account found with this email. Please sign up first to create an account.',
          },
          { status: 404 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      message: 'Check your email for the login link!',
    })
  }

  return NextResponse.json({ error: 'Invalid authentication method' }, { status: 400 })
}
