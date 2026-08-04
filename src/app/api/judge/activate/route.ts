import { withEmailDeliveryHint } from '@/lib/emailDeliveryHint'
import { createClient } from '@/lib/supabase/server'
import { validatePassword } from '@/lib/utils/passwordValidation'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Judge account activation.
 *
 * Judges are external guests with no hacker account, so the normal signup flow
 * cannot be reused: an account may only be created for someone an organizer has
 * already invited. The invite is verified through a security definer RPC first,
 * then a standard email/password account is created. From then on judges use the
 * regular /login, forgot-password, and reset-password flows like everyone else.
 */
export async function POST(request: NextRequest) {
  const { email, inviteCode, password } = await request.json()

  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
  const cleanCode = typeof inviteCode === 'string' ? inviteCode.trim().toUpperCase() : ''

  if (!cleanEmail || !cleanCode || !password) {
    return NextResponse.json(
      { error: 'Enter the email on your invite, your invite code, and a password.' },
      { status: 400 }
    )
  }

  const passwordCheck = validatePassword(password)
  if (!passwordCheck.isValid) {
    return NextResponse.json({ error: passwordCheck.errors.join('. ') }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: isValid, error: rpcError } = await supabase.rpc('request_judge_access', {
    p_email: cleanEmail,
    p_invite_code: cleanCode,
  })

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 400 })
  }

  if (!isValid) {
    return NextResponse.json(
      {
        error:
          'That email and invite code do not match an active invite. Check with the organizers — codes expire after the event weekend.',
      },
      { status: 403 }
    )
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
  const judgeRedirect = `/judge`

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback?redirect=${encodeURIComponent(judgeRedirect)}`,
      data: {
        password_setup_completed: true,
        judge_invite_code: cleanCode,
      },
    },
  })

  // Supabase returns a user with no identities instead of an error when the
  // address is already registered, so both shapes mean "sign in instead".
  const alreadyRegistered =
    error?.code === 'user_already_exists' ||
    (error?.message || '').includes('already registered') ||
    (!!data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0)

  if (alreadyRegistered) {
    return NextResponse.json(
      {
        error:
          'An account already exists for this email. Sign in with your existing password below, or reset it from the login page.',
        accountExists: true,
      },
      { status: 409 }
    )
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (data.session) {
    return NextResponse.json({ signedIn: true })
  }

  return NextResponse.json({
    requiresConfirmation: true,
    message: withEmailDeliveryHint(
      `Account created. Confirm it from the email we sent to ${cleanEmail} and your judge access activates automatically.`
    ),
  })
}
