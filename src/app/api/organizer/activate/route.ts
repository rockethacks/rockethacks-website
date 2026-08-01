import { withEmailDeliveryHint } from '@/lib/emailDeliveryHint'
import { createClient } from '@/lib/supabase/server'
import { validatePassword } from '@/lib/utils/passwordValidation'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Organizer account activation (invite-gated signup).
 * Mirrors /api/judge/activate — staff never go through the hacker signup flow.
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

  const { data: isValid, error: rpcError } = await supabase.rpc('request_organizer_access', {
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
          'That email and invite code do not match an active staff invite. Check with an admin — codes expire.',
      },
      { status: 403 }
    )
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
  const staffRedirect = `/login?org_code=${encodeURIComponent(cleanCode)}`

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback?redirect=${encodeURIComponent(staffRedirect)}`,
      data: { password_setup_completed: true },
    },
  })

  const alreadyRegistered =
    error?.code === 'user_already_exists' ||
    (error?.message || '').includes('already registered') ||
    (!!data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0)

  if (alreadyRegistered) {
    return NextResponse.json(
      {
        error:
          'An account already exists for this email. Sign in with your existing password, or reset it from the login page.',
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
      `Account created. Confirm it from the email we sent to ${cleanEmail}, then sign in to activate your staff access.`
    ),
  })
}
