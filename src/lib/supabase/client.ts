import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for client-side (browser) usage
 * This should be used in Client Components only
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
