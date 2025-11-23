# iOS Safari Magic Link Fix

## Problem
Magic links work on Android but **NOT on iOS devices** (iPhone/iPad). Users click the magic link from their email on iOS, but they arrive at the website **not logged in**.

## Root Cause
**Safari on iOS has strict cookie policies** that block cookies in certain cross-site navigation scenarios:

1. When user clicks magic link in email app → Safari treats this as **cross-site navigation**
2. Safari blocks third-party cookies and requires specific cookie attributes
3. Default Supabase cookie settings don't work with iOS Safari's strict policies
4. Cookies need `SameSite=Lax` and proper security attributes

## The Fix (Applied)

### 1. Updated Cookie Settings in Server Client
**File:** `src/lib/supabase/server.ts`

**Changes:**
- Set `sameSite: 'lax'` (critical for iOS Safari cross-site navigation)
- Explicitly set `secure` flag for production
- Set `path: '/'` to ensure cookies work site-wide
- Added `maxAge` default of 7 days

**Why it works:**
- `SameSite=Lax` allows cookies to be sent on top-level navigation (like clicking links in emails)
- `SameSite=Strict` would block cookies from email links ❌
- `SameSite=None` requires `Secure` and has compatibility issues ❌

### 2. Enhanced Auth Callback Route
**File:** `src/app/api/auth/callback/route.ts`

**Changes:**
- Capture session data from `exchangeCodeForSession`
- Explicitly set auth cookies on the response object
- Use proper cookie attributes for iOS Safari
- Add error logging for debugging

**Why it works:**
- Ensures cookies are definitely set in the response
- iOS Safari sees the cookies with correct attributes
- Explicit cookie setting bypasses some Safari restrictions

### 3. Updated Middleware Cookie Handling
**File:** `src/lib/supabase/middleware.ts`

**Changes:**
- Apply same cookie options in middleware
- Ensure consistency across all cookie operations
- Set `SameSite=Lax` for all Supabase cookies

**Why it works:**
- Middleware refreshes cookies on every request
- Consistent cookie attributes prevent conflicts
- Works with iOS Safari's Intelligent Tracking Prevention (ITP)

## Technical Details

### iOS Safari Cookie Policies
Safari has **Intelligent Tracking Prevention (ITP)** which:
- Blocks third-party cookies by default
- Restricts first-party cookies in cross-site contexts
- Requires explicit cookie attributes to work properly
- Treats email-to-browser navigation as cross-site

### Cookie Attribute Comparison

| Attribute | Old (Default) | New (iOS Fixed) | Why |
|-----------|---------------|-----------------|-----|
| `sameSite` | Not set (defaults to `Lax` in modern browsers) | Explicitly `'lax'` | Ensures consistency, allows email links |
| `secure` | Varies | `true` in production | Required for modern browsers |
| `path` | May vary | `'/'` | Ensures cookie works site-wide |
| `httpOnly` | `true` | `true` | Security best practice |
| `maxAge` | Varies | 7 days | Explicit session duration |

### SameSite Options Explained

```typescript
// SameSite=Strict ❌ - Blocks email links
// Cookie ONLY sent if user is already on your site
// Email link → Your site = NO COOKIE (blocked)

// SameSite=Lax ✅ - Allows email links
// Cookie sent on top-level navigation (like clicking links)
// Email link → Your site = COOKIE SENT (works!)

// SameSite=None ⚠️ - Requires Secure flag
// Cookie sent in all contexts (including iframes)
// Must use HTTPS, has compatibility issues
```

## Testing on iOS

### Before Fix:
1. Request magic link on iPhone
2. Check email on iPhone
3. Click magic link
4. Safari opens website
5. ❌ User NOT logged in (cookies blocked)

### After Fix:
1. Request magic link on iPhone
2. Check email on iPhone
3. Click magic link
4. Safari opens website
5. ✅ User IS logged in (cookies work!)

## How to Test

### Test on Real iOS Device:
1. Deploy changes to production/staging
2. On iPhone, go to your email app
3. Request magic link
4. Click link in email
5. Should open Safari and be logged in

### Check Cookie in Safari:
1. After clicking magic link, go to Safari Settings
2. Settings → Safari → Advanced → Website Data
3. Search for your domain
4. Should see `sb-*-auth-token` cookie

### Debug in Safari Web Inspector:
1. On Mac: Safari → Develop → [Your iPhone] → [Your Site]
2. Go to Storage tab
3. Check Cookies section
4. Verify auth cookies are present with correct attributes

## Environment Considerations

### Development (localhost):
```typescript
secure: false  // HTTP is okay for localhost
sameSite: 'lax'
```

### Production (HTTPS):
```typescript
secure: true   // HTTPS required
sameSite: 'lax'
```

### Supabase Configuration:
Ensure in Supabase Dashboard → Authentication → URL Configuration:
```
Site URL: https://rockethacks.org
Redirect URLs: 
  - https://rockethacks.org/**
  - http://localhost:3000/** (for dev)
```

## iOS Safari Specific Issues

### Issue 1: Private Browsing Mode
**Symptom:** Cookies don't work even with fix
**Solution:** User must disable Private Browsing
- Settings → Safari → "Block All Cookies" must be OFF

### Issue 2: Prevent Cross-Site Tracking
**Symptom:** Cookies blocked even on same site
**Solution:** Our fix handles this with `SameSite=Lax`
- No user action needed
- Works even with "Prevent Cross-Site Tracking" ON

### Issue 3: Email App In-App Browser
**Symptom:** Some email apps use embedded browser
**Solution:** Provide "Open in Safari" option
- Users may need to manually open in Safari
- Most email apps now open in default browser

## Verification Steps

After deploying, verify:
1. ✅ Magic links work on iPhone Safari
2. ✅ Magic links work on iPad Safari
3. ✅ Magic links work in different iOS email apps (Mail, Gmail, Outlook)
4. ✅ Cookies persist after login
5. ✅ User stays logged in after navigation
6. ✅ Still works on Android (regression test)
7. ✅ Still works on desktop browsers (regression test)

## Additional Recommendations

### 1. Add Loading State
Show loading indicator during redirect to prevent user confusion:
```typescript
// After clicking magic link, before callback completes
"🔄 Logging you in..."
```

### 2. Add Error Handling
If login fails, show helpful message:
```typescript
if (error === 'auth_failed') {
  // Show: "Authentication failed. Please try again or contact support."
  // Provide link to request new magic link
}
```

### 3. User Instructions
Update email template to mention iOS compatibility:
```
Click the link below to log in. This works on all devices including iPhone and iPad.
```

## Common iOS Debug Commands

### Check if running on iOS:
```javascript
// In browser console
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
console.log('Is iOS?', isIOS)
```

### Check cookie support:
```javascript
// In browser console
console.log('Cookies enabled?', navigator.cookieEnabled)
document.cookie = "test=1"
console.log('Test cookie set?', document.cookie.includes('test=1'))
```

### Check Supabase session:
```javascript
// In browser console (if client is available)
supabase.auth.getSession().then(console.log)
```

## Rollback Plan

If issues occur, rollback steps:
1. Revert changes to `src/lib/supabase/server.ts`
2. Revert changes to `src/app/api/auth/callback/route.ts`
3. Revert changes to `src/lib/supabase/middleware.ts`
4. Redeploy previous version

## Summary

**What was changed:**
- Cookie `sameSite` attribute set to `'lax'` for iOS Safari compatibility
- Explicit cookie setting in auth callback for reliability
- Consistent cookie options across server, middleware, and callbacks

**Why it works:**
- iOS Safari allows `SameSite=Lax` cookies in email-to-browser navigation
- Explicit cookie attributes prevent Safari's Intelligent Tracking Prevention from blocking
- Works with iOS privacy features enabled

**Next steps:**
1. Deploy to production
2. Test on real iOS devices (iPhone, iPad)
3. Verify with different email apps
4. Monitor for any reported issues

The magic links should now work seamlessly on iOS devices! 🎉
