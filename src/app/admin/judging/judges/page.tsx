'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { JudgeInvite, JudgeProfile, JudgeRole, Tag } from '@/types/judging'
import {
  Banner,
  EmptyState,
  Field,
  Panel,
  Pill,
  inputClass,
  selectClass,
} from '@/components/judging/ui'

function randomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 8; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
  return out
}

type AssignmentRow = {
  id: string
  status: string
  project: { title: string; table_number: string | null } | null
  track: { name: string } | null
}

export default function JudgesAdminPage() {
  const [judges, setJudges] = useState<JudgeProfile[]>([])
  const [invites, setInvites] = useState<JudgeInvite[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [judgeTags, setJudgeTags] = useState<Record<string, string[]>>({})
  const [selected, setSelected] = useState<JudgeProfile | null>(null)
  const [assignments, setAssignments] = useState<AssignmentRow[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [creating, setCreating] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [origin, setOrigin] = useState('')

  const [form, setForm] = useState({
    email: '',
    full_name: '',
    industry: '',
    job_title: '',
    company: '',
    role: 'judge' as JudgeRole,
    expires_days: 7,
  })

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const load = useCallback(async () => {
    const supabase = createClient()
    const [j, i, t, jt] = await Promise.all([
      supabase.from('judge_profiles').select('*').order('full_name'),
      supabase.from('judge_invites').select('*').order('created_at', { ascending: false }),
      supabase.from('tags').select('*').order('name'),
      supabase.from('judge_tags').select('judge_id, tag_id'),
    ])
    if (j.error || i.error) setError(j.error?.message || i.error?.message || 'Failed to load')
    setJudges((j.data || []) as JudgeProfile[])
    setInvites((i.data || []) as JudgeInvite[])
    setTags((t.data || []) as Tag[])

    const map: Record<string, string[]> = {}
    for (const row of (jt.data || []) as { judge_id: string; tag_id: string }[]) {
      map[row.judge_id] = [...(map[row.judge_id] || []), row.tag_id]
    }
    setJudgeTags(map)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openJudge = async (judge: JudgeProfile) => {
    setSelected(judge)
    const supabase = createClient()
    const { data } = await supabase
      .from('judge_assignments')
      .select(
        `id, status, project:projects(title, table_number),
         track:tracks!judge_assignments_track_context_id_fkey(name)`
      )
      .eq('judge_id', judge.user_id)
    setAssignments((data || []) as unknown as AssignmentRow[])
  }

  const createInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setCreating(true)
    const supabase = createClient()
    const auth = await fetch('/api/auth/user').then((r) => r.json())
    const expires = new Date()
    expires.setDate(expires.getDate() + form.expires_days)
    const code = randomCode()

    const { error: iErr } = await supabase.from('judge_invites').insert({
      email: form.email.trim().toLowerCase(),
      invite_code: code,
      role: form.role,
      full_name: form.full_name.trim() || null,
      industry: form.industry.trim() || null,
      job_title: form.job_title.trim() || null,
      company: form.company.trim() || null,
      expires_at: expires.toISOString(),
      created_by: auth.user?.id || null,
    })

    if (iErr) {
      setError(iErr.message)
    } else {
      setMessage(`Invite ${code} created for ${form.email}. Copy the link below and send it to them.`)
      setForm({ ...form, email: '', full_name: '', industry: '', job_title: '', company: '' })
      await load()
    }
    setCreating(false)
  }

  const revokeInvite = async (id: string) => {
    const supabase = createClient()
    const { error: dErr } = await supabase.from('judge_invites').delete().eq('id', id)
    if (dErr) setError(dErr.message)
    else await load()
  }

  const copyInvite = async (invite: JudgeInvite) => {
    const link = `${origin}/judge/login?code=${invite.invite_code}`
    await navigator.clipboard.writeText(link)
    setMessage(`Copied sign-in link for ${invite.email}`)
  }

  const updateJudge = async (patch: Partial<JudgeProfile>) => {
    if (!selected) return
    const supabase = createClient()
    const { error: uErr } = await supabase
      .from('judge_profiles')
      .update(patch)
      .eq('user_id', selected.user_id)
    if (uErr) setError(uErr.message)
    else {
      setSelected({ ...selected, ...patch })
      await load()
    }
  }

  const toggleTag = async (tagId: string) => {
    if (!selected) return
    const supabase = createClient()
    const current = judgeTags[selected.user_id] || []
    if (current.includes(tagId)) {
      await supabase
        .from('judge_tags')
        .delete()
        .eq('judge_id', selected.user_id)
        .eq('tag_id', tagId)
    } else {
      await supabase.from('judge_tags').insert({ judge_id: selected.user_id, tag_id: tagId })
    }
    await load()
  }

  const addNewTag = async () => {
    const name = newTag.trim()
    if (!name || !selected) return
    const supabase = createClient()
    const { data, error: tErr } = await supabase
      .from('tags')
      .upsert({ name, category: 'expertise' }, { onConflict: 'name' })
      .select('id')
      .single()
    if (tErr) {
      setError(tErr.message)
      return
    }
    if (data) {
      await supabase
        .from('judge_tags')
        .upsert({ judge_id: selected.user_id, tag_id: data.id }, { onConflict: 'judge_id,tag_id' })
    }
    setNewTag('')
    await load()
  }

  const filteredJudges = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return judges
    return judges.filter((j) =>
      [j.full_name, j.email, j.company, j.industry, j.job_title]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q))
    )
  }, [judges, search])

  const openInvites = invites.filter((i) => !i.used && new Date(i.expires_at) > new Date())

  return (
    <div className="space-y-6">
      {error && <Banner tone="error">{error}</Banner>}
      {message && <Banner tone="success">{message}</Banner>}

      <Panel
        title="Invite a judge"
        description="Create an invite and send them the link. They set their own password with it, then sign in from the normal login page like everyone else."
      >
        <form onSubmit={createInvite} className="p-5 grid md:grid-cols-3 gap-4">
          <Field
            label="Email"
            required
            hint="Must be the address they will sign in with. The invite only works for this address."
          >
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
              placeholder="judge@company.com"
            />
          </Field>

          <Field label="Full name" hint="Shown to you on assignment screens. They can edit it later.">
            <input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className={inputClass}
              placeholder="Jordan Lee"
            />
          </Field>

          <Field
            label="Role"
            hint="Head judges can also open this judging admin area to fix assignments and review flags."
          >
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as JudgeRole })}
              className={selectClass}
            >
              <option value="judge">Judge</option>
              <option value="head_judge">Head judge</option>
            </select>
          </Field>

          <Field label="Industry" hint="Used for tag suggestions when matching judges to projects.">
            <input
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
              className={inputClass}
              placeholder="Fintech"
            />
          </Field>

          <Field label="Job title" hint="Context only — helps you balance senior and junior judges.">
            <input
              value={form.job_title}
              onChange={(e) => setForm({ ...form, job_title: e.target.value })}
              className={inputClass}
              placeholder="Staff Engineer"
            />
          </Field>

          <Field
            label="Company"
            hint="Also used as a conflict-of-interest hint when you review assignments."
          >
            <input
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className={inputClass}
              placeholder="Acme Corp"
            />
          </Field>

          <Field
            label="Invite valid for"
            hint="Short windows are safer. Expired codes stop working automatically."
            className="md:col-span-1"
          >
            <select
              value={form.expires_days}
              onChange={(e) => setForm({ ...form, expires_days: Number(e.target.value) })}
              className={selectClass}
            >
              <option value={1}>1 day</option>
              <option value={3}>3 days</option>
              <option value={7}>7 days (event weekend)</option>
              <option value={30}>30 days</option>
            </select>
          </Field>

          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={creating}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition"
            >
              {creating ? 'Creating…' : 'Create invite'}
            </button>
          </div>
        </form>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6">
        <Panel
          title={`Judges (${judges.length})`}
          description="Judges appear here after they open their invite link. Click one to edit their profile, tags, and assignments."
        >
          <div className="p-4 border-b border-white/10">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, company, industry…"
              className={inputClass}
            />
          </div>
          {filteredJudges.length === 0 ? (
            <EmptyState
              title={judges.length === 0 ? 'No judges yet' : 'No matches'}
              description={
                judges.length === 0
                  ? 'Create an invite above and send the link. Judges show up here the moment they activate it.'
                  : 'Try a different search term.'
              }
            />
          ) : (
            <ul className="divide-y divide-white/10 max-h-[420px] overflow-y-auto custom-scrollbar">
              {filteredJudges.map((j) => (
                <li key={j.user_id}>
                  <button onClick={() => openJudge(j)} className="w-full text-left p-4 hover:bg-white/5 transition">
                    <div className="flex justify-between gap-2 items-start">
                      <p className="text-white font-medium">{j.full_name || j.email}</p>
                      {j.role === 'head_judge' && <Pill tone="orange">Head judge</Pill>}
                    </div>
                    <p className="text-sm text-gray-400">
                      {[j.job_title, j.company, j.industry].filter(Boolean).join(' · ') || 'No profile details'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(judgeTags[j.user_id] || []).length} tags
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title={`Invites (${openInvites.length} open)`}
          description="Copy the link and email it to the judge. It opens a page where they set a password and activate judging in one step."
        >
          {invites.length === 0 ? (
            <EmptyState title="No invites yet" description="Invites you create will be listed here with a copyable link." />
          ) : (
            <ul className="divide-y divide-white/10 max-h-[480px] overflow-y-auto custom-scrollbar">
              {invites.map((inv) => {
                const expired = new Date(inv.expires_at) < new Date()
                return (
                  <li key={inv.id} className="p-4 space-y-2">
                    <div className="flex justify-between gap-3 items-start">
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">{inv.email}</p>
                        <p className="text-yellow-400 font-mono text-sm tracking-widest">
                          {inv.invite_code}
                        </p>
                      </div>
                      {inv.used ? (
                        <Pill tone="green">Activated</Pill>
                      ) : expired ? (
                        <Pill tone="red">Expired</Pill>
                      ) : (
                        <Pill tone="blue">Open</Pill>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {inv.role === 'head_judge' ? 'Head judge · ' : ''}
                      Expires {new Date(inv.expires_at).toLocaleString()}
                    </p>
                    {!inv.used && !expired && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyInvite(inv)}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition"
                        >
                          Copy sign-in link
                        </button>
                        <button
                          onClick={() => revokeInvite(inv.id)}
                          className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition"
                        >
                          Revoke
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>
      </div>

      {selected && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-[#0a1628] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-5">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h3 className="text-xl font-bold text-white">{selected.full_name || selected.email}</h3>
                  <p className="text-sm text-gray-400">{selected.email}</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm"
                >
                  Close
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Industry" hint="Saved when you click out of the field.">
                  <input
                    defaultValue={selected.industry || ''}
                    onBlur={(e) => updateJudge({ industry: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Job title">
                  <input
                    defaultValue={selected.job_title || ''}
                    onBlur={(e) => updateJudge({ job_title: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Company">
                  <input
                    defaultValue={selected.company || ''}
                    onBlur={(e) => updateJudge({ company: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Role" hint="Head judges can open this judging admin area.">
                  <select
                    value={selected.role}
                    onChange={(e) => updateJudge({ role: e.target.value as JudgeRole })}
                    className={selectClass}
                  >
                    <option value="judge">Judge</option>
                    <option value="head_judge">Head judge</option>
                  </select>
                </Field>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-200">Expertise tags</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Tags drive the auto-suggest matching: judges are preferred for projects sharing
                  their tags, but tags never leave a project short of judges.
                </p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const on = (judgeTags[selected.user_id] || []).includes(tag.id)
                    return (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                          on
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        {tag.name}
                      </button>
                    )
                  })}
                  {tags.length === 0 && (
                    <p className="text-xs text-gray-500">
                      No tags exist yet. Import projects (which creates tech tags) or add one below.
                    </p>
                  )}
                </div>
                <div className="flex gap-2 pt-1">
                  <input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag, e.g. Machine Learning"
                    className={inputClass}
                  />
                  <button
                    onClick={addNewTag}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-lg transition shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-200">
                  Assignments ({assignments.length})
                </p>
                {assignments.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    None yet. Use the Assignments tab to auto-suggest or hand-pick projects.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {assignments.map((a) => (
                      <li key={a.id} className="bg-white/5 rounded-lg p-3 text-sm text-gray-300">
                        {a.project?.title} · Table {a.project?.table_number || 'TBD'} · {a.track?.name}{' '}
                        <span className="text-yellow-400">{a.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
