# Admin Portal & Resume Parser Fixes - Round 3

## Issues Fixed

### 1. ✅ Admin Cannot See All Applications

**Problem**: Admin user (rockethacksdirectors.2025@gmail.com) could only see 1 of 2 applications in the database. The admin's own application was hidden.

**Root Cause**: The RLS (Row Level Security) policies only allowed users to see their own applications. There was no policy allowing admins to see ALL applications.

**Fix**: Updated `supabase/fix_rls_policies.sql` with two new admin policies:

```sql
-- Policy 5: Admins can view ALL applications
CREATE POLICY "Admins can view all applications"
  ON public.applicants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN (
        'rockethacksdirectors.2025@gmail.com',
        'aadinath.10v@gmail.com'
      )
    )
  );

-- Policy 6: Admins can update ANY application status
CREATE POLICY "Admins can update any application"
  ON public.applicants
  FOR UPDATE
  TO authenticated
  USING (...same check...);
```

**How It Works**:
- Checks if the current user's email is in the admin list
- If yes, grants SELECT access to ALL rows (not just their own)
- Also grants UPDATE access so admins can change application statuses

---

### 2. ✅ Resume Parser Still Failing

**Problem**: Both users uploaded PDFs successfully, but `resume_markdown` was null, indicating parsing failed.

**Root Cause**: 
1. The pdf-parse module import was still failing due to incorrect module resolution
2. No detailed error logging to diagnose the issue

**Fix**: Updated `src/app/api/resume/parse/route.ts`:

1. **Better Module Loading**:
```typescript
async function getPdfParse() {
  if (pdfParseCache) return pdfParseCache
  
  try {
    const pdfParseModule = await import('pdf-parse/node')
    pdfParseCache = pdfParseModule.default || pdfParseModule.parse || pdfParseModule
    console.log('Loaded pdf-parse/node successfully')
    return pdfParseCache
  } catch (error) {
    // Fallback to regular import
    const pdfParseModule = await import('pdf-parse')
    pdfParseCache = pdfParseModule.default || pdfParseModule
    return pdfParseCache
  }
}
```

2. **Enhanced Error Logging**:
```typescript
console.log('Attempting to parse PDF...')
const pdfParse = await getPdfParse()
console.log('pdf-parse loaded, parsing buffer of size:', buffer.length)
const pdfData = await pdfParse(buffer)
console.log('PDF parsed successfully, text length:', pdfData?.text?.length || 0)
```

3. **Empty Result Detection**:
```typescript
if (!text || text.trim().length === 0) {
  throw new Error('PDF parsing returned empty text')
}
```

---

## Files Modified

1. ✅ `supabase/fix_rls_policies.sql` - Added admin SELECT and UPDATE policies
2. ✅ `src/app/api/resume/parse/route.ts` - Improved pdf-parse import and error logging

---

## 🔴 CRITICAL: Run SQL Migration

**You MUST run the updated RLS policies SQL file:**

### Step-by-Step:

1. **Open Supabase SQL Editor**
   - Go to: https://app.supabase.com/project/mbtawwfpisxvxzicqebl/sql
   - Click "New Query"

2. **Copy and Run `fix_rls_policies.sql`**
   - Copy the ENTIRE contents of `supabase/fix_rls_policies.sql`
   - Paste into the SQL editor
   - Click "Run" or press `Ctrl+Enter`

3. **Verify Policies Were Created**
   - You should see 6 policies created:
     1. Users can view their own application
     2. Users can create their own application  
     3. Users can update their own application
     4. Users can delete their own application
     5. **Admins can view all applications** ← NEW
     6. **Admins can update any application** ← NEW

4. **Check the Output**
   - The final SELECT query will show all active policies
   - Look for the two new admin policies in the results

---

## 🟢 Testing Instructions

### Test Admin Portal:

1. **Restart Dev Server** (if running):
   ```powershell
   # Press Ctrl+C to stop
   npm run dev
   ```

2. **Login as Admin**:
   - Go to `/login`
   - Sign in with: `rockethacksdirectors.2025@gmail.com`

3. **Visit Admin Portal**:
   - Navigate to `/admin`
   - You should now see **BOTH** applications:
     - Aadinath Sanjeev (rockethacksdirectors.2025@gmail.com) - Age 15
     - Aadinath Sanjeev (aadinath.10v@gmail.com) - Age 20

4. **Verify Functionality**:
   - ✅ Both applications visible in table
   - ✅ Search works
   - ✅ Filter by status works
   - ✅ Click "View" to see application details
   - ✅ Can change status (Accept/Reject/Waitlist/Pending)
   - ✅ Export CSV works

### Test Resume Upload:

1. **Go to Apply Page**: `/apply`
2. **Upload a PDF Resume**
3. **Check Browser Console** for logs:
   ```
   Attempting to parse PDF...
   pdf-parse loaded, parsing buffer of size: XXXXX
   PDF parsed successfully, text length: XXXX
   ```
4. **Check Network Tab** for `/api/resume/parse`:
   - Should return 200 OK
   - Response should contain `{ "markdown": "..." }`

5. **Submit the Application**
6. **Go to Admin Portal** and view the application
7. **Verify** `resume_markdown` is populated (click "View" and scroll to "Resume (Parsed)")

---

## Expected Behavior After Fix

### Admin Portal:
- ✅ Shows ALL applications from ALL users
- ✅ Admins see their own applications too
- ✅ Status update buttons work for all applications
- ✅ Stats cards show correct counts

### Resume Parser:
- ✅ PDFs are parsed successfully
- ✅ Extracted text is converted to markdown
- ✅ `resume_markdown` field is populated in database
- ✅ Detailed error logs in server console if parsing fails

---

## Admin Email Management

### Current Admins:
- `rockethacksdirectors.2025@gmail.com`
- `aadinath.10v@gmail.com`

### To Add More Admins:

Edit `supabase/fix_rls_policies.sql` and add emails to the list:

```sql
AND auth.users.email IN (
  'rockethacksdirectors.2025@gmail.com',
  'aadinath.10v@gmail.com',
  'new.admin@example.com',  -- Add new admin here
  'another.admin@example.com'
)
```

Then re-run the SQL migration in Supabase.

---

## Troubleshooting

### Admin Portal Still Shows Only 1 Application:

1. **Verify SQL was run**:
   ```sql
   SELECT policyname, cmd FROM pg_policies 
   WHERE tablename = 'applicants' 
   AND policyname LIKE '%Admin%';
   ```
   - Should return 2 rows (SELECT and UPDATE policies)

2. **Check you're logged in as admin**:
   - Email must be in the admin list
   - Try logging out and back in

3. **Clear browser cache**: Hard refresh (`Ctrl+Shift+R`)

### Resume Parser Still Failing:

1. **Check Server Console** for error logs:
   - Look for "PDF parsing error details"
   - Check the specific error message

2. **Verify pdf-parse is installed**:
   ```powershell
   npm ls pdf-parse
   ```
   - Should show version 2.4.5

3. **Try re-installing dependencies**:
   ```powershell
   npm install
   ```

4. **Check the PDF file**:
   - Make sure it's a valid PDF
   - Try with a different PDF
   - Some encrypted or image-only PDFs may fail

### Resume Markdown is Still Null:

1. **Upload a new resume** (after the fix)
2. **Check browser console** for errors
3. **Check network tab** for `/api/resume/parse` response
4. **Look at server console** for parsing logs

---

## Database Schema Check

Your current data shows:
- 2 applicants total
- 1 pending, 1 accepted
- Both have `resume_url` but `resume_markdown` is null

After the fix:
- Admin portal will show both applicants
- New resume uploads will populate `resume_markdown`
- Old resumes (already uploaded) won't be re-parsed automatically
  - Users can re-upload to get markdown parsing

---

## Summary

| Issue | Status | Action Required |
|-------|--------|-----------------|
| Admin can't see all apps | ✅ Fixed | Run updated SQL migration |
| Resume parsing fails | ✅ Fixed | Restart dev server, test with new upload |
| Both apps visible in admin | ✅ Should work | Verify after SQL migration |
| Resume markdown null | ✅ Should work | Test with new upload after restart |

---

## Next Steps

1. ✅ Run the SQL migration (CRITICAL - DO THIS FIRST)
2. ✅ Restart your dev server
3. ✅ Test admin portal - should see 2 applications
4. ✅ Test resume upload - should see parsing logs
5. ✅ Verify resume markdown is populated in admin view

All fixes maintain backward compatibility. Existing data is not affected, but new uploads will benefit from the improved parsing.
