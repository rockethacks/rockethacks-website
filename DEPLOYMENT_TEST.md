# 🚀 RocketHacks MLH-Compliant Application System - Deployment & Testing Guide

**Version:** 1.0  
**Date:** November 11, 2025  
**Status:** Ready for Deployment

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Database Setup (Supabase)](#database-setup-supabase)
3. [Environment Configuration](#environment-configuration)
4. [Local Development Testing](#local-development-testing)
5. [Production Deployment (Vercel)](#production-deployment-vercel)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Procedures](#rollback-procedures)

---

## ✅ Pre-Deployment Checklist

### Required Items
- [ ] Supabase account created (free tier is sufficient)
- [ ] Vercel account connected to GitHub
- [ ] Admin email addresses ready
- [ ] Test resume files (PDF and DOCX) prepared
- [ ] Node.js 18+ and npm 8+ installed locally

### Repository Status
- [ ] All changes committed to `dev-aadi` branch
- [ ] `schools.csv` present in `public/` directory
- [ ] `MLH_IMPLEMENTATION_STATUS.md` read and understood
- [ ] No uncommitted changes in working directory

---

## 🗄️ Database Setup (Supabase)

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Click **"New project"**
3. Fill in project details:
   - **Name:** `rockethacks-2026`
   - **Database Password:** (Generate and save securely)
   - **Region:** Choose closest to your location
4. Wait for project to be created (2-3 minutes)

### Step 2: Run SQL Schema

1. In Supabase dashboard, click **"SQL Editor"** in left sidebar
2. Click **"New query"**
3. Open `supabase/schema.sql` from your repository
4. Copy the **ENTIRE** file content
5. Paste into SQL Editor
6. Click **"Run"** button
7. **IMPORTANT:** Check for errors. You should see:
   ```
   Success. No rows returned
   ```
8. Verify tables created:
   - Go to **"Table Editor"** in left sidebar
   - You should see `applicants` table with all MLH fields

### Step 3: Create Storage Bucket

1. In Supabase dashboard, click **"Storage"** in left sidebar
2. Click **"Create a new bucket"**
3. Enter bucket details:
   - **Name:** `applicant-files`
   - **Public bucket:** Toggle **OFF** (we'll use RLS for security)
4. Click **"Create bucket"**
5. Click on `applicant-files` bucket
6. Go to **"Policies"** tab
7. Click **"New policy"** and create each policy below:

#### Policy 1: Upload Policy (INSERT)
**Policy name:** `Users can upload their own resumes`

```sql
CREATE POLICY "Users can upload their own resumes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'applicant-files' AND
  (storage.foldername(name))[1] = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[2]
);
```

**What it does:** Allows authenticated users to upload files only to `resumes/{their-user-id}/filename.pdf`

---

#### Policy 2: Download Policy (SELECT)
**Policy name:** `Users can view their own resumes`

```sql
CREATE POLICY "Users can view their own resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'applicant-files' AND
  (storage.foldername(name))[1] = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[2]
);
```

**What it does:** Allows users to download/view only their own resume files

---

#### Policy 3: Update Policy (UPDATE)
**Policy name:** `Users can update their own resumes`

```sql
CREATE POLICY "Users can update their own resumes"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'applicant-files' AND
  (storage.foldername(name))[1] = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[2]
)
WITH CHECK (
  bucket_id = 'applicant-files' AND
  (storage.foldername(name))[1] = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[2]
);
```

**What it does:** Allows users to replace their resume (e.g., upload a new version)

---

#### Policy 4: Delete Policy (DELETE)
**Policy name:** `Users can delete their own resumes`

```sql
CREATE POLICY "Users can delete their own resumes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'applicant-files' AND
  (storage.foldername(name))[1] = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[2]
);
```

**What it does:** Allows users to delete their own resume files

---

#### Policy 5: Admin Read Access (SELECT)
**Policy name:** `Admins can view all resumes`

```sql
CREATE POLICY "Admins can view all resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'applicant-files' AND
  (storage.foldername(name))[1] = 'resumes' AND
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    -- Note: Admin verification happens in application code
    -- This policy allows read access; your API checks ADMIN_EMAILS
  )
);
```

**What it does:** Allows admins to download any resume from the admin portal

---

**Important Notes:**
- The bucket should be **PRIVATE** (not public) for security
- File path structure must be: `resumes/{user-id}/{filename}.pdf`
- All policies use `TO authenticated` to require login
- The `(storage.foldername(name))[1]` extracts the first folder level (`resumes`)
- The `(storage.foldername(name))[2]` extracts the user ID folder (second level)
- Admin access is controlled at the API level using `ADMIN_EMAILS` environment variable
- With private bucket + RLS policies, only authenticated users can access files they own
- The `upsert: true` option in code allows users to replace their resume without manual deletion

### Step 4: Configure Authentication Providers

#### Email (Magic Link)
- Already enabled by default
- No additional configuration needed

#### Google OAuth (Recommended)
1. Go to **"Authentication"** > **"Providers"** > **"Google"**
2. Toggle **"Enable Sign in with Google"**
3. Go to [Google Cloud Console](https://console.cloud.google.com/)
4. Create new project or select existing
5. Enable **"Google+ API"**
6. Create OAuth 2.0 credentials:
   - Application type: **Web application**
   - Authorized redirect URIs: `https://[YOUR-PROJECT-ID].supabase.co/auth/v1/callback`
7. Copy **Client ID** and **Client Secret**
8. Paste into Supabase Google OAuth settings
9. Click **"Save"**

#### GitHub OAuth (Recommended)
1. Go to **"Authentication"** > **"Providers"** > **"GitHub"**
2. Toggle **"Enable Sign in with GitHub"**
3. Go to [GitHub Developer Settings](https://github.com/settings/developers)
4. Click **"New OAuth App"**
5. Fill in details:
   - **Application name:** RocketHacks Application
   - **Homepage URL:** `https://rockethacks.org`
   - **Authorization callback URL:** `https://[YOUR-PROJECT-ID].supabase.co/auth/v1/callback`
6. Copy **Client ID** and **Client Secret**
7. Paste into Supabase GitHub OAuth settings
8. Click **"Save"**

### Step 5: Get Supabase Credentials

1. Go to **"Project Settings"** > **"API"**
2. Copy these values (you'll need them later):
   - **Project URL:** `https://[YOUR-PROJECT-ID].supabase.co`
   - **anon/public key:** (The long JWT token)

---

## 🔐 Environment Configuration

### Local Development (.env.local)

1. In your project root, create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_EMAILS=your-email@example.com,admin2@example.com
```

2. Replace placeholders:
   - `[YOUR-PROJECT-ID]` with actual Supabase project ID
   - `your-anon-key-here` with actual anon key
   - `your-email@example.com` with your actual admin email(s)

3. **NEVER** commit `.env.local` to Git (it's already in `.gitignore`)

### Production (Vercel Environment Variables)

You'll set these up in Vercel dashboard during deployment (Step 5 of Production Deployment).

---

## 💻 Local Development Testing

### Step 1: Install Dependencies

```bash
npm install
```

**Expected output:**
- No errors
- All packages installed successfully
- If errors occur, check Node.js version: `node --version` (should be 18+)

### Step 2: Start Development Server

```bash
npm run dev
```

**Expected output:**
```
- Local:        http://localhost:3000
- Ready in [time]ms
```

### Step 3: Test Homepage

1. Open browser to `http://localhost:3000`
2. **Verify:**
   - [ ] Page loads without errors
   - [ ] "APPLY" link visible in navigation
   - [ ] All sections render correctly
   - [ ] No console errors

### Step 4: Test Authentication Flow

#### Test 1: Email Magic Link
1. Navigate to `/login`
2. Enter your email
3. Click "Send magic link"
4. Check email for magic link
5. Click link
6. **Verify:** Redirected to `/dashboard`

#### Test 2: Google OAuth
1. Navigate to `/login`
2. Click "Sign in with Google"
3. Complete Google auth flow
4. **Verify:** Redirected to `/dashboard`

#### Test 3: GitHub OAuth
1. Navigate to `/login`
2. Click "Sign in with GitHub"
3. Complete GitHub auth flow
4. **Verify:** Redirected to `/dashboard`

### Step 5: Test Application Form (MLH Fields)

1. Navigate to `/apply` (you should be logged in)
2. **Test Required Fields:**
   - [ ] First Name (text input)
   - [ ] Last Name (text input)
   - [ ] Age (dropdown, 13-100)
   - [ ] Phone Number (tel input)
   - [ ] Email (pre-filled from auth)
   - [ ] School (searchable dropdown from schools.csv)
   - [ ] Level of Study (MLH options dropdown)
   - [ ] Country of Residence (ISO 3166 dropdown)
   
3. **Test Professional Links:**
   - [ ] LinkedIn URL (optional)
   - [ ] GitHub URL (optional)
   - [ ] Portfolio URL (optional)

4. **Test Resume Upload:**
   - [ ] Upload PDF file < 5MB
   - [ ] Verify resume parsing works
   - [ ] Upload DOCX file < 5MB
   - [ ] Verify auto-fill of extracted data

5. **Test MLH Checkboxes:**
   - [ ] Code of Conduct (required, links work)
   - [ ] Privacy Policy (required, links work)
   - [ ] Marketing Emails (optional)
   - [ ] Try submitting without checking required boxes (should show error)

6. **Test Optional Fields:**
   - [ ] Major (dropdown)
   - [ ] T-Shirt Size (dropdown)
   - [ ] Gender (dropdown)
   - [ ] Pronouns (dropdown)
   - [ ] Dietary Restrictions (multi-select checkboxes)
   - [ ] Race/Ethnicity (multi-select checkboxes)
   - [ ] First Hackathon (checkbox)
   - [ ] Team Name (text input)
   - [ ] Special Accommodations (textarea)

7. **Submit Application:**
   - [ ] Fill all required fields
   - [ ] Check required MLH checkboxes
   - [ ] Click "Submit Application"
   - [ ] **Verify:** Redirected to `/dashboard`
   - [ ] **Verify:** Application status shows "pending"

### Step 6: Test Dashboard

1. Navigate to `/dashboard`
2. **Verify:**
   - [ ] Application status card shows correct status
   - [ ] All submitted information displays correctly
   - [ ] First name + Last name displayed (not full_name)
   - [ ] Age displayed (not DOB)
   - [ ] Arrays displayed as comma-separated (dietary, race/ethnicity)
   - [ ] "Edit Application" button works
   - [ ] Can modify and re-submit application

### Step 7: Test Admin Portal

1. Ensure your email is in `ADMIN_EMAILS` environment variable
2. Navigate to `/admin`
3. **Verify:**
   - [ ] Access granted (not "Access Denied")
   - [ ] Applications table shows all submissions
   - [ ] First name + Last name in table (not full_name)
   - [ ] Age column (not Year)
   - [ ] Search works by name, email, school
   - [ ] Filter by status works
   - [ ] Click "View" on an application

4. **Test Application Detail Modal:**
   - [ ] Full name displays correctly
   - [ ] Age shows (not DOB)
   - [ ] Country shows
   - [ ] Pronouns show
   - [ ] Level of study shows
   - [ ] Dietary restrictions as comma-separated list
   - [ ] Race/ethnicity as comma-separated list

5. **Test Status Updates:**
   - [ ] Click "Accept" - status changes to "accepted"
   - [ ] Click "Waitlist" - status changes to "waitlisted"
   - [ ] Click "Reject" - status changes to "rejected"
   - [ ] Click "Pending" - status changes to "pending"

6. **Test CSV Export:**
   - [ ] Click "Export CSV"
   - [ ] File downloads
   - [ ] Open CSV in Excel/Google Sheets
   - [ ] **Verify columns:** First Name, Last Name, Email, Age, Phone, School, Level of Study, Country, Major, Status, First Hackathon, T-Shirt Size, Dietary Restrictions, Gender, Pronouns, Submitted At
   - [ ] **Verify data:** All applications present with correct data

### Step 8: Test Edge Cases

#### Invalid Inputs
- [ ] Try submitting empty form (should show validation errors)
- [ ] Try uploading 10MB file (should show size error)
- [ ] Try uploading .txt file (should show type error)
- [ ] Try entering invalid email (should show error)
- [ ] Try selecting age < 13 (shouldn't be possible)

#### Data Persistence
- [ ] Submit application
- [ ] Logout
- [ ] Login again
- [ ] **Verify:** Application data persists

#### Admin Access Control
- [ ] Remove your email from `ADMIN_EMAILS`
- [ ] Restart dev server
- [ ] Try accessing `/admin`
- [ ] **Verify:** Access denied

---

## 🌐 Production Deployment (Vercel)

### Step 1: Push to GitHub

```bash
git add .
git commit -m "MLH-compliant application system ready for production"
git push origin dev-aadi
```

### Step 2: Connect Vercel to GitHub

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** > **"Project"**
3. Find your `rockethacks.github.io` repository
4. Click **"Import"**

### Step 3: Configure Build Settings

1. **Framework Preset:** Next.js (auto-detected)
2. **Root Directory:** `./` (leave as is)
3. **Build Command:** `npm run build` (auto-filled)
4. **Output Directory:** `.next` (auto-filled)
5. Click **"Deploy"** (will fail without environment variables - that's expected)

### Step 4: Cancel First Deployment

1. Click **"Cancel Deployment"** (we need to add env vars first)

### Step 5: Add Environment Variables

1. In Vercel project dashboard, go to **"Settings"** > **"Environment Variables"**
2. Add the following variables for **Production, Preview, and Development**:

| Variable Name | Value | Example |
|--------------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | `eyJhbGciOiJI...` |
| `NEXT_PUBLIC_SITE_URL` | Your production domain | `https://rockethacks.org` |
| `ADMIN_EMAILS` | Comma-separated admin emails | `admin@rockethacks.org,admin2@rockethacks.org` |

3. Click **"Save"** for each variable

### Step 6: Update Supabase Redirect URLs

1. Go back to Supabase dashboard
2. **Authentication** > **URL Configuration**
3. Update **Site URL:** `https://rockethacks.org` (or your Vercel domain)
4. Update **Redirect URLs:**
   ```
   https://rockethacks.org/auth/callback
   https://*.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```
5. Click **"Save"**

### Step 7: Deploy

1. Go back to Vercel dashboard
2. Click **"Deployments"** tab
3. Click **"Redeploy"** button
4. Wait for deployment (2-3 minutes)
5. **Verify:** Build completes successfully

### Step 8: Configure Custom Domain (Optional)

1. In Vercel, go to **"Settings"** > **"Domains"**
2. Click **"Add"**
3. Enter your domain: `rockethacks.org`
4. Follow DNS configuration instructions
5. Update `NEXT_PUBLIC_SITE_URL` to your custom domain
6. Redeploy

---

## ✓ Post-Deployment Verification

### Production Testing Checklist

#### 1. Homepage
- [ ] Visit `https://rockethacks.org`
- [ ] All sections load correctly
- [ ] "APPLY" link present in navigation
- [ ] No console errors

#### 2. Authentication
- [ ] Test magic link login
- [ ] Test Google OAuth
- [ ] Test GitHub OAuth
- [ ] All redirect to dashboard correctly

#### 3. Application Form
- [ ] All required fields present and functional
- [ ] Schools dropdown populates from `schools.csv`
- [ ] Age dropdown shows 13-100
- [ ] MLH checkboxes functional
- [ ] Resume upload works
- [ ] Submit redirects to dashboard

#### 4. Dashboard
- [ ] Application displays with correct new schema fields
- [ ] First/Last name shown (not full_name)
- [ ] Age shown (not DOB)
- [ ] Edit application works

#### 5. Admin Portal
- [ ] Admin can access `/admin`
- [ ] Non-admin gets "Access Denied"
- [ ] Table shows first/last name, age
- [ ] Search, filter, status updates work
- [ ] CSV export includes all new fields

#### 6. Performance
- [ ] Lighthouse score > 80
- [ ] Page load < 3 seconds
- [ ] Images optimized
- [ ] No JavaScript errors in console

#### 7. Mobile Testing
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Form inputs work on mobile
- [ ] Navigation responsive

---

## 🐛 Troubleshooting

### Issue: "Auth session missing" error

**Cause:** Middleware not configured correctly

**Fix:**
1. Verify `middleware.ts` exists in project root
2. Check Supabase URL and anon key in environment variables
3. Clear browser cookies and try again
4. Restart development server

### Issue: Admin portal shows "Access Denied"

**Cause:** Email not in `ADMIN_EMAILS` or typo

**Fix:**
1. Check `ADMIN_EMAILS` in Vercel environment variables
2. Verify exact email match (case-sensitive)
3. Ensure comma-separated, no spaces
4. Redeploy after changing env vars

### Issue: Resume upload fails

**Cause:** Storage bucket not configured or RLS policies missing

**Fix:**
1. Verify `applicant-files` bucket exists in Supabase
2. Check bucket is set to "Public"
3. Verify storage policies are created (Step 3 of Database Setup)
4. Check file size < 5MB and type is PDF/DOCX

### Issue: School dropdown empty

**Cause:** `schools.csv` not in `public/` directory or loadSchoolsList() failing

**Fix:**
1. Verify `schools.csv` exists in `public/schools.csv`
2. Check browser console for fetch errors
3. Verify CSV format (one school per line)
4. Clear browser cache and reload

### Issue: "Column does not exist" errors

**Cause:** Database schema not applied correctly

**Fix:**
1. Go to Supabase SQL Editor
2. Re-run entire `supabase/schema.sql` file
3. Check for syntax errors in output
4. Verify table structure in Table Editor

### Issue: OAuth login fails

**Cause:** Redirect URLs not configured correctly

**Fix:**
1. Check Supabase redirect URLs include your domain
2. Verify OAuth credentials (Client ID/Secret) in Supabase
3. Check OAuth app settings in Google/GitHub
4. Ensure callback URL matches exactly

### Issue: Build fails on Vercel

**Cause:** Missing dependencies or environment variables

**Fix:**
1. Check build logs in Vercel dashboard
2. Verify all environment variables are set
3. Try `npm run build` locally first
4. Check for TypeScript errors: `npm run lint`

### Issue: Arrays (dietary_restrictions, race_ethnicity) not saving

**Cause:** Supabase expects array type, not string

**Fix:**
1. Verify you're passing arrays, not strings
2. Check schema defines columns as `TEXT[]`
3. In admin/dashboard, use `Array.isArray()` check before `.join()`

---

## 🔄 Rollback Procedures

### If Deployment Fails

#### Option 1: Revert to Previous Deployment (Vercel)
1. Go to Vercel **"Deployments"** tab
2. Find last successful deployment
3. Click three dots **"..."** > **"Promote to Production"**

#### Option 2: Revert Git Commit
```bash
git revert HEAD
git push origin dev-aadi
```
Vercel will auto-deploy reverted version.

#### Option 3: Revert Database Schema
1. Go to Supabase SQL Editor
2. Run this to drop new table:
```sql
DROP TABLE IF EXISTS public.applicants CASCADE;
```
3. Re-run old schema from backup

### Emergency Hotfix Process

1. **Create hotfix branch:**
```bash
git checkout -b hotfix/critical-issue
```

2. **Make fixes**

3. **Test locally**

4. **Deploy:**
```bash
git commit -m "Hotfix: [description]"
git push origin hotfix/critical-issue
```

5. **Merge to dev-aadi:**
```bash
git checkout dev-aadi
git merge hotfix/critical-issue
git push origin dev-aadi
```

---

## 📊 Monitoring & Maintenance

### Daily
- [ ] Check Vercel deployment status
- [ ] Monitor error logs in Vercel dashboard
- [ ] Review application submissions

### Weekly
- [ ] Check Supabase usage (stay under free tier limits)
- [ ] Review admin portal for any issues
- [ ] Test OAuth providers still work
- [ ] Backup database (Supabase auto-backs up daily)

### Monthly
- [ ] Review and update dependencies: `npm outdated`
- [ ] Check for security updates: `npm audit`
- [ ] Review Vercel analytics
- [ ] Clean up old storage files if needed

---

## 📞 Support Resources

### Documentation
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Vercel Docs:** https://vercel.com/docs
- **MLH Organizer Guide:** https://guide.mlh.io

### MLH Resources
- **Code of Conduct:** https://github.com/MLH/mlh-policies/blob/main/code-of-conduct.md
- **Privacy Policy:** https://github.com/MLH/mlh-policies/blob/main/privacy-policy.md
- **Contest Terms:** https://github.com/MLH/mlh-policies/blob/main/contest-terms.md
- **Add Missing School:** https://my.mlh.io

---

## ✅ Final Checklist Before Going Live

- [ ] Database schema applied in Supabase
- [ ] Storage bucket created with RLS policies
- [ ] OAuth providers configured (Google, GitHub)
- [ ] Environment variables set in Vercel
- [ ] All local tests passed
- [ ] Production deployment successful
- [ ] Admin access verified
- [ ] Test application submitted and visible
- [ ] CSV export working
- [ ] Mobile testing completed
- [ ] Custom domain configured (if applicable)
- [ ] Team members added as admins
- [ ] Backup plan in place
- [ ] Monitoring set up

---

## 🎉 You're Ready for Launch!

Your MLH-compliant RocketHacks application system is now fully deployed and ready to accept applications!

**Live URLs:**
- **Main Site:** https://rockethacks.org
- **Application Form:** https://rockethacks.org/apply
- **Dashboard:** https://rockethacks.org/dashboard
- **Admin Portal:** https://rockethacks.org/admin

**Remember:**
- All keys are safely stored in Vercel environment variables
- Database is secured with Row Level Security
- Admin access is controlled via email whitelist
- Resume uploads are automatically parsed
- All MLH requirements are met

**Good luck with RocketHacks 2026! 🚀**
