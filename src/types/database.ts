// ============================================
// RocketHacks Database Type Definitions
// ============================================
// Auto-generated type definitions for Supabase database
// These types match the schema defined in supabase/schema.sql

export type UserRole = 'participant' | 'organizer' | 'admin';

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'waitlisted';

export type LevelOfStudy =
  | 'Less than Secondary / High School'
  | 'Secondary / High School'
  | 'Undergraduate University (2 year - community college or similar)'
  | 'Undergraduate University (3+ year)'
  | 'Graduate University (Masters, Professional, Doctoral, etc)'
  | 'Code School / Bootcamp'
  | 'Other Vocational / Trade Program or Apprenticeship'
  | 'Post Doctorate'
  | 'Other'
  | "I'm not currently a student"
  | 'Prefer not to answer';

// Main applicant record in database
export interface Applicant {
  // Primary Key
  id: string; // UUID

  // User reference
  user_id: string; // UUID - References auth.users(id)

  // Role & Permissions
  role: UserRole;

  // Check-in fields
  checked_in: boolean;
  checked_in_at: string | null; // ISO timestamp
  checked_in_by: string | null; // UUID - References auth.users(id)

  // Application status
  application_complete: boolean;

  // MLH Required Fields
  first_name: string;
  last_name: string;
  age: number;
  phone_number: string;
  email: string;
  school: string;
  level_of_study: LevelOfStudy;
  country_of_residence: string;

  // Professional Information
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;

  // Resume
  resume_url: string | null;
  resume_markdown: string | null;

  // MLH Required Checkboxes
  mlh_code_of_conduct: boolean;
  mlh_privacy_policy: boolean;
  mlh_marketing_emails: boolean;

  // Optional Demographic Fields
  dietary_restrictions: string[] | null;
  underrepresented_group: string | null;
  gender: string | null;
  pronouns: string | null;
  race_ethnicity: string[] | null;
  sexual_orientation: string | null;
  education_level: string | null;
  tshirt_size: string | null;

  // Shipping Address
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  shipping_country: string | null;
  postal_code: string | null;

  // Major/Field of Study
  major: string | null;

  // Hackathon Specific
  first_hackathon: boolean;
  team_name: string | null;
  special_accommodations: string | null;

  // Application Status
  status: ApplicationStatus;
  submitted_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp

  // Password setup flag (from migration)
  password_setup_completed: boolean;
}

// Partial applicant type for inserts (only required fields)
export interface ApplicantInsert {
  user_id: string;
  first_name: string;
  last_name: string;
  age: number;
  phone_number: string;
  email: string;
  school: string;
  level_of_study: LevelOfStudy;
  country_of_residence: string;
  mlh_code_of_conduct: boolean;
  mlh_privacy_policy: boolean;
  mlh_marketing_emails?: boolean;
  // All other fields are optional
  [key: string]: any;
}

// Partial applicant type for updates (all fields optional)
export interface ApplicantUpdate {
  id?: never; // Cannot update primary key
  user_id?: never; // Cannot update user_id
  first_name?: string;
  last_name?: string;
  age?: number;
  phone_number?: string;
  email?: string;
  school?: string;
  level_of_study?: LevelOfStudy;
  country_of_residence?: string;
  role?: UserRole;
  checked_in?: boolean;
  checked_in_at?: string | null;
  checked_in_by?: string | null;
  application_complete?: boolean;
  status?: ApplicationStatus;
  [key: string]: any;
}

// Applicant with organizer info (for check-in history)
export interface ApplicantWithOrganizerInfo extends Applicant {
  organizer_email?: string;
  organizer_name?: string;
}

// Application statistics view
export interface ApplicationStats {
  status: ApplicationStatus;
  count: number;
  first_time_hackers: number;
  high_school: number;
  undergraduate: number;
  graduate: number;
  complete_applications: number;
  incomplete_applications: number;
}

// Check-in statistics view
export interface CheckInStats {
  total_accepted: number;
  checked_in_count: number;
  not_checked_in_count: number;
  checkin_percentage: number;
}

// User authentication data from Supabase
export interface User {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  role?: UserRole; // Added from applicants table
  isAdmin?: boolean;
  isOrganizer?: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface UserWithRole extends User {
  role: UserRole;
  isAdmin: boolean;
  isOrganizer: boolean;
}

// Check-in operation payload
export interface CheckInPayload {
  applicant_id: string;
  checked_in: boolean;
  checked_in_by: string; // user_id of organizer/admin
}

// Role update payload
export interface RoleUpdatePayload {
  applicant_id: string;
  new_role: UserRole;
}

// Filter options for admin/organizer portals
export interface ApplicantFilters {
  status?: ApplicationStatus | 'all';
  role?: UserRole | 'all';
  checked_in?: boolean | 'all';
  application_complete?: boolean | 'all';
  search?: string; // Search by name, email, school
}

// Sorting options
export interface ApplicantSort {
  field: keyof Applicant;
  direction: 'asc' | 'desc';
}

// Pagination options
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

// Form validation errors
export interface FormErrors {
  [field: string]: string;
}

// Application completeness check result
export interface CompletenessCheck {
  isComplete: boolean;
  missingFields: string[];
  completionPercentage: number;
}

// Database function return types
export type GetUserRoleResult = UserRole;
export type CheckApplicationCompletenessResult = boolean;

// Supabase database schema type (for type-safe queries)
export interface Database {
  public: {
    Tables: {
      applicants: {
        Row: Applicant;
        Insert: ApplicantInsert;
        Update: ApplicantUpdate;
      };
    };
    Views: {
      application_stats: {
        Row: ApplicationStats;
      };
      checkin_stats: {
        Row: CheckInStats;
      };
    };
    Functions: {
      get_user_role: {
        Args: { user_uuid: string };
        Returns: GetUserRoleResult;
      };
      check_application_completeness: {
        Args: { applicant_id: string };
        Returns: CheckApplicationCompletenessResult;
      };
    };
  };
}

// Helper type for Supabase client with proper typing
export type TypedSupabaseClient = any; // Replace with actual Supabase client type

// Export a type guard to check if user is admin
export function isAdmin(user: User | UserWithRole | null): boolean {
  if (!user) return false;
  return (user as UserWithRole).role === 'admin' || (user as UserWithRole).isAdmin === true;
}

// Export a type guard to check if user is organizer
export function isOrganizer(user: User | UserWithRole | null): boolean {
  if (!user) return false;
  const userWithRole = user as UserWithRole;
  return (
    userWithRole.role === 'organizer' ||
    userWithRole.role === 'admin' ||
    userWithRole.isOrganizer === true ||
    userWithRole.isAdmin === true
  );
}

// Export a type guard to check if user can check-in participants
export function canCheckIn(user: User | UserWithRole | null): boolean {
  return isOrganizer(user);
}

// Export a type guard to check if user can manage roles
export function canManageRoles(user: User | UserWithRole | null): boolean {
  return isAdmin(user);
}
