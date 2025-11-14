import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Get all users with their roles
export async function GET() {
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin (database role only)
  const { data: userData } = await supabase
    .from('applicants')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const isAdmin = userData?.role === 'admin'

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  }

  // Get all applicants with their roles
  const { data: applicants, error } = await supabase
    .from('applicants')
    .select('id, user_id, email, first_name, last_name, role')
    .order('last_name', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ applicants })
}

// Update a user's role
export async function PUT(request: Request) {
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin (database role only)
  const { data: userData } = await supabase
    .from('applicants')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const isAdmin = userData?.role === 'admin'

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  }

  // Get request body
  const { applicant_id, new_role } = await request.json()

  // Validate role
  if (!['participant', 'organizer', 'admin'].includes(new_role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  // Update the role
  const { data, error } = await supabase
    .from('applicants')
    .update({ role: new_role })
    .eq('id', applicant_id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({
    message: 'Role updated successfully',
    applicant: data
  })
}
