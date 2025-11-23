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
 * Critical for iOS Safari magic link authentication
 */
export function createClientForRouteHandler(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Set cookies on both the request and response
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            // iOS Safari fix: Set cookies with proper attributes
            const cookieOptions = {
              ...options,
              sameSite: 'lax' as const, // Critical for iOS Safari
              secure: process.env.NODE_ENV === 'production',
              path: '/',
              maxAge: options?.maxAge || 60 * 60 * 24 * 7, // 7 days
            }
            response.cookies.set(name, value, cookieOptions)
          })
        },
      },
    }
  )

  return { supabase, response }
}
