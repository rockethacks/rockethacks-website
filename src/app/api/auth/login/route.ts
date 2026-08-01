import { parseAppRedirect, staffHome } from '@/lib/auth/routing'
import { withEmailDeliveryHint } from '@/lib/emailDeliveryHint'
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

    // Password login already succeeded, so they have a working password.
    // Heal any stale applicants.password_setup_completed = false (common for
    // early Magic Link accounts that later set a password outside /setup-password).
    // Never force /setup-password after a successful password sign-in.
    const { data: applicant } = await supabase
      .from('applicants')
      .select('password_setup_completed')
      .eq('user_id', data.user.id)
      .maybeSingle()

    if (applicant && applicant.password_setup_completed === false) {
      await supabase
        .from('applicants')
        .update({ password_setup_completed: true })
        .eq('user_id', data.user.id)
    }

    const { path: redirectPath, params: redirectParams } = parseAppRedirect(
      typeof redirect === 'string' ? redirect : '/dashboard'
    )
    const wantsDefault = !redirect || redirectPath === '/dashboard'
    const orgCode = (redirectParams.get('org_code') || '').trim().toUpperCase()

    // Redeem staff invite only for non-hackers. Applicants must never be pulled
    // into organizer_profiles (DB also refuses, but skip the RPC entirely).
    if (!applicant) {
      if (orgCode) {
        await supabase.rpc('redeem_organizer_invite', { p_invite_code: orgCode })
      } else {
        await supabase.rpc('redeem_pending_organizer_invite')
      }
    }
    // (errors ignored — profile lookup below decides routing)

    // Staff profiles take priority over hacker/judge homes
    const { data: organizerProfile } = await supabase
      .from('organizer_profiles')
      .select('role')
      .eq('user_id', data.user.id)
      .maybeSingle()

    if (organizerProfile) {
      return NextResponse.json({
        message: 'Login successful',
        user: data.user,
        redirect:
          wantsDefault || redirectPath === '/apply' || redirectPath === '/login'
            ? staffHome(organizerProfile.role)
            : redirectPath.startsWith('/login')
              ? staffHome(organizerProfile.role)
              : redirect,
      })
    }

    // Judges are guests with no application, so the hacker dashboard is not
    // their home. Send them to the judge portal unless they asked for somewhere
    // specific.
    if (!applicant) {
      const { data: judgeProfile } = await supabase
        .from('judge_profiles')
        .select('user_id')
        .eq('user_id', data.user.id)
        .maybeSingle()

      if (judgeProfile) {
        return NextResponse.json({
          message: 'Login successful',
          user: data.user,
          redirect: wantsDefault ? '/judge' : redirect,
        })
      }
    }

    return NextResponse.json({
      message: 'Login successful',
      user: data.user,
      redirect: wantsDefault ? '/dashboard' : redirect,
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
      message: withEmailDeliveryHint('Check your email for the login link!'),
    })
  }

  return NextResponse.json({ error: 'Invalid authentication method' }, { status: 400 })
}
