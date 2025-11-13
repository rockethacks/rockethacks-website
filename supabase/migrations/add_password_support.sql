-- Migration: Add Password-Based Authentication Support
-- Description: Adds support for password-based authentication alongside existing Magic Link auth
-- Date: 2025-01-13

-- ============================================================================
-- 1. Add password_setup_completed column to applicants table
-- ============================================================================
-- This tracks whether a user has set up their password (for migration from Magic Link)
ALTER TABLE public.applicants
ADD COLUMN IF NOT EXISTS password_setup_completed BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN public.applicants.password_setup_completed IS
'Tracks if user has completed password setup. FALSE for legacy Magic Link users, TRUE for new password users.';

-- ============================================================================
-- 2. Create index for better query performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_applicants_password_setup
ON public.applicants(user_id, password_setup_completed);

-- ============================================================================
-- 3. Set default value for existing users
-- ============================================================================
-- Existing users (who signed up via Magic Link) have this set to FALSE by default
-- New users will have this set to TRUE when they sign up with a password

-- ============================================================================
-- 4. RLS Policies (No changes needed)
-- ============================================================================
-- Existing RLS policies work for both auth methods:
-- - auth.uid() returns the same UUID regardless of auth method
-- - Admin checks remain email-based (ADMIN_EMAILS env variable)
-- - Users can only view/edit their own applications
-- - Admins can view all applications

-- ============================================================================
-- 5. Verify existing policies (reference only - no changes)
-- ============================================================================
-- Users can view their own application
-- Policy: "Users can view their own application"
-- USING (auth.uid() = user_id)

-- Users can create their own application
-- Policy: "Users can create their own application"
-- WITH CHECK (auth.uid() = user_id)

-- Users can update their own application
-- Policy: "Users can update their own application"
-- USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)

-- Admins can view all applications (enforced at application layer)
-- Policy: "Admins can view all applications"
-- USING (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid()))

-- ============================================================================
-- 6. Migration notes
-- ============================================================================
-- IMPORTANT:
-- - This migration is NON-BREAKING. Both auth methods work simultaneously.
-- - Existing Magic Link users can continue to use Magic Link
-- - Existing users can set up a password via /setup-password page
-- - New users can sign up with email + password
-- - Admin authentication remains unchanged (email-based via ADMIN_EMAILS)
-- - No data loss or user disruption

-- ============================================================================
-- 7. Rollback instructions (if needed)
-- ============================================================================
-- To rollback this migration:
-- DROP INDEX IF EXISTS idx_applicants_password_setup;
-- ALTER TABLE public.applicants DROP COLUMN IF EXISTS password_setup_completed;

-- Note: Rollback does NOT remove passwords from auth.users (managed by Supabase)
-- Users who set up passwords will still have them in auth.users table
