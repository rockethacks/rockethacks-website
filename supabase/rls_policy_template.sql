-- ============================================
-- RLS Policies for Applicants Table
-- ============================================
-- Run this in your Supabase SQL Editor to set up or fix RLS policies
-- This script safely drops existing policies and creates a clean set

-- Step 1: Drop all existing policies (if they exist)
DROP POLICY IF EXISTS "Users can view their own application" ON public.applicants;
DROP POLICY IF EXISTS "Users can create their own application" ON public.applicants;
DROP POLICY IF EXISTS "Users can update their own application" ON public.applicants;
DROP POLICY IF EXISTS "Users can delete their own application" ON public.applicants;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.applicants;
DROP POLICY IF EXISTS "Admins can update any application" ON public.applicants;
DROP POLICY IF EXISTS "select_own_or_admin" ON public.applicants;
DROP POLICY IF EXISTS "insert_own_application" ON public.applicants;
DROP POLICY IF EXISTS "update_own_or_admin" ON public.applicants;
DROP POLICY IF EXISTS "delete_own_application" ON public.applicants;

-- Step 2: Ensure RLS is enabled
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;

-- Step 3: Create combined policies (avoids conflicts)

-- SELECT policy: Users can view their own application OR admins can view all
CREATE POLICY "select_own_or_admin"
ON public.applicants
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR
  auth.jwt() ->> 'email' IN (
    'example@gmail.com'
    -- Add more admin emails here as needed
  )
);

-- INSERT policy: Users can only create their own application
CREATE POLICY "insert_own_application"
ON public.applicants
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE policy: Users can update their own application OR admins can update any
CREATE POLICY "update_own_or_admin"
ON public.applicants
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR
  auth.jwt() ->> 'email' IN (
    'example@gmail.com'
    -- Add more admin emails here as needed
  )
)
WITH CHECK (
  auth.uid() = user_id
  OR
  auth.jwt() ->> 'email' IN (
    'example@gmail.com'
    -- Add more admin emails here as needed
  )
);

-- DELETE policy: Users can only delete their own application
CREATE POLICY "delete_own_application"
ON public.applicants
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Step 4: Verify policies were created successfully
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'applicants'
ORDER BY cmd, policyname;
