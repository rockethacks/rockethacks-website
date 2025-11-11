-- ============================================
-- Fix Corrupted School Data
-- ============================================
-- This script fixes any corrupted school names in the applicants table
-- Run this if you see garbled text in school names

-- Check for corrupted school names
SELECT id, user_id, email, school, 
       encode(school::bytea, 'hex') as school_hex
FROM public.applicants
WHERE school IS NOT NULL 
  AND school NOT SIMILAR TO '[A-Za-z0-9 \-\(\),''\.&]+';

-- Option 1: Clear corrupted school values (user will need to re-select)
-- Uncomment to run:
-- UPDATE public.applicants
-- SET school = NULL
-- WHERE school IS NOT NULL 
--   AND school NOT SIMILAR TO '[A-Za-z0-9 \-\(\),''\.&]+';

-- Option 2: Fix specific user's school value
-- Replace with correct school name from the MLH list
-- Uncomment and modify to run:
-- UPDATE public.applicants
-- SET school = 'University of Toledo'
-- WHERE user_id = '30383ac9-cdb7-41b6-973a-c24b2b8eb4de';

-- Verify the fix
SELECT id, user_id, email, first_name, last_name, school
FROM public.applicants
WHERE user_id = '30383ac9-cdb7-41b6-973a-c24b2b8eb4de';
