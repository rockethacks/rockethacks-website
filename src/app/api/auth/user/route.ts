import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Get current user with role information
 */
export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({
      isAdmin: false,
      isOrganizer: false,
      isJudge: false,
      isHeadJudge: false,
      role: 'participant',
      judgeRole: null,
      user: null
    })
  }

  // Applicant role (hackers / organizers / admins)
  const { data: applicantData } = await supabase
    .from('applicants')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  const dbRole = applicantData?.role || 'participant'

  const isAdmin = dbRole === 'admin'
  const isOrganizer = dbRole === 'organizer' || isAdmin

  // Judge membership is separate from applicants.role
  const { data: judgeProfile } = await supabase
    .from('judge_profiles')
    .select('role, full_name')
    .eq('user_id', user.id)
    .maybeSingle()

  const isJudge = !!judgeProfile || isAdmin
  const isHeadJudge = judgeProfile?.role === 'head_judge' || isAdmin

  return NextResponse.json({
    isAdmin,
    isOrganizer,
    isJudge,
    isHeadJudge,
    role: dbRole,
    judgeRole: judgeProfile?.role ?? null,
    user: {
      id: user.id,
      email: user.email,
      full_name: judgeProfile?.full_name ?? null,
    }
  })
}
