import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password, redirect } = await request.json()
  const supabase = await createClient()

  // Validate email and password
  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    )
  }

  // Check password strength (basic check)
  if (password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters long' },
      { status: 400 }
    )
  }

  // Sign up the user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`,
      data: {
        password_setup_completed: true, // New users have passwords by default
      },
    },
  })

  if (error) {
    // Check for duplicate email
    if (error.message.includes('already registered')) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.' },
        { status: 409 }
      )
    }

    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // If email confirmation is disabled (in Supabase settings), user is immediately logged in
  // If email confirmation is enabled, user needs to verify their email first
  if (data.user && data.session) {
    // User is automatically logged in (email confirmation disabled)
    return NextResponse.json({
      message: 'Account created successfully!',
      user: data.user,
      session: data.session,
    })
  } else if (data.user && !data.session) {
    // Email confirmation required
    return NextResponse.json({
      message: 'Account created! Please check your email to confirm your account.',
      requiresConfirmation: true,
      user: data.user,
    })
  }

  return NextResponse.json({
    message: 'Account created successfully!',
  })
}
