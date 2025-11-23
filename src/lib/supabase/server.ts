import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Creates a Supabase client for server-side usage (Server Components, Server Actions)
 * Properly handles cookies for authentication state
 * iOS Safari compatibility: Sets cookies with SameSite=Lax for cross-site navigation
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // iOS Safari fix: Ensure cookies work in cross-site context (email → browser)
              const cookieOptions = {
                ...options,
                sameSite: 'lax' as const, // Critical for iOS Safari magic links
                secure: process.env.NODE_ENV === 'production', // Only secure in production
                path: '/',
                maxAge: options.maxAge || 60 * 60 * 24 * 7, // 7 days default
              }
              cookieStore.set(name, value, cookieOptions)
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Creates a Supabase client specifically for Route Handlers
 * This version properly sets cookies on the NextResponse object
 * Critical for iOS Safari magic link authentication with enhanced mobile cookie persistence
 */
export function createClientForRouteHandler(request: NextRequest) {
  // Store cookies that will be set
  const cookiesToSet: Array<{ name: string; value: string; options: any }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookies) {
          // Capture all cookies that need to be set
          cookies.forEach(cookie => {
            cookiesToSet.push(cookie)
          })
        },
      },
    }
  )

  return { supabase, cookiesToSet }
}

/**
 * Apply cookies to a NextResponse with mobile-optimized settings
 * Ensures maximum compatibility with iOS Safari and mobile browsers
 */
export function applyCookiesToResponse(
  response: NextResponse,
  cookies: Array<{ name: string; value: string; options?: any }>
) {
  cookies.forEach(({ name, value, options }) => {
    // Enhanced cookie options for mobile devices (iOS 17+ compatibility)
    const cookieOptions = {
      ...options,
      sameSite: 'lax' as const, // Critical for iOS Safari cross-site navigation
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      path: '/', // Available site-wide
      httpOnly: name.includes('auth-token') || name.includes('access-token'), // Security for auth tokens
      maxAge: options?.maxAge || 60 * 60 * 24 * 7, // 7 days default
      // Priority hint for browsers (high = important to keep)
      priority: 'high' as any,
    }
    
    response.cookies.set(name, value, cookieOptions)
  })
  
  return response
}
