-- ============================================
-- FIX RLS POLICIES - Complete Rebuild
-- ============================================
-- This will completely rebuild the RLS policies with proper permissions

-- Step 1: Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view their own application" ON public.applicants;
DROP POLICY IF EXISTS "Users can create their own application" ON public.applicants;
DROP POLICY IF EXISTS "Users can update their own application" ON public.applicants;
DROP POLICY IF EXISTS "Users can delete their own application" ON public.applicants;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.applicants;
DROP POLICY IF EXISTS "Admins can update any application" ON public.applicants;

-- Step 2: Ensure RLS is enabled
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;

-- Step 3: Create new policies with correct syntax

-- Policy 1: Users can SELECT their own application (by user_id)
CREATE POLICY "Users can view their own application"
ON public.applicants
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

-- Policy 2: Users can INSERT their own application
CREATE POLICY "Users can create their own application"
ON public.applicants
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

-- Policy 3: Users can UPDATE their own application
CREATE POLICY "Users can update their own application"
ON public.applicants
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);

-- Policy 4: Users can DELETE their own application
CREATE POLICY "Users can delete their own application"
ON public.applicants
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
);

-- Policy 5: Admins can SELECT all applications
-- Replace 'admin@example.com' with your actual admin emails
CREATE POLICY "Admins can view all applications"
ON public.applicants
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM auth.users
    WHERE email IN (
      'admin@example.com'
      -- Add more admin emails here
    )
  )
);

-- Policy 6: Admins can UPDATE all applications
-- Replace 'admin@example.com' with your actual admin emails
CREATE POLICY "Admins can update any application"
ON public.applicants
FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM auth.users
    WHERE email IN (
      'admin@example.com'
      -- Add more admin emails here
    )
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM auth.users
    WHERE email IN (
      'admin@example.com'
      -- Add more admin emails here
    )
  )
);

-- Step 4: Verify the policies were created
SELECT 
  policyname,
  cmd,
  roles,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Read access'
    WHEN cmd = 'INSERT' THEN 'Create access'
    WHEN cmd = 'UPDATE' THEN 'Modify access'
    WHEN cmd = 'DELETE' THEN 'Delete access'
  END as permission_type
FROM pg_policies
WHERE tablename = 'applicants'
ORDER BY cmd, policyname;

-- Step 5: Test that the current user can now read
-- (This will still return NULL in SQL Editor, but will work in the app)
SELECT 
  COUNT(*) as accessible_records
FROM public.applicants
WHERE user_id = auth.uid() OR auth.uid() IN (
  SELECT id FROM auth.users WHERE email IN (
    'rockethacksdirectors.2025@gmail.com',
    'aadinath.10v@gmail.com'
  )
);
