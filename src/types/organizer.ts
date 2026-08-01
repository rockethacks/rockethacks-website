// Organizer / staff portal types (exclusive from applicants)

export type OrganizerRole = 'organizer' | 'admin';

export interface OrganizerProfile {
  user_id: string;
  email: string;
  full_name: string | null;
  role: OrganizerRole;
  created_at: string;
  updated_at: string;
}

export interface OrgTeam {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface OrganizerTeamMember {
  organizer_id: string;
  team_id: string;
  is_leader: boolean;
  created_at: string;
}

export interface OrganizerInviteTeamAssignment {
  team_id: string;
  is_leader: boolean;
}

export interface OrganizerInvite {
  id: string;
  email: string;
  invite_code: string;
  role: OrganizerRole;
  full_name: string | null;
  team_assignments: OrganizerInviteTeamAssignment[];
  used: boolean;
  expires_at: string;
  created_by: string | null;
  created_at: string;
}

export interface OrganizerProfileWithTeams extends OrganizerProfile {
  teams: Array<OrgTeam & { is_leader: boolean }>;
}
