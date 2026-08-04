import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { OrganizerRole } from '@/types/organizer'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: organizer } = await supabase
    .from('organizer_profiles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (organizer?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 }) }
  }

  return { supabase, user }
}

/** List staff + invites */
export async function GET() {
  const gate = await requireAdmin()
  if (gate.error) return gate.error
  const { supabase } = gate

  const [profiles, invites, teams, members] = await Promise.all([
    supabase.from('organizer_profiles').select('*').order('full_name'),
    supabase.from('organizer_invites').select('*').order('created_at', { ascending: false }),
    supabase.from('org_teams').select('*').order('sort_order'),
    supabase.from('organizer_team_members').select('*'),
  ])

  return NextResponse.json({
    organizers: profiles.data || [],
    invites: invites.data || [],
    teams: teams.data || [],
    memberships: members.data || [],
    errors: {
      profiles: profiles.error?.message,
      invites: invites.error?.message,
      teams: teams.error?.message,
      members: members.error?.message,
    },
  })
}

/** Add existing auth user as staff */
export async function POST(request: Request) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error
  const { supabase } = gate

  const body = await request.json()
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const role = (body.role || 'organizer') as OrganizerRole
  const full_name = typeof body.full_name === 'string' ? body.full_name.trim() : null
  const team_assignments = Array.isArray(body.team_assignments) ? body.team_assignments : []

  // New assigns: organizer | admin. judging_team accepted only for legacy clients.
  if (!email || !['organizer', 'judging_team', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Invalid email or role' }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('add_organizer_by_email', {
    p_email: email,
    p_role: role,
    p_full_name: full_name,
    p_team_assignments: team_assignments,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ message: 'Organizer added', user_id: data })
}

/** Update role or remove staff */
export async function PUT(request: Request) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error
  const { supabase } = gate

  const { user_id, role } = await request.json()
  if (!user_id || !['organizer', 'judging_team', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('organizer_profiles')
    .update({ role })
    .eq('user_id', user_id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ organizer: data })
}

export async function DELETE(request: Request) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error
  const { supabase } = gate

  const { user_id } = await request.json()
  if (!user_id) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  }

  const { error } = await supabase.rpc('admin_purge_user', { p_user_id: user_id })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ message: 'Removed' })
}
