-- ============================================
-- Fix RLS Policies for Applicants Table
-- ============================================
-- Run this in your Supabase SQL Editor to fix the 403 errors

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own application" ON public.applicants;
DROP POLICY IF EXISTS "Users can create their own application" ON public.applicants;
DROP POLICY IF EXISTS "Users can update their own application" ON public.applicants;
DROP POLICY IF EXISTS "Users can delete their own application" ON public.applicants;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.applicants;
DROP POLICY IF EXISTS "Admins can update any application" ON public.applicants;

-- Recreate policies with proper permissions

-- Policy 1: Users can SELECT their own application
CREATE POLICY "Users can view their own application"
  ON public.applicants
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 2: Users can INSERT their own application
CREATE POLICY "Users can create their own application"
  ON public.applicants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can UPDATE their own application
CREATE POLICY "Users can update their own application"
  ON public.applicants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can DELETE their own application (optional, but good to have)
CREATE POLICY "Users can delete their own application"
  ON public.applicants
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 5: Admins can view ALL applications
-- This checks if the user's email is in the admin list
-- Replace 'admin@example.com' with your actual admin emails
CREATE POLICY "Admins can view all applications"
  ON public.applicants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN (
        'admin@example.com'
        -- Add more admin emails here as needed
      )
    )
  );

-- Policy 6: Admins can update ANY application status
-- Replace 'admin@example.com' with your actual admin emails
CREATE POLICY "Admins can update any application"
  ON public.applicants
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN (
        'admin@example.com'
        -- Add more admin emails here as needed
      )
    )
  );

-- Verify the policies are active
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'applicants';
