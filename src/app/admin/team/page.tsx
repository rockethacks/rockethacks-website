'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  OrganizerInvite,
  OrganizerInviteTeamAssignment,
  OrganizerProfile,
  OrganizerRole,
  OrgTeam,
} from '@/types/organizer'
import { ORGANIZER_ROLE_LABELS } from '@/types/organizer'
import { CopyLinkButton } from '@/components/staff/CopyLinkButton'

function randomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 8; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
  return out
}

type MemberRow = OrganizerProfile & {
  teams: Array<{ team_id: string; name: string; is_leader: boolean }>
}

const inputClass =
  'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
const selectClass =
  'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-[#0a1628]'

export default function AdminTeamPage() {
  const [members, setMembers] = useState<MemberRow[]>([])
  const [invites, setInvites] = useState<OrganizerInvite[]>([])
  const [teams, setTeams] = useState<OrgTeam[]>([])
  const [selected, setSelected] = useState<MemberRow | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [origin, setOrigin] = useState('')
  const [search, setSearch] = useState('')

  const [inviteForm, setInviteForm] = useState({
    email: '',
    full_name: '',
    role: 'organizer' as OrganizerRole,
    expires_days: 14,
    teamIds: [] as string[],
    leaderTeamIds: [] as string[],
  })

  const [addForm, setAddForm] = useState({
    email: '',
    full_name: '',
    role: 'organizer' as OrganizerRole,
    teamIds: [] as string[],
    leaderTeamIds: [] as string[],
  })

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const load = useCallback(async () => {
    const supabase = createClient()
    const [p, i, t, m] = await Promise.all([
      supabase.from('organizer_profiles').select('*').order('full_name'),
      supabase.from('organizer_invites').select('*').order('created_at', { ascending: false }),
      supabase.from('org_teams').select('*').order('sort_order').order('name'),
      supabase.from('organizer_team_members').select('organizer_id, team_id, is_leader'),
    ])

    if (p.error || i.error || t.error || m.error) {
      setError(
        p.error?.message ||
          i.error?.message ||
          t.error?.message ||
          m.error?.message ||
          'Failed to load team data. Have the organizer portal migrations been applied?'
      )
    } else {
      setError('')
    }

    const teamList = (t.data || []) as OrgTeam[]
    setTeams(teamList)
    setInvites((i.data || []) as OrganizerInvite[])

    const teamById = Object.fromEntries(teamList.map((x) => [x.id, x]))
    const memberships = (m.data || []) as {
      organizer_id: string
      team_id: string
      is_leader: boolean
    }[]

    const rows: MemberRow[] = ((p.data || []) as OrganizerProfile[]).map((profile) => ({
      ...profile,
      teams: memberships
        .filter((row) => row.organizer_id === profile.user_id)
        .map((row) => ({
          team_id: row.team_id,
          name: teamById[row.team_id]?.name || 'Unknown',
          is_leader: row.is_leader,
        })),
    }))
    setMembers(rows)
    setSelected((prev) =>
      prev ? rows.find((r) => r.user_id === prev.user_id) || null : null
    )
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return members
    return members.filter(
      (m) =>
        m.email.toLowerCase().includes(q) ||
        (m.full_name || '').toLowerCase().includes(q) ||
        m.teams.some((t) => t.name.toLowerCase().includes(q))
    )
  }, [members, search])

  const buildAssignments = (teamIds: string[], leaderTeamIds: string[]): OrganizerInviteTeamAssignment[] =>
    teamIds.map((team_id) => ({
      team_id,
      is_leader: leaderTeamIds.includes(team_id),
    }))

  const createInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    const supabase = createClient()
    const auth = await fetch('/api/auth/user').then((r) => r.json())
    const expires = new Date()
    expires.setDate(expires.getDate() + inviteForm.expires_days)
    const code = randomCode()

    const { error: iErr } = await supabase.from('organizer_invites').insert({
      email: inviteForm.email.trim().toLowerCase(),
      invite_code: code,
      role: inviteForm.role,
      full_name: inviteForm.full_name.trim() || null,
      team_assignments: buildAssignments(inviteForm.teamIds, inviteForm.leaderTeamIds),
      expires_at: expires.toISOString(),
      created_by: auth.user?.id || null,
    })

    if (iErr) {
      setError(iErr.message)
    } else {
      setMessage(`Invite ${code} created for ${inviteForm.email}.`)
      setInviteForm({
        email: '',
        full_name: '',
        role: 'organizer',
        expires_days: 14,
        teamIds: [],
        leaderTeamIds: [],
      })
      await load()
    }
    setBusy(false)
  }

  const addExisting = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    const supabase = createClient()
    const { data, error: rpcError } = await supabase.rpc('add_organizer_by_email', {
      p_email: addForm.email.trim().toLowerCase(),
      p_role: addForm.role,
      p_full_name: addForm.full_name.trim() || null,
      p_team_assignments: buildAssignments(addForm.teamIds, addForm.leaderTeamIds),
    })

    if (rpcError) {
      setError(rpcError.message)
    } else {
      setMessage(`Added staff member (${data}).`)
      setAddForm({
        email: '',
        full_name: '',
        role: 'organizer',
        teamIds: [],
        leaderTeamIds: [],
      })
      await load()
    }
    setBusy(false)
  }

  const revokeInvite = async (id: string) => {
    const supabase = createClient()
    const { error: dErr } = await supabase.from('organizer_invites').delete().eq('id', id)
    if (dErr) setError(dErr.message)
    else await load()
  }

  const [draftTeamIds, setDraftTeamIds] = useState<string[]>([])
  const [draftLeaderIds, setDraftLeaderIds] = useState<string[]>([])

  useEffect(() => {
    if (!selected) {
      setDraftTeamIds([])
      setDraftLeaderIds([])
      return
    }
    setDraftTeamIds(selected.teams.map((t) => t.team_id))
    setDraftLeaderIds(selected.teams.filter((t) => t.is_leader).map((t) => t.team_id))
  }, [selected])

  const removeMember = async () => {
    if (!selected) return
    if (selected.role === 'admin') {
      const admins = members.filter((m) => m.role === 'admin')
      if (admins.length <= 1) {
        setError('Cannot remove the last admin.')
        return
      }
    }
    const ok = confirm(
      `Remove ${selected.full_name || selected.email} from staff?\n\nTheir login account stays; they lose organizer/admin access.`
    )
    if (!ok) return

    setBusy(true)
    const supabase = createClient()
    const { error: delErr } = await supabase
      .from('organizer_profiles')
      .delete()
      .eq('user_id', selected.user_id)
    if (delErr) setError(delErr.message)
    else {
      setSelected(null)
      setMessage('Staff member removed.')
      await load()
    }
    setBusy(false)
  }

  const updateSelectedRole = async (role: OrganizerRole) => {
    if (!selected) return
    setBusy(true)
    const supabase = createClient()
    const { error: uErr } = await supabase
      .from('organizer_profiles')
      .update({ role })
      .eq('user_id', selected.user_id)
    if (uErr) setError(uErr.message)
    else {
      setMessage('Role updated.')
      await load()
    }
    setBusy(false)
  }

  const syncTeamsForSelected = async (teamIds: string[], leaderIds: string[]) => {
    if (!selected) return
    setBusy(true)
    setError('')
    const supabase = createClient()
    await supabase.from('organizer_team_members').delete().eq('organizer_id', selected.user_id)
    if (teamIds.length) {
      const rows = teamIds.map((team_id) => ({
        organizer_id: selected.user_id,
        team_id,
        is_leader: leaderIds.includes(team_id),
      }))
      const { error: iErr } = await supabase.from('organizer_team_members').insert(rows)
      if (iErr) {
        setError(iErr.message)
        setBusy(false)
        return
      }
    }
    setMessage('Teams updated.')
    await load()
    setBusy(false)
  }

  const TeamPicker = ({
    teamIds,
    leaderIds,
    onChange,
  }: {
    teamIds: string[]
    leaderIds: string[]
    onChange: (next: { teamIds: string[]; leaderIds: string[] }) => void
  }) => (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-400 uppercase">Teams</p>
      <div className="flex flex-wrap gap-2">
        {teams.map((team) => {
          const on = teamIds.includes(team.id)
          const leader = leaderIds.includes(team.id)
          return (
            <div key={team.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  if (on) {
                    onChange({
                      teamIds: teamIds.filter((x) => x !== team.id),
                      leaderIds: leaderIds.filter((x) => x !== team.id),
                    })
                  } else {
                    onChange({
                      teamIds: [...teamIds, team.id],
                      leaderIds,
                    })
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  on
                    ? 'bg-blue-600/80 border-blue-500 text-white'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                {team.name}
              </button>
              {on && (
                <button
                  type="button"
                  title="Toggle team leader"
                  onClick={() =>
                    onChange({
                      teamIds,
                      leaderIds: leader
                        ? leaderIds.filter((x) => x !== team.id)
                        : [...leaderIds, team.id],
                    })
                  }
                  className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border uppercase ${
                    leader
                      ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
                      : 'bg-white/5 border-white/10 text-gray-400'
                  }`}
                >
                  Lead
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Team</h2>
        <p className="text-sm text-gray-400 mt-1">
          Invite organizers, assign team tags, and mark team leaders. Staff accounts are separate from hacker applications.
        </p>
      </div>

      {(error || message) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? 'border-red-500/40 bg-red-500/10 text-red-300'
              : 'border-green-500/40 bg-green-500/10 text-green-300'
          }`}
        >
          {error || message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={createInvite}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold text-white">Invite organizer</h3>
          <p className="text-xs text-gray-400">
            For people who do not have an account yet. They activate via the shared login page.
          </p>
          <input
            className={inputClass}
            placeholder="Email"
            type="email"
            required
            value={inviteForm.email}
            onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="Full name (optional)"
            value={inviteForm.full_name}
            onChange={(e) => setInviteForm({ ...inviteForm, full_name: e.target.value })}
          />
          <select
            className={selectClass}
            value={inviteForm.role}
            onChange={(e) =>
              setInviteForm({ ...inviteForm, role: e.target.value as OrganizerRole })
            }
          >
            <option value="organizer">Organizer</option>
            <option value="judging_team">Judging Team</option>
            <option value="admin">Admin</option>
          </select>
          <TeamPicker
            teamIds={inviteForm.teamIds}
            leaderIds={inviteForm.leaderTeamIds}
            onChange={({ teamIds, leaderIds }) =>
              setInviteForm((prev) => ({
                ...prev,
                teamIds,
                leaderTeamIds: leaderIds,
              }))
            }
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition"
          >
            Create invite
          </button>
        </form>

        <form
          onSubmit={addExisting}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold text-white">Add existing account</h3>
          <p className="text-xs text-gray-400">
            For someone who already has a login but no hacker application. Staff emails only.
          </p>
          <input
            className={inputClass}
            placeholder="Email"
            type="email"
            required
            value={addForm.email}
            onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="Full name (optional)"
            value={addForm.full_name}
            onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
          />
          <select
            className={selectClass}
            value={addForm.role}
            onChange={(e) => setAddForm({ ...addForm, role: e.target.value as OrganizerRole })}
          >
            <option value="organizer">Organizer</option>
            <option value="judging_team">Judging Team</option>
            <option value="admin">Admin</option>
          </select>
          <TeamPicker
            teamIds={addForm.teamIds}
            leaderIds={addForm.leaderTeamIds}
            onChange={({ teamIds, leaderIds }) =>
              setAddForm((prev) => ({
                ...prev,
                teamIds,
                leaderTeamIds: leaderIds,
              }))
            }
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full px-4 py-2.5 bg-white/10 hover:bg-white/15 disabled:opacity-50 border border-white/10 text-white font-semibold rounded-lg transition"
          >
            Add to staff
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-white">Staff members</h3>
            <input
              className={`${inputClass} sm:max-w-xs`}
              placeholder="Search name, email, team…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="divide-y divide-white/10 max-h-[480px] overflow-y-auto">
            {filteredMembers.map((m) => (
              <button
                key={m.user_id}
                type="button"
                onClick={() => setSelected(m)}
                className={`w-full text-left px-4 py-3 hover:bg-white/5 transition ${
                  selected?.user_id === m.user_id ? 'bg-white/10' : ''
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-white">
                    {m.full_name || m.email}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      m.role === 'admin'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : m.role === 'judging_team'
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-blue-500/20 text-blue-300'
                    }`}
                  >
                    {ORGANIZER_ROLE_LABELS[m.role] || m.role}
                  </span>
                </div>
                <div className="text-sm text-gray-400">{m.email}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {m.teams.map((t) => (
                    <span
                      key={t.team_id}
                      className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-gray-300"
                    >
                      {t.name}
                      {t.is_leader ? ' · Lead' : ''}
                    </span>
                  ))}
                  {m.teams.length === 0 && (
                    <span className="text-[10px] text-gray-500">No teams</span>
                  )}
                </div>
              </button>
            ))}
            {filteredMembers.length === 0 && (
              <div className="px-4 py-10 text-center text-gray-400 text-sm">No staff members yet.</div>
            )}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <h3 className="text-lg font-semibold text-white">Member detail</h3>
          {!selected ? (
            <p className="text-sm text-gray-400">Select a staff member to edit role and teams.</p>
          ) : (
            <>
              <div>
                <p className="text-white font-semibold">{selected.full_name || '—'}</p>
                <p className="text-sm text-gray-400">{selected.email}</p>
              </div>
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase">Role</span>
                <select
                  className={selectClass}
                  value={selected.role}
                  disabled={busy}
                  onChange={(e) => updateSelectedRole(e.target.value as OrganizerRole)}
                >
                  <option value="organizer">Organizer</option>
                  <option value="judging_team">Judging Team</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <TeamPicker
                teamIds={draftTeamIds}
                leaderIds={draftLeaderIds}
                onChange={({ teamIds, leaderIds }) => {
                  setDraftTeamIds(teamIds)
                  setDraftLeaderIds(leaderIds)
                }}
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => syncTeamsForSelected(draftTeamIds, draftLeaderIds)}
                className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
              >
                Save teams
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={removeMember}
                className="w-full px-4 py-2.5 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
              >
                Remove from staff
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Open invites</h3>
        </div>
        <div className="divide-y divide-white/10">
          {invites.map((inv) => (
            <div
              key={inv.id}
              className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div>
                <div className="text-white font-medium">
                  {inv.full_name || inv.email}{' '}
                  <span className="text-xs text-gray-400 uppercase">
                    {ORGANIZER_ROLE_LABELS[inv.role] || inv.role}
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  {inv.email} · code {inv.invite_code} ·{' '}
                  {inv.used ? 'used' : `expires ${new Date(inv.expires_at).toLocaleDateString()}`}
                </div>
              </div>
              <div className="flex gap-2">
                {!inv.used && (
                  <CopyLinkButton
                    text={`${origin}/login?org_code=${inv.invite_code}`}
                    label="Copy link"
                  />
                )}
                <button
                  type="button"
                  onClick={() => revokeInvite(inv.id)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold rounded-lg"
                >
                  Revoke
                </button>
              </div>
            </div>
          ))}
          {invites.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">No invites yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}
