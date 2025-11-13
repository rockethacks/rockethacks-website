import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Check if the current user is an admin
 */
export async function GET() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ isAdmin: false, user: null })
  }

  // Check if user's email is in the admin list
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || []
  const isAdmin = adminEmails.includes(user.email || '')

  return NextResponse.json({ 
    isAdmin, 
    user: {
      id: user.id,
      email: user.email,
    }
  })
}
