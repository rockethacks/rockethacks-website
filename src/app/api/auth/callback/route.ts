import { createClientForRouteHandler, applyCookiesToResponse } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import {
  META_JUDGE_INVITE,
  META_STAFF_INVITE,
  parseAppRedirect,
  readInviteMeta,
  resolvePostAuthPath,
} from '@/lib/auth/routing'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  const origin = requestUrl.origin
  const redirectParam = requestUrl.searchParams.get('redirect')
  const redirect = redirectParam || '/dashboard'
  const { path: redirectPath, params: redirectParams } = parseAppRedirect(redirect)

  if (code) {
    const { supabase, cookiesToSet } = createClientForRouteHandler(request)

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      let finalRedirectPath = redirect

      if (type === 'recovery' || redirectPath === '/reset-password') {
        finalRedirectPath = '/reset-password'
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const meta = readInviteMeta(
            (user.user_metadata || {}) as Record<string, unknown>
          )
          const orgCode = (
            redirectParams.get('org_code') ||
            meta.staffCode ||
            ''
          )
            .trim()
            .toUpperCase()
          const judgeCode = (
            redirectParams.get('code') ||
            meta.judgeCode ||
            ''
          )
            .trim()
            .toUpperCase()

          const { data: existingApplicant } = await supabase
            .from('applicants')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle()

          if (!existingApplicant) {
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

            if (judgeCode) {
              await supabase.rpc('redeem_judge_invite', { p_invite_code: judgeCode })
            }
          }

          const { data: organizerProfile } = await supabase
            .from('organizer_profiles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle()

          const { data: judgeProfile } = await supabase
            .from('judge_profiles')
            .select('user_id')
            .eq('user_id', user.id)
            .maybeSingle()

          finalRedirectPath = resolvePostAuthPath({
            redirect,
            organizerRole: organizerProfile?.role ?? null,
            isApplicant: !!existingApplicant,
            isJudge: !!judgeProfile,
            staffInviteCode: orgCode || undefined,
            judgeInviteCode: judgeCode || undefined,
          })

          // Clear one-time invite metadata after a successful staff/judge redeem
          if (
            (organizerProfile || judgeProfile) &&
            (user.user_metadata?.[META_STAFF_INVITE] ||
              user.user_metadata?.[META_JUDGE_INVITE])
          ) {
            await supabase.auth.updateUser({
              data: {
                [META_STAFF_INVITE]: null,
                [META_JUDGE_INVITE]: null,
              },
            })
          }
        } else {
          // Session without user payload — never dump onto empty dashboard
          finalRedirectPath =
            redirectPath === '/dashboard' || !redirectParam ? '/apply' : redirect
        }
      }

      const response = NextResponse.redirect(`${origin}${finalRedirectPath}`)
      applyCookiesToResponse(response, cookiesToSet)

      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')

      return response
    }

    console.error('Auth callback error:', error?.message || 'Unknown error')
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
