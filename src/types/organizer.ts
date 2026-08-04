// Organizer / staff portal types (exclusive from applicants)

/** Privilege level. Portal tabs come from org team portal_key, not judging_team. */
export type OrganizerRole = 'organizer' | 'judging_team' | 'admin';

/** Roles offered when inviting / editing staff (judging_team is legacy only). */
export type AssignableOrganizerRole = 'organizer' | 'admin';

export const ORGANIZER_ROLE_LABELS: Record<OrganizerRole, string> = {
  organizer: 'Organizer',
  judging_team: 'Judging Team', // legacy; prefer Judging team membership
  admin: 'Admin',
};

export interface OrganizerProfile {
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: OrganizerRole;
  created_at: string;
  updated_at: string;
}

export interface OrgTeam {
  id: string;
  name: string;
  /** Stable key unlocking a staff portal tab (e.g. 'judging'). Null = roster tag only. */
  portal_key: string | null;
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
