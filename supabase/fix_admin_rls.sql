-- ============================================
-- CRITICAL SECURITY FIX: Admin RLS Policies
-- ============================================
-- Run this IMMEDIATELY in Supabase SQL Editor
-- This fixes the broken admin policy that allows any authenticated user to view all applications

-- Step 1: Drop the broken admin policies
DROP POLICY IF EXISTS "Admins can view all applications" ON public.applicants;
DROP POLICY IF EXISTS "Admins can update any application" ON public.applicants;

-- Step 2: Create proper JWT-based admin policies
-- These use the email from the JWT token to verify admin status

-- Admin SELECT policy: Only admins can view all applications
CREATE POLICY "Admins can view all applications"
  ON public.applicants
  FOR SELECT
  TO authenticated
  USING (
    -- Check if the user's email (from JWT) is in the admin list
    auth.jwt() ->> 'email' IN (
      'example@gmail.com'
      -- Add more admin emails here as needed, comma-separated:
      -- ,'admin2@example.com',
      -- ,'admin3@example.com'
    )
  );

-- Admin UPDATE policy: Only admins can update any application
CREATE POLICY "Admins can update any application"
  ON public.applicants
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      'example@gmail.com'
    )
  )
  WITH CHECK (
    auth.jwt() ->> 'email' IN (
      'example@gmail.com'
    )
  );

-- Step 3: Verify the policies were created correctly
SELECT 
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies
WHERE tablename = 'applicants'
  AND policyname LIKE '%Admin%'
ORDER BY cmd;

-- Expected output:
-- policyname                          | operation | using_expression          | check_expression
-- -----------------------------------+----------+---------------------------+-------------------------
-- Admins can view all applications   | SELECT   | (email IN (...))          | NULL
-- Admins can update any application  | UPDATE   | (email IN (...))          | (email IN (...))

-- ============================================
-- IMPORTANT NOTES:
-- ============================================
-- 1. This uses auth.jwt() ->> 'email' which reads the email from the user's JWT token
-- 2. Supabase validates the JWT signature, so users cannot forge their email
-- 3. Make sure the email addresses match exactly (case-sensitive)
-- 4. Update the admin email list when adding/removing admin users
-- 5. Regular users can still view/edit ONLY their own applications via existing RLS policies
