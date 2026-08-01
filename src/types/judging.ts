// ============================================
// Judging Portal types (additive; applicants UserRole unchanged)
// ============================================

export type JudgeRole = 'judge' | 'head_judge';
export type TrackType = 'in_house' | 'sponsor';
export type CriteriaType = 'eligibility' | 'scored';
export type ProjectStatus = 'submitted' | 'no_show' | 'disqualified';
export type AssignmentStatus = 'assigned' | 'in_progress' | 'submitted';
export type CriteriaAppliesTo = 'in_house_shared' | 'sponsor';

export interface JudgeProfile {
  user_id: string;
  email: string;
  full_name: string | null;
  role: JudgeRole;
  industry: string | null;
  job_title: string | null;
  company: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  category: string | null;
  created_at: string;
}

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  sponsor_name: string | null;
  timer_seconds: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface CriteriaSet {
  id: string;
  name: string;
  applies_to: CriteriaAppliesTo;
  track_id: string | null;
  created_at: string;
}

export interface CriteriaItem {
  id: string;
  criteria_set_id: string;
  type: CriteriaType;
  title: string;
  description: string | null;
  max_points: number | null;
  sort_order: number;
  created_at: string;
}

export interface CriteriaBand {
  id: string;
  criteria_item_id: string;
  label: string;
  points: number;
  description: string | null;
  sort_order: number;
}

export interface Project {
  id: string;
  title: string;
  submission_url: string;
  about: string | null;
  video_url: string | null;
  github_url: string | null;
  table_number: string | null;
  main_track_id: string | null;
  status: ProjectStatus;
  submitted_at: string | null;
  imported_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectTeamMember {
  id: string;
  project_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  is_submitter: boolean;
}

export interface JudgeAssignment {
  id: string;
  judge_id: string;
  project_id: string;
  track_context_id: string;
  status: AssignmentStatus;
  notes: string | null;
  assigned_at: string;
  started_at: string | null;
  submitted_at: string | null;
}

export interface Score {
  id: string;
  assignment_id: string;
  criteria_item_id: string;
  eligibility_value: boolean | null;
  band_id: string | null;
  points_value: number | null;
  created_at: string;
  updated_at: string;
}

export interface Top3Pick {
  id: string;
  judge_id: string;
  project_id: string;
  rank: number;
  created_at: string;
}

export interface JudgeInvite {
  id: string;
  email: string;
  invite_code: string;
  role: JudgeRole;
  full_name: string | null;
  industry: string | null;
  job_title: string | null;
  company: string | null;
  used: boolean;
  expires_at: string;
  created_by: string | null;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  changed_by: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}
