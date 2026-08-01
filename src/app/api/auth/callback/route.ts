import { createClientForRouteHandler, applyCookiesToResponse } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import { parseAppRedirect, staffHome } from '@/lib/auth/routing'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  const origin = requestUrl.origin
  const redirect = requestUrl.searchParams.get('redirect') || '/dashboard'
  const { path: redirectPath, params: redirectParams } = parseAppRedirect(redirect)

  if (code) {
    // Use Route Handler specific client that captures cookies
    const { supabase, cookiesToSet } = createClientForRouteHandler(request)

    // Exchange code for session - this MUST complete before redirects
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      let finalRedirectPath = redirect

      // If this is a password recovery, always go to reset-password
      if (type === 'recovery' || redirectPath === '/reset-password') {
        finalRedirectPath = '/reset-password'
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          // Hackers with an application are never staff/judge-redeemed here.
          const { data: existingApplicant } = await supabase
            .from('applicants')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle()

          if (!existingApplicant) {
            // Staff invite: redeem with org_code when present, otherwise any pending
            // invite for this email. Always try pending when not a hacker — email
            // confirm links often drop org_code and land on /dashboard.
            const orgCode = (redirectParams.get('org_code') || '').trim().toUpperCase()
            if (orgCode) {
              const { error: redeemErr } = await supabase.rpc('redeem_organizer_invite', {
                p_invite_code: orgCode,
              })
              if (redeemErr) {
                await supabase.rpc('redeem_pending_organizer_invite')
              }
            } else {
              await supabase.rpc('redeem_pending_organizer_invite')
            }

            // Judge invite email-confirm (code only travels on judge redirects)
            const judgeCode = (redirectParams.get('code') || '').trim().toUpperCase()
            if (judgeCode && redirectPath.startsWith('/judge')) {
              await supabase.rpc('redeem_judge_invite', { p_invite_code: judgeCode })
            }
          }
          // Redeem RPC failures are non-fatal; profile checks below decide the destination.

          const { data: organizerProfile } = await supabase
            .from('organizer_profiles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle()

          if (organizerProfile) {
            const home = staffHome(organizerProfile.role)
            if (
              !redirect ||
              redirectPath === '/dashboard' ||
              redirectPath === '/apply' ||
              redirectPath === '/login' ||
              redirectPath.startsWith('/login') ||
              (organizerProfile.role !== 'admin' &&
                redirectPath.startsWith('/admin') &&
                !redirectPath.startsWith('/admin/judging'))
            ) {
              finalRedirectPath = home
            } else {
              finalRedirectPath = redirect
            }
          } else if (existingApplicant) {
            // Applicant stays in hacker flows. Never send them to staff/judge portals.
            if (
              redirectPath.startsWith('/admin') ||
              redirectPath.startsWith('/organizer') ||
              redirectPath.startsWith('/judge') ||
              redirectPath === '/login' ||
              redirectPath.startsWith('/login')
            ) {
              finalRedirectPath = '/dashboard'
            } else {
              finalRedirectPath = redirect
            }
          } else if (redirectPath.startsWith('/judge')) {
            // Keep judge activate/sign-in redirects intact (never divert to /apply)
            finalRedirectPath = redirect
          } else {
            const { data: judgeProfile } = await supabase
              .from('judge_profiles')
              .select('user_id')
              .eq('user_id', user.id)
              .maybeSingle()

            if (judgeProfile) {
              finalRedirectPath = '/judge'
            } else if (redirectPath === '/login' || redirectPath.startsWith('/login')) {
              // Preserve staff login/redeem links; never force hacker /apply
              finalRedirectPath = redirect
            } else if (redirectPath !== '/apply') {
              // Brand-new account with no application yet → start apply flow
              finalRedirectPath = '/apply'
            }
          }
        }
      }

      // Create redirect response and apply all captured cookies
      const response = NextResponse.redirect(`${origin}${finalRedirectPath}`)
      applyCookiesToResponse(response, cookiesToSet)

      // Add cache control headers to prevent stale sessions on mobile
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')

      return response
    }

    console.error('Auth callback error:', error?.message || 'Unknown error')
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
