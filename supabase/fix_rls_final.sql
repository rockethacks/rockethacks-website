-- ============================================
-- PROPER FIX: Clear and Rebuild RLS Policies
-- ============================================
-- The issue: There might be conflicting or broken policies from schema.sql
-- Solution: Start completely fresh

-- Step 1: Drop EVERYTHING
DROP POLICY IF EXISTS "Users can view their own application" ON public.applicants;
DROP POLICY IF EXISTS "Users can create their own application" ON public.applicants;
DROP POLICY IF EXISTS "Users can update their own application" ON public.applicants;
DROP POLICY IF EXISTS "Users can delete their own application" ON public.applicants;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.applicants;
DROP POLICY IF EXISTS "Admins can update any application" ON public.applicants;

-- Make absolutely sure RLS is enabled
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;

-- Step 2: Create a SINGLE combined SELECT policy that handles both users and admins
-- This avoids policy conflicts
CREATE POLICY "select_own_or_admin"
ON public.applicants
FOR SELECT
TO authenticated
USING (
  -- Either: You own this record
  auth.uid() = user_id
  OR
  -- Or: You are an admin (replace with your admin emails)
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email IN (
      'admin@example.com'
      -- Add more admin emails here
    )
  )
);

-- Step 3: INSERT policy - users can only create their own applications
CREATE POLICY "insert_own_application"
ON public.applicants
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Step 4: Combined UPDATE policy (own or admin)
CREATE POLICY "update_own_or_admin"
ON public.applicants
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email IN (
      'admin@example.com'
      -- Add more admin emails here
    )
  )
)
WITH CHECK (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email IN (
      'admin@example.com'
      -- Add more admin emails here
    )
  )
);

-- Step 5: DELETE policy (own only - admins probably shouldn't delete)
CREATE POLICY "delete_own_application"
ON public.applicants
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Step 6: Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'applicants'
ORDER BY cmd, policyname;

-- Step 7: Check table permissions
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'applicants'
AND table_schema = 'public';
