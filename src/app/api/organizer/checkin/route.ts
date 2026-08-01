import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function requireStaff(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: organizer } = await supabase
    .from('organizer_profiles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!organizer) {
    return { error: NextResponse.json({ error: 'Forbidden - Organizer or Admin only' }, { status: 403 }) }
  }

  return { user, organizer }
}

// Get check-in stats
export async function GET() {
  const supabase = await createClient()
  const gate = await requireStaff(supabase)
  if (gate.error) return gate.error

  const { data: stats, error: statsError } = await supabase
    .from('checkin_stats')
    .select('*')
    .single()

  if (statsError) {
    return NextResponse.json({ error: statsError.message }, { status: 400 })
  }

  return NextResponse.json({ stats })
}

// Update check-in status
export async function POST(request: Request) {
  const supabase = await createClient()
  const gate = await requireStaff(supabase)
  if (gate.error) return gate.error

  const { applicant_id, checked_in } = await request.json()

  const updateData: Record<string, unknown> = {
    checked_in,
    checked_in_by: gate.user!.id,
  }

  if (checked_in) {
    updateData.checked_in_at = new Date().toISOString()
  } else {
    updateData.checked_in_at = null
  }

  const { data, error } = await supabase
    .from('applicants')
    .update(updateData)
    .eq('id', applicant_id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({
    message: checked_in ? 'Participant checked in successfully' : 'Check-in removed',
    applicant: data
  })
}
