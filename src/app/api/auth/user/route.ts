import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Get current user with role information.
 * Staff RBAC: organizer_profiles. Judging: judge_profiles. Hackers: applicants row.
 * Judging tab: role judging_team, admin, or membership on the Judging org team.
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
  const isOrganizer = !!organizerProfile
  const organizerRole = organizerProfile?.role ?? null
  const role = organizerRole ?? 'participant'

  let onJudgingOrgTeam = false
  if (organizerProfile && organizerProfile.role !== 'judging_team' && !isAdmin) {
    const { data: memberships } = await supabase
      .from('organizer_team_members')
      .select('team_id, org_teams(name)')
      .eq('organizer_id', user.id)

    onJudgingOrgTeam = (memberships || []).some((row) => {
      const team = row.org_teams as { name?: string } | { name?: string }[] | null
      if (Array.isArray(team)) return team.some((t) => t.name === 'Judging')
      return team?.name === 'Judging'
    })
  }

  const isJudgingTeam =
    isAdmin || organizerProfile?.role === 'judging_team' || onJudgingOrgTeam

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
