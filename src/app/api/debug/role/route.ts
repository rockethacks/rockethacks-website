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
      applicantData: null
    })
  }

  // Get user's full applicant record
  const { data: applicantData, error: dbError } = await supabase
    .from('applicants')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const dbRole = applicantData?.role || 'participant'
  const isAdmin = dbRole === 'admin'
  const isOrganizer = dbRole === 'organizer' || isAdmin

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    },
    applicantData: applicantData,
    dbError: dbError,
    computed: {
      role: dbRole,
      isAdmin,
      isOrganizer
    }
  }, { status: 200 })
}
