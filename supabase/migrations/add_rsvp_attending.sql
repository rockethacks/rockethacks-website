-- ============================================
-- Add RSVP attendance flag to applicants
-- ============================================

ALTER TABLE public.applicants
ADD COLUMN IF NOT EXISTS rsvp_attending BOOLEAN NOT NULL DEFAULT false;

-- RLS already enforces that authenticated users can only update rows where auth.uid() = user_id
-- (see existing "Users can update their own application" policy).
