-- ============================================
-- RocketHacks Applicant Database Schema
-- ============================================
-- This file contains the SQL to set up the database schema for the hackathon application system
-- Run this in your Supabase SQL Editor: https://app.supabase.com/project/_/sql

-- ============================================
-- 1. Create applicants table
-- ============================================
CREATE TABLE IF NOT EXISTS public.applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- MLH Required Fields
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  age INTEGER NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  school TEXT NOT NULL, -- From MLH verified schools list
  level_of_study TEXT NOT NULL,
  country_of_residence TEXT NOT NULL, -- ISO 3166 standard
  
  -- Professional Information
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  
  -- Resume
  resume_url TEXT,
  resume_markdown TEXT,
  
  -- MLH Required Checkboxes
  mlh_code_of_conduct BOOLEAN NOT NULL DEFAULT false,
  mlh_privacy_policy BOOLEAN NOT NULL DEFAULT false,
  mlh_marketing_emails BOOLEAN DEFAULT false, -- Optional
  
  -- Optional Demographic Fields
  dietary_restrictions TEXT[], -- Array for multiple selections
  underrepresented_group TEXT,
  gender TEXT,
  pronouns TEXT,
  race_ethnicity TEXT[],
  sexual_orientation TEXT,
  education_level TEXT,
  tshirt_size TEXT,
  
  -- Shipping Address (Optional - for prizes/swag)
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  shipping_country TEXT,
  postal_code TEXT,
  
  -- Major/Field of Study
  major TEXT,
  
  -- Hackathon Specific
  first_hackathon BOOLEAN DEFAULT false,
  team_name TEXT,
  special_accommodations TEXT,
  
  -- Application Status
  status TEXT DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'rejected', 'waitlisted')),
  CONSTRAINT valid_age CHECK (age >= 13 AND age <= 100),
  CONSTRAINT valid_level_of_study CHECK (level_of_study IN (
    'Less than Secondary / High School',
    'Secondary / High School',
    'Undergraduate University (2 year - community college or similar)',
    'Undergraduate University (3+ year)',
    'Graduate University (Masters, Professional, Doctoral, etc)',
    'Code School / Bootcamp',
    'Other Vocational / Trade Program or Apprenticeship',
    'Post Doctorate',
    'Other',
    'I''m not currently a student',
    'Prefer not to answer'
  ))
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_applicants_user_id ON public.applicants(user_id);
CREATE INDEX IF NOT EXISTS idx_applicants_email ON public.applicants(email);
CREATE INDEX IF NOT EXISTS idx_applicants_status ON public.applicants(status);

-- ============================================
-- 2. Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. Create RLS Policies
-- ============================================

-- Policy: Users can read their own application
CREATE POLICY "Users can view their own application"
  ON public.applicants
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own application (first time)
CREATE POLICY "Users can create their own application"
  ON public.applicants
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own application
CREATE POLICY "Users can update their own application"
  ON public.applicants
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all applications
-- Note: You'll need to check admin status in your application code
-- This policy allows read access but you should verify admin email on the backend
CREATE POLICY "Admins can view all applications"
  ON public.applicants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      -- Add your admin email check here if you want DB-level enforcement
      -- For now, we'll handle this in the API layer
    )
  );

-- ============================================
-- 4. Create updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_applicants_updated_at
  BEFORE UPDATE ON public.applicants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. Grant permissions
-- ============================================
-- Grant authenticated users access to the table
GRANT SELECT, INSERT, UPDATE ON public.applicants TO authenticated;
-- Note: No sequence grant needed since we use UUID (gen_random_uuid())

-- ============================================
-- IMPORTANT: ADMIN SETUP
-- ============================================
-- After running this script, you need to:
-- 1. Set the ADMIN_EMAILS environment variable in Vercel with your admin email(s)
-- 2. The application will check if the user's email is in the ADMIN_EMAILS list
-- 3. Admin access is controlled at the application level, not database level for flexibility

-- ============================================
-- Optional: Create a view for admin analytics
-- ============================================
CREATE OR REPLACE VIEW public.application_stats AS
SELECT
  status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE first_hackathon = true) as first_time_hackers,
  COUNT(*) FILTER (WHERE education_level = 'High School') as high_school,
  COUNT(*) FILTER (WHERE education_level = 'Undergraduate') as undergraduate,
  COUNT(*) FILTER (WHERE education_level = 'Graduate') as graduate
FROM public.applicants
GROUP BY status;

-- Grant access to the view
GRANT SELECT ON public.application_stats TO authenticated;
