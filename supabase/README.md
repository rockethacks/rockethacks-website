# Supabase Database Scripts

This folder contains SQL scripts for managing the RocketHacks application database.

## Files

### Production Scripts
- **`schema.sql`** - Complete database schema including tables, indexes, RLS policies, and triggers
- **`fix_rls_policies.sql`** - Safely drops and recreates RLS (Row Level Security) policies for the applicants table
- **`fix_corrupted_schools.sql`** - Fixes corrupted school names in the applicants table (if needed)

## Usage

### Initial Setup
Run `schema.sql` in your Supabase SQL Editor to create the complete database structure.

### RLS Policy Updates
If you need to fix or update RLS policies, run `fix_rls_policies.sql`. This script:
- Safely drops all existing policies (using IF EXISTS)
- Creates a clean set of combined policies to avoid conflicts
- Verifies the policies were created successfully

## Important Security Notes

⚠️ **Before deploying any SQL script:**

1. **Replace placeholder admin emails** in the SQL files with your actual admin email addresses
2. **Never commit actual admin emails** to public repositories
3. **Use environment variables** for sensitive configuration when possible
4. **Test policies** in a development environment first

### Admin Email Configuration

All RLS policy scripts contain placeholder admin emails (`admin@example.com`). 

**Before running these scripts, replace these with your actual admin emails:**

```sql
WHERE email IN (
  'your-actual-admin@example.com',
  'another-admin@example.com'
)
```

## RLS Policy Structure

The applicants table uses Row Level Security to ensure:
- Users can only see and edit their own applications
- Admins (specified by email) can see and edit all applications
- All queries require authentication

## Troubleshooting

If users cannot access their applications:
1. Check that RLS is enabled: `ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;`
2. Verify the user is authenticated
3. Confirm the `user_id` in the applicants table matches their auth user ID
4. Check that policies exist using: `SELECT * FROM pg_policies WHERE tablename = 'applicants';`
