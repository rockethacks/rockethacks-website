import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Get current user with role information.
 * Staff RBAC: organizer_profiles. Judging: judge_profiles. Hackers: applicants row.
 */
export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({
      isAdmin: false,
      isOrganizer: false,
      isJudgingTeam: false,
      isJudge: false,
      isHeadJudge: false,
      role: 'participant',
      organizerRole: null,
      judgeRole: null,
      user: null
    })
  }

  const { data: organizerProfile } = await supabase
    .from('organizer_profiles')
    .select('role, full_name, email')
    .eq('user_id', user.id)
    .maybeSingle()

  const isAdmin = organizerProfile?.role === 'admin'
  const isJudgingTeam = organizerProfile?.role === 'judging_team' || isAdmin
  const isOrganizer = !!organizerProfile
  const organizerRole = organizerProfile?.role ?? null
  const role = organizerRole ?? 'participant'

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
    isJudgingTeam,
    isJudge,
    isHeadJudge,
    role,
    organizerRole,
    judgeRole: judgeProfile?.role ?? null,
    user: {
      id: user.id,
      email: user.email,
      full_name: organizerProfile?.full_name ?? judgeProfile?.full_name ?? null,
    }
  })
}
