import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Get check-in stats
export async function GET() {
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is organizer or admin (database role only)
  const { data: userData } = await supabase
    .from('applicants')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const isAuthorized = userData?.role === 'admin' || userData?.role === 'organizer'

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden - Organizer or Admin only' }, { status: 403 })
  }

  // Get check-in stats
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

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is organizer or admin (database role only)
  const { data: userData } = await supabase
    .from('applicants')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const isAuthorized = userData?.role === 'admin' || userData?.role === 'organizer'

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden - Organizer or Admin only' }, { status: 403 })
  }

  // Get request body
  const { applicant_id, checked_in } = await request.json()

  // Update check-in status
  const updateData: any = {
    checked_in,
    checked_in_by: user.id,
  }

  // Set or clear timestamp based on check-in status
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
