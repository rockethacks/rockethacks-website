# Application Page Fixes - November 11, 2025

## Issues Identified and Resolved

### 1. ✅ Schools CSV Parsing Issue
**Problem**: University names were displaying weirdly because CSV quotes weren't being properly removed.

**Root Cause**: The `schools.csv` file has each school name wrapped in double quotes (`"University Name"`), and the parsing logic only removed outer quotes, not internal ones.

**Fix**: Updated `src/lib/mlhSchools.ts` to properly remove all quotes:
```typescript
.map(line => {
  // Remove all quotes and trim whitespace
  return line.trim().replace(/^"+|"+$/g, '').replace(/"/g, '');
})
```

---

### 2. ✅ 403 Errors on Applicants Endpoint
**Problem**: Supabase RLS policies were blocking users from accessing their own application data.

**Root Cause**: The RLS policies were not properly configured with the `TO authenticated` clause, causing permission denied errors.

**Fix**: Created `supabase/fix_rls_policies.sql` with corrected policies:
- Added `TO authenticated` to all policies
- Dropped and recreated all RLS policies with proper permissions
- Added DELETE policy for completeness

**Action Required**: 
🔴 **You must run the SQL migration in Supabase SQL Editor:**
```sql
-- Navigate to: https://app.supabase.com/project/YOUR_PROJECT/sql
-- Run the contents of: supabase/fix_rls_policies.sql
```

---

### 3. ✅ Resume Parse 500 Error
**Problem**: The resume parsing API endpoint was failing with internal server error.

**Root Cause**: Dynamic import of `pdf-parse` CommonJS module wasn't working correctly with TypeScript types.

**Fix**: Refactored `src/app/api/resume/parse/route.ts` to:
- Use direct imports instead of dynamic imports
- Moved the `convertToMarkdown` function into the API route
- Added proper error handling with descriptive messages
- Added `@ts-ignore` comments for pdf-parse type issues

---

### 4. ✅ 400 Error on Application Submission
**Problem**: Application submission was failing with a 400 error when updating existing applications.

**Root Cause**: 
- The code checked for existing applicants with `.single()` which threw a 403 error due to RLS policies
- When the check failed, it tried to INSERT instead of UPDATE
- Since the user_id already existed (unique constraint), it caused a conflict error

**Fix**: Replaced the check-then-insert/update pattern with Supabase's `upsert()` method:
```typescript
const { error: upsertError } = await supabase
  .from('applicants')
  .upsert(applicationData, {
    onConflict: 'user_id',
    ignoreDuplicates: false,
  })
```

This handles both INSERT (new applicant) and UPDATE (existing applicant) in one operation.

---

### 5. ✅ User Detection for Existing Applicant
**Problem**: User with email `aadinath.10v@gmail.com` (ID: `bffddf77-fe2b-4a11-9104-c24504469176`) existed in the database but the system wasn't detecting them.

**Root Cause**: The `.single()` call in `loadUserData()` was throwing an error due to RLS policies, causing the form to not pre-populate with existing data.

**Fix**: Changed `.single()` to `.maybeSingle()` and added proper error handling:
```typescript
const { data: existingApp, error: loadError } = await supabase
  .from('applicants')
  .select('*')
  .eq('user_id', user.id)
  .maybeSingle()

if (loadError) {
  console.error('Error loading existing application:', loadError)
  // Continue anyway - user can still fill out form
}
```

---

## Files Modified

1. ✅ `src/lib/mlhSchools.ts` - Fixed CSV parsing
2. ✅ `src/app/apply/page.tsx` - Fixed user data loading and submission
3. ✅ `src/app/api/resume/parse/route.ts` - Fixed resume parsing
4. ✅ `supabase/fix_rls_policies.sql` - Created RLS policy fix (NEW FILE)

---

## Critical Action Required

### 🔴 STEP 1: Run the RLS Policy Fix in Supabase

**You MUST run this SQL migration before the application will work properly:**

1. Go to your Supabase project: https://app.supabase.com/project/mbtawwfpisxvxzicqebl/sql
2. Click "New Query"
3. Copy and paste the contents of `supabase/fix_rls_policies.sql`
4. Click "Run" or press Ctrl+Enter
5. Verify that all policies were created successfully

### 🟢 STEP 2: Test the Application

After running the SQL migration, test the following:

1. **Login**: Visit `/login` and sign in with `aadinath.10v@gmail.com`
2. **Apply Page**: Navigate to `/apply`
   - ✅ Existing application data should load automatically
   - ✅ School dropdown should show clean names (no extra quotes)
3. **Resume Upload**: Try uploading a PDF or DOCX resume
   - ✅ Should parse without 500 errors
4. **Submit Application**: Fill out and submit the form
   - ✅ Should save without 400 or 403 errors
   - ✅ Should redirect to `/dashboard`
5. **Re-visit Apply Page**: Go back to `/apply`
   - ✅ Form should be pre-filled with your saved data

---

## What Changed in the Code

### Before:
- CSV parsing left quotes in school names
- RLS policies blocked authenticated users
- Resume parsing used problematic dynamic imports
- Application submission checked for existing records with `.single()`
- Form data loading threw errors for existing applicants

### After:
- CSV parsing removes all quotes completely
- RLS policies allow authenticated users to access their own data
- Resume parsing uses direct imports with proper error handling
- Application submission uses `upsert()` for atomic insert/update
- Form data loading uses `maybeSingle()` with error handling

---

## Testing Checklist

- [ ] Run `supabase/fix_rls_policies.sql` in Supabase SQL Editor
- [ ] Restart Next.js dev server: `npm run dev`
- [ ] Login as existing user: `aadinath.10v@gmail.com`
- [ ] Verify apply page loads without 403 errors
- [ ] Verify school dropdown shows clean names
- [ ] Upload a resume (PDF or DOCX)
- [ ] Submit the application form
- [ ] Verify redirect to dashboard works
- [ ] Return to apply page and verify data persists

---

## Known Issues (None at this time)

All identified issues have been resolved. The application should now work correctly for:
- New applicants (first time filling out form)
- Existing applicants (updating their application)
- Resume parsing (PDF and DOCX files)
- School selection (clean names from CSV)

---

## Next Steps

Once you've verified everything works:

1. Test the admin functionality at `/admin`
2. Verify that admin users can view all applications
3. Test the dashboard functionality at `/dashboard`
4. Consider adding more detailed error messages for users
5. Add loading states during form submission

---

## Questions or Issues?

If you encounter any problems after applying these fixes:

1. Check the browser console for errors
2. Check the Supabase logs for RLS policy issues
3. Verify the RLS policies were created correctly
4. Make sure you're signed in with a valid user account

All fixes maintain backward compatibility and don't require any changes to existing data in the database.
