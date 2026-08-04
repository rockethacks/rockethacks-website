import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Get current user with role information.
 * Staff RBAC: organizer_profiles. Portal tabs: org_teams.portal_key via membership.
 * Judging tab: admin, portal_key=judging, legacy judging_team role, or head_judge.
 */
export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({
      isAdmin: false,
      isOrganizer: false,
      isJudgingTeam: false,
      isJudge: false,
      isHeadJudge: false,
      portalKeys: [] as string[],
      role: 'participant',
      organizerRole: null,
      judgeRole: null,
      user: null,
    })
  }

  let { data: organizerProfile } = await supabase
    .from('organizer_profiles')
    .select('role, full_name, email')
    .eq('user_id', user.id)
    .maybeSingle()

  // Session established without going through /api/auth/callback (e.g. GoTrue
  // redirected straight to the Site URL) can leave a pending invite un-redeemed.
  // Redeem it here so any caller of this route (dropdown, login page) picks up
  // the correct role immediately instead of only after visiting /dashboard.
  if (!organizerProfile) {
    const { data: applicant } = await supabase
      .from('applicants')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!applicant) {
      const meta = user.user_metadata || {}
      const staffCode =
        typeof meta.staff_invite_code === 'string' ? meta.staff_invite_code.trim().toUpperCase() : ''
      const judgeCode =
        typeof meta.judge_invite_code === 'string' ? meta.judge_invite_code.trim().toUpperCase() : ''

      if (staffCode) {
        await supabase.rpc('redeem_organizer_invite', { p_invite_code: staffCode })
      } else {
        await supabase.rpc('redeem_pending_organizer_invite')
      }
      if (judgeCode) {
        await supabase.rpc('redeem_judge_invite', { p_invite_code: judgeCode })
      }

      const { data: refreshed } = await supabase
        .from('organizer_profiles')
        .select('role, full_name, email')
        .eq('user_id', user.id)
        .maybeSingle()
      organizerProfile = refreshed
    }
  }

  const isAdmin = organizerProfile?.role === 'admin'
  const isOrganizer = !!organizerProfile
  const organizerRole = organizerProfile?.role ?? null
  const role = organizerRole ?? 'participant'

  const portalKeys = new Set<string>()
  if (organizerProfile) {
    const { data: memberships } = await supabase
      .from('organizer_team_members')
      .select('team_id, org_teams(name, portal_key)')
      .eq('organizer_id', user.id)

    for (const row of memberships || []) {
      const team = row.org_teams as
        | { name?: string; portal_key?: string | null }
        | { name?: string; portal_key?: string | null }[]
        | null
      const teams = Array.isArray(team) ? team : team ? [team] : []
      for (const t of teams) {
        if (t.portal_key) portalKeys.add(t.portal_key)
        // Legacy: Judging name before portal_key backfill
        if (t.name === 'Judging') portalKeys.add('judging')
      }
    }

    if (organizerProfile.role === 'judging_team') {
      portalKeys.add('judging')
    }
  }

  if (isAdmin) {
    portalKeys.add('judging')
  }

  const portalKeyList = Array.from(portalKeys)
  const isJudgingTeam = isAdmin || portalKeyList.includes('judging')

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
    portalKeys: portalKeyList,
    role,
    organizerRole,
    judgeRole: judgeProfile?.role ?? null,
    user: {
      id: user.id,
      email: user.email,
      full_name: organizerProfile?.full_name ?? judgeProfile?.full_name ?? null,
    },
  })
}
