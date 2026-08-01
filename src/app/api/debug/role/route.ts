import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Debug endpoint to check user role information
 */
export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({
      error: 'Not authenticated',
      user: null,
    })
  }

  const { data: organizerProfile, error: orgError } = await supabase
    .from('organizer_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: applicantData, error: dbError } = await supabase
    .from('applicants')
    .select('id, email, status, password_setup_completed')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: judgeProfile } = await supabase
    .from('judge_profiles')
    .select('role, email, full_name')
    .eq('user_id', user.id)
    .maybeSingle()

  const isAdmin = organizerProfile?.role === 'admin'
  const isOrganizer = !!organizerProfile

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    },
    organizerProfile,
    orgError,
    applicantData,
    dbError,
    judgeProfile,
    computed: {
      role: organizerProfile?.role ?? 'participant',
      isAdmin,
      isOrganizer
    }
  }, { status: 200 })
}
