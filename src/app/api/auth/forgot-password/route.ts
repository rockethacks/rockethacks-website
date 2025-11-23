import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email } = await request.json()
  const supabase = await createClient()

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  // Check if user exists in our database first
  const { data: existingApplicant } = await supabase
    .from('applicants')
    .select('user_id, email')
    .eq('email', email)
    .maybeSingle()

  // Only send reset email if user exists
  if (existingApplicant) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback?redirect=/reset-password`,
    })

    if (error) {
      console.error('Password reset error:', error.message)
    }
  }

  // Always return success to prevent email enumeration attacks
  return NextResponse.json({
    message: 'If an account with that email exists, we sent a password reset link.',
  })
}
