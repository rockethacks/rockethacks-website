-- ============================================
-- RocketHacks Organizer & Check-In Features Migration
-- ============================================
-- This migration adds:
-- 1. User role system (admin, organizer, participant)
-- 2. Check-in functionality
-- 3. Application completeness tracking
-- 4. Updated RLS policies for organizers
--
-- Run this in your Supabase SQL Editor: https://app.supabase.com/project/_/sql
-- ============================================

-- ============================================
-- 1. Add new columns to applicants table
-- ============================================

-- Add role column to track user roles
ALTER TABLE public.applicants
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'participant';

-- Add constraint to ensure valid roles
ALTER TABLE public.applicants
ADD CONSTRAINT valid_role CHECK (role IN ('participant', 'organizer', 'admin'));

-- Add check_in column for event day check-in tracking
ALTER TABLE public.applicants
ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT false;

-- Add check_in_time to track when they checked in
ALTER TABLE public.applicants
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE;

-- Add check_in_by to track who checked them in (organizer/admin user_id)
ALTER TABLE public.applicants
ADD COLUMN IF NOT EXISTS checked_in_by UUID REFERENCES auth.users(id);

-- Add application_complete to track if all fields are filled
ALTER TABLE public.applicants
ADD COLUMN IF NOT EXISTS application_complete BOOLEAN DEFAULT false;

-- ============================================
-- 2. Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_applicants_role ON public.applicants(role);
CREATE INDEX IF NOT EXISTS idx_applicants_checked_in ON public.applicants(checked_in);
CREATE INDEX IF NOT EXISTS idx_applicants_application_complete ON public.applicants(application_complete);

-- ============================================
-- 3. Drop old permissive RLS policies
-- ============================================

-- Drop the old overly permissive admin policy
DROP POLICY IF EXISTS "Admins can view all applications" ON public.applicants;

-- ============================================
-- 4. Create new RLS policies for role-based access
-- ============================================

-- Policy: Admins can view all applications
CREATE POLICY "Admins can view all applications"
  ON public.applicants
  FOR SELECT
  USING (
    -- User can see their own application
    auth.uid() = user_id
    OR
    -- Or user is an admin (check via role in same table)
    EXISTS (
      SELECT 1 FROM public.applicants
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: Organizers can view all applications (for check-in)
CREATE POLICY "Organizers can view all applications"
  ON public.applicants
  FOR SELECT
  USING (
    -- User can see their own application
    auth.uid() = user_id
    OR
    -- Or user is an organizer or admin
    EXISTS (
      SELECT 1 FROM public.applicants
      WHERE user_id = auth.uid()
      AND role IN ('organizer', 'admin')
    )
  );

-- Policy: Admins can update all applications
CREATE POLICY "Admins can update all applications"
  ON public.applicants
  FOR UPDATE
  USING (
    -- User updating their own application
    auth.uid() = user_id
    OR
    -- Or user is an admin
    EXISTS (
      SELECT 1 FROM public.applicants
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    -- User updating their own application
    auth.uid() = user_id
    OR
    -- Or user is an admin
    EXISTS (
      SELECT 1 FROM public.applicants
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: Organizers can ONLY update check-in fields
CREATE POLICY "Organizers can update check-in status"
  ON public.applicants
  FOR UPDATE
  USING (
    -- User is an organizer or admin
    EXISTS (
      SELECT 1 FROM public.applicants
      WHERE user_id = auth.uid()
      AND role IN ('organizer', 'admin')
    )
  )
  WITH CHECK (
    -- Ensure organizers can ONLY update check-in related fields
    -- This is enforced at the application layer, but we allow the update here
    EXISTS (
      SELECT 1 FROM public.applicants
      WHERE user_id = auth.uid()
      AND role IN ('organizer', 'admin')
    )
  );

-- ============================================
-- 5. Create a function to calculate application completeness
-- ============================================

CREATE OR REPLACE FUNCTION check_application_completeness(applicant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  app_record RECORD;
  is_complete BOOLEAN;
BEGIN
  -- Fetch the applicant record
  SELECT * INTO app_record FROM public.applicants WHERE id = applicant_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check if all required AND optional fields are filled
  is_complete := (
    -- Required MLH fields (already enforced by NOT NULL)
    app_record.first_name IS NOT NULL AND app_record.first_name != '' AND
    app_record.last_name IS NOT NULL AND app_record.last_name != '' AND
    app_record.age IS NOT NULL AND
    app_record.phone_number IS NOT NULL AND app_record.phone_number != '' AND
    app_record.email IS NOT NULL AND app_record.email != '' AND
    app_record.school IS NOT NULL AND app_record.school != '' AND
    app_record.level_of_study IS NOT NULL AND app_record.level_of_study != '' AND
    app_record.country_of_residence IS NOT NULL AND app_record.country_of_residence != '' AND
    app_record.mlh_code_of_conduct = true AND
    app_record.mlh_privacy_policy = true AND

    -- Optional but expected fields for complete application
    app_record.linkedin_url IS NOT NULL AND app_record.linkedin_url != '' AND
    app_record.github_url IS NOT NULL AND app_record.github_url != '' AND
    app_record.portfolio_url IS NOT NULL AND app_record.portfolio_url != '' AND
    app_record.resume_url IS NOT NULL AND app_record.resume_url != '' AND
    app_record.dietary_restrictions IS NOT NULL AND
    app_record.gender IS NOT NULL AND app_record.gender != '' AND
    app_record.pronouns IS NOT NULL AND app_record.pronouns != '' AND
    app_record.race_ethnicity IS NOT NULL AND
    app_record.education_level IS NOT NULL AND app_record.education_level != '' AND
    app_record.tshirt_size IS NOT NULL AND app_record.tshirt_size != '' AND
    app_record.major IS NOT NULL AND app_record.major != '' AND
    app_record.first_hackathon IS NOT NULL AND

    -- Shipping address fields
    app_record.address_line1 IS NOT NULL AND app_record.address_line1 != '' AND
    app_record.city IS NOT NULL AND app_record.city != '' AND
    app_record.state IS NOT NULL AND app_record.state != '' AND
    app_record.shipping_country IS NOT NULL AND app_record.shipping_country != '' AND
    app_record.postal_code IS NOT NULL AND app_record.postal_code != ''
  );

  RETURN is_complete;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. Create trigger to auto-update application_complete
-- ============================================

CREATE OR REPLACE FUNCTION update_application_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically calculate and update application_complete field
  NEW.application_complete := check_application_completeness(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_application_complete
  BEFORE INSERT OR UPDATE ON public.applicants
  FOR EACH ROW
  EXECUTE FUNCTION update_application_complete();

-- ============================================
-- 7. Create a view for check-in statistics
-- ============================================

CREATE OR REPLACE VIEW public.checkin_stats AS
SELECT
  COUNT(*) as total_accepted,
  COUNT(*) FILTER (WHERE checked_in = true) as checked_in_count,
  COUNT(*) FILTER (WHERE checked_in = false) as not_checked_in_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE checked_in = true) / NULLIF(COUNT(*), 0), 2) as checkin_percentage
FROM public.applicants
WHERE status = 'accepted';

-- Grant access to the view
GRANT SELECT ON public.checkin_stats TO authenticated;

-- ============================================
-- 8. Update application_stats view to include completeness
-- ============================================

CREATE OR REPLACE VIEW public.application_stats AS
SELECT
  status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE first_hackathon = true) as first_time_hackers,
  COUNT(*) FILTER (WHERE education_level = 'High School') as high_school,
  COUNT(*) FILTER (WHERE education_level = 'Undergraduate') as undergraduate,
  COUNT(*) FILTER (WHERE education_level = 'Graduate') as graduate,
  COUNT(*) FILTER (WHERE application_complete = true) as complete_applications,
  COUNT(*) FILTER (WHERE application_complete = false) as incomplete_applications
FROM public.applicants
GROUP BY status;

-- ============================================
-- 9. Create helper function to get user role
-- ============================================

CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.applicants
  WHERE user_id = user_uuid;

  RETURN COALESCE(user_role, 'participant');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_application_completeness(UUID) TO authenticated;

-- ============================================
-- 10. Backfill existing users with default role
-- ============================================

-- Set all existing users to 'participant' role if not already set
UPDATE public.applicants
SET role = 'participant'
WHERE role IS NULL;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Next steps:
-- 1. Set ORGANIZER_EMAILS environment variable in your deployment
-- 2. Manually set admin/organizer roles via SQL or through the admin portal
-- 3. Update your application code to use the new role-based system
-- ============================================

-- Example: Manually promote users to admin/organizer
-- UPDATE public.applicants SET role = 'admin' WHERE email = 'admin@example.com';
-- UPDATE public.applicants SET role = 'organizer' WHERE email = 'organizer@example.com';
