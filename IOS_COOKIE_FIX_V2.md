# iOS Magic Link Cookie Fix - Critical Update

## Problem Identified
User clicks magic link on iOS → Shows up in Supabase Auth (session created) → But cookies NOT set in Safari → User appears logged out on frontend.

## Root Cause
**Route Handlers in Next.js don't automatically set cookies** when using `cookies()` from `next/headers`. The `exchangeCodeForSession` call creates a session in Supabase's database, but the cookies never reach the user's browser because:

1. `cookies().set()` in Route Handlers is **read-only** or ineffective
2. Cookies must be explicitly set on the `NextResponse` object
3. iOS Safari requires specific cookie attributes (`SameSite=Lax`)

## The Fix (Applied)

### 1. Created New Route Handler Function
**File:** `src/lib/supabase/server.ts`

Added `createClientForRouteHandler()` that:
- Takes `NextRequest` as parameter
- Returns both `supabase` client AND `response` object
- Properly sets cookies on the `NextResponse` object
- Applies iOS-compatible cookie attributes

```typescript
export function createClientForRouteHandler(request: NextRequest) {
  // Creates response object that will capture cookies
  let response = NextResponse.next({ ... })
  
  const supabase = createServerClient(..., {
    cookies: {
      setAll(cookiesToSet) {
        // Set cookies on RESPONSE object (critical!)
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, {
            sameSite: 'lax',  // iOS Safari requirement
            secure: true,      // Production HTTPS
            path: '/',
            // ... other options
          })
        })
      }
    }
  })
  
  return { supabase, response }
}
```

### 2. Updated Auth Callback Route
**File:** `src/app/api/auth/callback/route.ts`

**Before:** Used `createClient()` which didn't set cookies properly
**After:** Uses `createClientForRouteHandler()` which:
1. Exchanges code for session (creates session in DB)
2. **Captures cookies in response object**
3. **Copies cookies to redirect response**
4. Returns response with cookies included

**Critical change:**
```typescript
// OLD - Cookies lost on redirect ❌
const supabase = await createClient()
const { data } = await supabase.auth.exchangeCodeForSession(code)
return NextResponse.redirect(url)  // Cookies not included!

// NEW - Cookies preserved ✅
const { supabase, response } = createClientForRouteHandler(request)
const { data } = await supabase.auth.exchangeCodeForSession(code)
const finalResponse = NextResponse.redirect(url)
// Copy all cookies from supabase response to redirect response
response.cookies.getAll().forEach(cookie => {
  finalResponse.cookies.set(cookie.name, cookie.value, { ... })
})
return finalResponse  // Cookies included!
```

## Why This Works

### The Cookie Flow:
1. **User clicks magic link** → Email app opens Safari
2. **Safari requests** `/api/auth/callback?code=xyz`
3. **Server exchanges code** → Supabase creates session
4. **Supabase SDK sets cookies** → Captured in `response` object
5. **Server creates redirect** → Copies cookies to new response
6. **Safari receives redirect** → WITH cookies (SameSite=Lax allows this)
7. **User lands on dashboard** → Cookies present → Authenticated ✅

### iOS Safari Cookie Requirements Met:
- ✅ `SameSite=Lax` - Allows cookies on navigation from email
- ✅ `Secure=true` - Required for production HTTPS
- ✅ `Path=/` - Cookie available site-wide
- ✅ `HttpOnly=true` - Security for auth tokens
- ✅ Cookies on `NextResponse` - Actually sent to browser

## Testing Instructions

### Deploy and Test:
1. **Deploy changes** to production/staging
2. **On iPhone**, request magic link
3. **Click link from email app**
4. **Expected result:** User is logged in ✅

### Debug If Still Not Working:

#### Check 1: Verify cookies in response
```bash
# In terminal, test the callback URL
curl -i "https://rockethacks.org/api/auth/callback?code=test"

# Look for Set-Cookie headers in response:
Set-Cookie: sb-xxxxx-auth-token=...; Path=/; SameSite=Lax; Secure; HttpOnly
```

#### Check 2: Safari Web Inspector (on Mac)
1. Connect iPhone to Mac
2. Safari → Develop → [Your iPhone] → rockethacks.org
3. Go to Network tab
4. Click magic link on iPhone
5. Check callback request → Response Headers → Set-Cookie

#### Check 3: Safari cookies (on iPhone)
1. After clicking magic link
2. Settings → Safari → Advanced → Website Data
3. Search for "rockethacks"
4. Should see: `sb-[project]-auth-token`

### Common Issues:

**Issue:** Cookies still not being set
**Solution:** Check `NEXT_PUBLIC_SITE_URL` matches deployment URL exactly

**Issue:** Cookies set but not readable
**Solution:** Verify `SameSite=Lax` (not `Strict` or `None`)

**Issue:** Works on localhost but not production
**Solution:** Ensure `secure: true` only in production (check `NODE_ENV`)

## Key Differences from Previous Fix

| Aspect | Previous Fix | This Fix |
|--------|-------------|----------|
| Cookie setting | Via `cookies().set()` | Via `response.cookies.set()` |
| Works in | Server Components | **Route Handlers** ✅ |
| Cookies included | ❌ Lost on redirect | ✅ Copied to redirect |
| iOS Safari | ⚠️ Hit or miss | ✅ Reliable |

## Environment Variables to Verify

```bash
# Production (Vercel)
NEXT_PUBLIC_SITE_URL=https://rockethacks.org
NODE_ENV=production

# These trigger secure cookies:
secure: process.env.NODE_ENV === 'production'  // true in prod
```

## Supabase Dashboard Settings

Authentication → URL Configuration:
```
Site URL: https://rockethacks.org

Redirect URLs:
- https://rockethacks.org/**
- https://rockethacks.org/api/auth/callback
```

## What Changed vs What Stayed

### Changed (for Route Handlers only):
- `src/lib/supabase/server.ts` - Added `createClientForRouteHandler()`
- `src/app/api/auth/callback/route.ts` - Uses new function, copies cookies

### Stayed the Same:
- `src/lib/supabase/client.ts` - Client-side unchanged
- `src/lib/supabase/middleware.ts` - Middleware unchanged (already correct)
- All other API routes - Use existing `createClient()` (fine for non-cookie routes)
- Server Components - Use existing `createClient()` (fine for reading)

## Success Criteria

After deployment, verify:
- ✅ iOS users can click magic links and are logged in
- ✅ Cookies visible in Safari dev tools
- ✅ Session persists after navigation
- ✅ Android still works (no regression)
- ✅ Desktop still works (no regression)
- ✅ No new errors in Vercel logs
- ✅ User sees dashboard (not login page) after clicking link

## Why Previous Fix Didn't Work

The previous fix set `SameSite=Lax` in `createClient()`, which works for:
- ✅ Server Components (reading cookies)
- ✅ Middleware (modifying existing cookies)
- ❌ **Route Handlers** (setting NEW cookies)

Route Handlers need cookies on the **response object**, not via `cookies().set()`.

## Next Steps

1. **Commit changes:**
```bash
git add .
git commit -m "fix: iOS Safari magic link cookies - use NextResponse in callback"
git push
```

2. **Test on iOS device** after deployment

3. **Monitor Vercel logs** for any auth errors

4. **Verify user reports** - iOS users should now successfully log in

This fix specifically addresses the Route Handler cookie setting issue that prevented iOS Safari from receiving session cookies. 🎯
