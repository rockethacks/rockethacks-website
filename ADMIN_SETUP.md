# Admin Authentication Setup Guide

## How Admin Authentication Works

The admin authentication system checks if a logged-in user's email matches any email in the `ADMIN_EMAILS` environment variable.

### Setup Steps

1. **Environment Variable Configuration**
   
   In your `.env.local` file, add:
   ```bash
   ADMIN_EMAILS=rockethacksdirectors.2025@gmail.com,admin@example.com
   ```
   
   - Multiple emails can be separated by commas
   - No spaces around commas
   - Must match exactly with the user's Supabase auth email

2. **For Development (Local)**
   
   After adding the admin email to `.env.local`:
   - Restart the Next.js development server (`npm run dev`)
   - If you're already logged in, **LOG OUT and LOG BACK IN**
   - The system will check your email against the admin list on login

3. **For Production (Vercel)**
   
   In your Vercel project settings:
   - Go to Settings → Environment Variables
   - Add `ADMIN_EMAILS` with your admin email(s)
   - Redeploy the application
   - Log out and log back in

### How to Access Admin Portal

1. **Sign in with your admin email** (e.g., rockethacksdirectors.2025@gmail.com)
2. After successful authentication, you'll be redirected to the dashboard
3. If you're an admin, you'll see an "Admin Portal" button in the header
4. Click "Admin Portal" to access the admin panel

### Troubleshooting

**Problem: I'm logged in with the admin email but don't see the Admin Portal button**

Solutions:
1. Check that `ADMIN_EMAILS` in `.env.local` matches your email EXACTLY
2. Restart the development server
3. **Log out completely** using the logout button
4. Clear your browser cookies/cache for localhost:3000
5. Log back in with the admin email
6. Check browser console for any errors

**Problem: Admin Portal redirects me back to dashboard**

Solutions:
1. Verify the email in Supabase auth matches ADMIN_EMAILS
2. Check that environment variables are loaded (restart server)
3. Look at the API response from `/api/auth/user` in Network tab

### Architecture

```
User Login → Supabase Auth
     ↓
Dashboard Page loads
     ↓
Fetches /api/auth/user
     ↓
API checks: user.email in ADMIN_EMAILS?
     ↓
Returns: { isAdmin: true/false }
     ↓
If isAdmin=true → Shows "Admin Portal" button
```

### Security Notes

- Admin access is controlled server-side via environment variables
- Row Level Security (RLS) policies in Supabase protect data
- Admin status is checked on every request to admin routes
- Never commit `.env.local` to git (already in .gitignore)

### Testing Admin Access

To test if your admin authentication is working:

1. Open browser developer tools (F12)
2. Go to Network tab
3. Navigate to `/dashboard`
4. Find the request to `/api/auth/user`
5. Check the response:
   ```json
   {
     "isAdmin": true,
     "user": {
       "id": "...",
       "email": "rockethacksdirectors.2025@gmail.com"
     }
   }
   ```

If `isAdmin` is `false`, check your environment variable configuration.
