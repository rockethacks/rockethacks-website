import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email } = await request.json()
  const supabase = await createClient()

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  // Send password reset email
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  })

  if (error) {
    // Don't reveal if email exists or not for security reasons
    // Still return success to prevent email enumeration
    console.error('Password reset error:', error.message)
  }

  // Always return success to prevent email enumeration attacks
  return NextResponse.json({
    message: 'If an account with that email exists, we sent a password reset link.',
  })
}
