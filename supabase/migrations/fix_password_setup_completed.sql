-- Migration: Fix password_setup_completed flag for existing users
-- Description: Updates password_setup_completed to true for users who have passwords in auth.users
-- Date: 2025-11-13

-- ============================================================================
-- Update password_setup_completed for users who have passwords
-- ============================================================================
-- This query finds all users in the applicants table who have a password set
-- in the auth.users table (encrypted_password IS NOT NULL) but have
-- password_setup_completed set to FALSE, and updates it to TRUE

UPDATE public.applicants
SET password_setup_completed = TRUE
WHERE user_id IN (
  SELECT id
  FROM auth.users
  WHERE encrypted_password IS NOT NULL
)
AND password_setup_completed = FALSE;

-- ============================================================================
-- Verification Query (Optional - run after migration to verify)
-- ============================================================================
-- SELECT 
--   a.email,
--   a.password_setup_completed,
--   CASE WHEN u.encrypted_password IS NOT NULL THEN 'YES' ELSE 'NO' END as has_password
-- FROM public.applicants a
-- JOIN auth.users u ON a.user_id = u.id
-- ORDER BY a.email;
