# Critical Fixes Applied - Round 2

## Issues Fixed in This Update

### 1. ✅ Unicode Escape Sequence Error (Garbled University Names)

**Problem**: University names displayed as garbled text like `㸰䡥獡‱敔‱慶敤Ⱐ㸰‰䝅楦Ⱗ⠰㴰`

**Root Cause**: The `schools.csv` file is UTF-16 LE encoded (not UTF-8), and the JavaScript `fetch().text()` was decoding it incorrectly.

**Fix**: Updated `src/lib/mlhSchools.ts` to:
- Detect file encoding by reading the BOM (Byte Order Mark)
- Use `TextDecoder` with correct encoding (UTF-16 LE, UTF-8, or UTF-8 with BOM)
- Handle both Windows (`\r\n`) and Unix (`\n`) line endings

```typescript
// Detects UTF-16 LE BOM (FF FE) or UTF-8 BOM (EF BB BF)
const uint8Array = new Uint8Array(arrayBuffer);
if (uint8Array[0] === 0xFF && uint8Array[1] === 0xFE) {
  const decoder = new TextDecoder('utf-16le');
  text = decoder.decode(arrayBuffer);
}
```

---

### 2. ✅ Resume Parser Import Issue

**Problem**: Resume parsing was failing with 500 error due to incorrect pdf-parse import.

**Root Cause**: pdf-parse v2.4+ has a new module structure with different exports:
- Node.js: `pdf-parse/node`
- Browser: `pdf-parse` (default)
- The package.json shows `"type": "module"` with multiple export paths

**Fix**: Updated `src/app/api/resume/parse/route.ts` to:
- Use dynamic import with fallback logic
- Try `pdf-parse/node` first (for Node.js environments)
- Fall back to `pdf-parse` if node export fails
- Added proper error handling with descriptive messages

---

### 3. ✅ Form Submission Blocked by Resume Upload

**Problem**: If resume upload or parsing failed, the entire form submission was blocked.

**Root Cause**: Resume parsing errors were thrown up to the upload handler, preventing form data from being saved.

**Fix**: Updated `src/app/apply/page.tsx` to:
- Wrap resume parsing in a try-catch block
- Allow upload to succeed even if parsing fails
- Show warning instead of error
- Let user submit application with just the resume URL (without parsed data)

```typescript
try {
  markdown = await parseResume(file)
  extractedData = extractResumeData(markdown)
} catch (parseError: any) {
  console.warn('Resume parsing failed, but file was uploaded:', parseError)
  // Continue without parsed data
}
```

---

### 4. ✅ Corrupted School Data Handling

**Problem**: Existing database records had corrupted school values that displayed as garbled text.

**Fix**: 
- Added validation in `loadUserData()` to detect corrupted school values
- Clear corrupted values on load (user will need to re-select)
- Created SQL script (`supabase/fix_corrupted_schools.sql`) to identify and fix corrupted data

```typescript
// Check if school value contains only valid characters
if (schoolValue && !/^[\w\s\-\(\),'\.&]+$/.test(schoolValue)) {
  console.warn('Corrupted school value detected, clearing:', schoolValue)
  schoolValue = '' // Clear corrupted value
}
```

---

## Files Modified

1. ✅ `src/lib/mlhSchools.ts` - UTF-16 encoding detection and proper CSV parsing
2. ✅ `src/app/apply/page.tsx` - Non-blocking resume upload + corrupted data handling
3. ✅ `src/app/api/resume/parse/route.ts` - Dynamic pdf-parse import with fallback
4. ✅ `supabase/fix_corrupted_schools.sql` - SQL to identify and fix corrupted data (NEW)

---

## Required Actions

### 🔴 STEP 1: Run Both SQL Migrations

You need to run BOTH SQL files in your Supabase SQL Editor:

1. **First**: `supabase/fix_rls_policies.sql` (from previous fixes)
   - Go to: https://app.supabase.com/project/mbtawwfpisxvxzicqebl/sql
   - Run the RLS policy fixes

2. **Second**: `supabase/fix_corrupted_schools.sql`
   - Uncomment the UPDATE statement for your user
   - Or uncomment the mass update to clear all corrupted values

```sql
-- Fix specific user
UPDATE public.applicants
SET school = 'University of Toledo'
WHERE user_id = '30383ac9-cdb7-41b6-973a-c24b2b8eb4de';
```

### 🟢 STEP 2: Restart Development Server

The schools.csv encoding fix requires a server restart:

```powershell
# Stop the current dev server (Ctrl+C)
npm run dev
```

### 🟢 STEP 3: Clear Browser Cache

The corrupted school data may be cached:
- Hard refresh: `Ctrl + Shift + R` (Chrome/Edge)
- Or open DevTools > Network > Check "Disable cache"

---

## Testing Checklist

After applying all fixes:

- [ ] Run both SQL migrations in Supabase
- [ ] Restart Next.js dev server
- [ ] Clear browser cache / hard refresh
- [ ] Login as `aadinath.10v@gmail.com`
- [ ] Verify school dropdown shows clean names (no garbled text)
- [ ] Verify form loads without "unsupported Unicode escape sequence" error
- [ ] Try uploading a PDF resume
- [ ] Verify resume upload works (even if parsing fails)
- [ ] Submit the form without errors
- [ ] Verify redirect to dashboard
- [ ] Return to apply page - data should persist correctly

---

## What Changed

### Before:
- CSV loaded with wrong encoding → garbled text
- Resume parsing failure blocked form submission
- pdf-parse import was incorrect for new version
- Corrupted school values persisted in database

### After:
- CSV loaded with correct UTF-16 LE encoding → clean text
- Resume parsing is non-blocking (upload succeeds even if parse fails)
- pdf-parse imported dynamically with fallback
- Corrupted school values are detected and cleared on load
- SQL script available to fix existing corrupted data

---

## Expected Behavior Now

1. **School Dropdown**: 
   - ✅ Shows clean, readable school names
   - ✅ No garbled Unicode characters
   - ✅ Autocomplete works smoothly

2. **Resume Upload**:
   - ✅ PDF/DOCX upload succeeds even if parsing fails
   - ✅ Shows warning if parsing fails (doesn't block)
   - ✅ Form can be submitted with or without resume

3. **Form Submission**:
   - ✅ Works for both new and existing applicants (upsert)
   - ✅ Handles corrupted school values gracefully
   - ✅ Redirects to dashboard on success

4. **Data Persistence**:
   - ✅ Existing applications load correctly
   - ✅ Updates work without 403 errors
   - ✅ Corrupted values are auto-cleared

---

## Troubleshooting

If issues persist:

1. **Still seeing garbled text?**
   - Make sure dev server was restarted
   - Clear browser cache completely
   - Check schools.csv encoding: should be UTF-16 LE with BOM (FF FE)

2. **Resume upload still failing?**
   - Check browser console for specific error
   - Verify pdf-parse is installed: `npm ls pdf-parse`
   - Should show version 2.4.5

3. **Form won't submit?**
   - Check browser console for errors
   - Verify RLS policies were updated in Supabase
   - Check that user is authenticated

4. **School value still corrupted?**
   - Run the SQL script to fix database
   - Clear the value and re-select from dropdown
   - Make sure you're using the latest code (pull latest changes)

---

## Technical Details

### schools.csv Encoding
- File format: UTF-16 Little Endian (UTF-16 LE)
- BOM: `FF FE` (255, 254 in decimal)
- Line endings: `\r\n` (Windows style)

### pdf-parse Module Structure
```
pdf-parse@2.4.5
├── /node → For Node.js server-side
├── /worker → For Web Workers
└── / (default) → For browsers
```

### Resume Upload Flow
```
User selects file
  ↓
Upload to Supabase Storage (always succeeds)
  ↓
Try to parse resume
  ├─ Success → Extract metadata
  └─ Failure → Continue without metadata
  ↓
Form data updated (with or without parsed data)
  ↓
User can submit
```

---

All fixes maintain backward compatibility. No breaking changes to existing data or functionality.
