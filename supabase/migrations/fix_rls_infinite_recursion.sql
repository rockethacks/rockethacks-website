-- ============================================
-- Fix RLS Infinite Recursion Issue
-- ============================================
-- This migration fixes the infinite recursion in RLS policies
-- by using a SECURITY DEFINER function to check roles
-- ============================================

-- ============================================
-- 1. Create a secure function to check if user is admin/organizer
-- ============================================

-- This function bypasses RLS by using SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.applicants
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_organizer_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.applicants
    WHERE user_id = auth.uid()
    AND role IN ('organizer', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_organizer_or_admin() TO authenticated;

-- ============================================
-- 2. Drop the problematic policies
-- ============================================

DROP POLICY IF EXISTS "Admins can view all applications" ON public.applicants;
DROP POLICY IF EXISTS "Organizers can view all applications" ON public.applicants;
DROP POLICY IF EXISTS "Admins can update all applications" ON public.applicants;
DROP POLICY IF EXISTS "Organizers can update check-in status" ON public.applicants;

-- ============================================
-- 3. Recreate policies using the secure functions
-- ============================================

-- Policy: Users can view their own application, admins and organizers can view all
CREATE POLICY "Users can view applications"
  ON public.applicants
  FOR SELECT
  USING (
    -- User can see their own application
    auth.uid() = user_id
    OR
    -- Or user is an organizer or admin (using secure function)
    public.is_organizer_or_admin()
  );

-- Policy: Users can update their own application, admins can update all
CREATE POLICY "Users can update applications"
  ON public.applicants
  FOR UPDATE
  USING (
    -- User updating their own application
    auth.uid() = user_id
    OR
    -- Or user is an admin (using secure function)
    public.is_admin()
  )
  WITH CHECK (
    -- User updating their own application
    auth.uid() = user_id
    OR
    -- Or user is an admin (using secure function)
    public.is_admin()
  );

-- Policy: Organizers can update check-in status
CREATE POLICY "Organizers can update check-in"
  ON public.applicants
  FOR UPDATE
  USING (
    -- User is an organizer or admin (using secure function)
    public.is_organizer_or_admin()
  )
  WITH CHECK (
    -- User is an organizer or admin (using secure function)
    public.is_organizer_or_admin()
  );

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- The infinite recursion issue should now be resolved.
-- Users should be able to access admin/organizer portals based on their role.
-- ============================================
