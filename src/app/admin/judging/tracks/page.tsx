'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Track, TrackType } from '@/types/judging'
import {
  Banner,
  EmptyState,
  ExportButton,
  Field,
  Panel,
  Pill,
  inputClass,
  selectClass,
} from '@/components/judging/ui'
import { exportWorkbook, yesNo } from '@/lib/judging/export'

const emptyForm = {
  name: '',
  type: 'in_house' as TrackType,
  sponsor_name: '',
  sponsor_judges_only: false,
}

export default function TracksAdminPage() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [criteriaByTrack, setCriteriaByTrack] = useState<Record<string, boolean>>({})
  const [hasSharedSet, setHasSharedSet] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Track | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const [t, p, ps, cs] = await Promise.all([
      supabase.from('tracks').select('*').order('sort_order').order('name'),
      supabase.from('projects').select('id, main_track_id'),
      supabase.from('project_sponsor_tracks').select('track_id'),
      supabase.from('criteria_sets').select('id, applies_to, track_id'),
    ])
    if (t.error) setError(t.error.message)
    setTracks((t.data || []) as Track[])

    const map: Record<string, number> = {}
    for (const row of (p.data || []) as { main_track_id: string | null }[]) {
      if (row.main_track_id) map[row.main_track_id] = (map[row.main_track_id] || 0) + 1
    }
    for (const row of (ps.data || []) as { track_id: string }[]) {
      map[row.track_id] = (map[row.track_id] || 0) + 1
    }
    setCounts(map)

    const criteriaMap: Record<string, boolean> = {}
    let shared = false
    for (const row of (cs.data || []) as { applies_to: string; track_id: string | null }[]) {
      if (row.applies_to === 'in_house_shared') shared = true
      if (row.track_id) criteriaMap[row.track_id] = true
    }
    setCriteriaByTrack(criteriaMap)
    setHasSharedSet(shared)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const createTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    const supabase = createClient()
    const { error: iErr } = await supabase.from('tracks').insert({
      name: form.name.trim(),
      type: form.type,
      sponsor_name: form.type === 'sponsor' ? form.sponsor_name.trim() || form.name.trim() : null,
      sort_order: tracks.length,
      is_active: true,
      sponsor_judges_only: form.type === 'sponsor' ? form.sponsor_judges_only : false,
    })
    if (iErr) setError(iErr.message)
    else {
      setMessage(`Track "${form.name}" created.`)
      setForm(emptyForm)
      await load()
    }
    setSaving(false)
  }

  const patchTrack = async (track: Track, patch: Partial<Track>) => {
    const supabase = createClient()
    const { error: uErr } = await supabase.from('tracks').update(patch).eq('id', track.id)
    if (uErr) setError(uErr.message)
    else await load()
  }

  const deleteTrack = async () => {
    if (!confirmDelete) return
    const supabase = createClient()
    const { error: dErr } = await supabase.from('tracks').delete().eq('id', confirmDelete.id)
    if (dErr) setError(dErr.message)
    else {
      setMessage(`Deleted "${confirmDelete.name}".`)
      await load()
    }
    setConfirmDelete(null)
  }

  const exportTracks = () => {
    exportWorkbook('Tracks', [
      {
        name: 'Tracks',
        rows: tracks.map((t) => ({
          Track: t.name,
          Type: t.type === 'sponsor' ? 'Sponsor' : 'In-house',
          Sponsor: t.sponsor_name || '',
          'Judges per project': t.judges_per_project ?? 'Plan default',
          'Linked judges only': yesNo(t.sponsor_judges_only),
          Projects: counts[t.id] || 0,
          Rubric: (t.type === 'sponsor' ? criteriaByTrack[t.id] : hasSharedSet) ? 'Ready' : 'Missing',
          Active: yesNo(t.is_active),
          'Sort order': t.sort_order,
        })),
      },
    ])
  }

  return (
    <div className="space-y-6">
      {error && <Banner tone="error">{error}</Banner>}
      {message && <Banner tone="success">{message}</Banner>}

      <Banner tone="info">
        Tracks are the containers everything else hangs off. Create your in-house tracks and every
        sponsor prize track here first — criteria, imports, and assignments all reference them.
      </Banner>

      <Panel
        title="Add a track"
        description="In-house tracks are your own prize categories. Sponsor tracks are prizes a partner judges, and they get their own rubric."
      >
        <form onSubmit={createTrack} className="p-5 grid md:grid-cols-2 gap-4">
          <Field
            label="Track name"
            tip="trackNames"
            required
            hint="Use the exact name that appears in the Devpost Opt-In Prizes column, or imports will not match automatically."
          >
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="Best Use of AI"
            />
          </Field>

          <Field label="Type" hint="Sponsor tracks are judged against their own separate criteria set.">
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as TrackType })}
              className={selectClass}
            >
              <option value="in_house">In-house track</option>
              <option value="sponsor">Sponsor track</option>
            </select>
          </Field>

          {form.type === 'sponsor' && (
            <Field label="Sponsor name" hint="Company backing this prize. Shown to organizers only.">
              <input
                value={form.sponsor_name}
                onChange={(e) => setForm({ ...form, sponsor_name: e.target.value })}
                className={inputClass}
                placeholder="Acme Corp"
              />
            </Field>
          )}

          {form.type === 'sponsor' && (
            <Field
              label="Who fills this rubric"
              tip="linkedJudgesOnly"
              hint="Linked judges only means it cannot ride along on another judge's visit, so it costs extra stops. Set the links on the Judges tab."
            >
              <select
                value={form.sponsor_judges_only ? 'linked' : 'any'}
                onChange={(e) =>
                  setForm({ ...form, sponsor_judges_only: e.target.value === 'linked' })
                }
                className={selectClass}
              >
                <option value="any">Any judge at the table</option>
                <option value="linked">Linked judges only</option>
              </select>
            </Field>
          )}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition"
            >
              {saving ? 'Creating…' : 'Create track'}
            </button>
          </div>
        </form>
      </Panel>

      <Panel
        title={`Tracks (${tracks.length})`}
        description="Edit any field in place. Deactivate a track to hide it from planning without losing its data."
        actions={<ExportButton onClick={exportTracks} disabled={tracks.length === 0} />}
      >
        {tracks.length === 0 ? (
          <EmptyState
            title="No tracks yet"
            description="Add your in-house tracks first, then one track per sponsor prize. Nothing else in the judging portal works until at least one track exists."
          />
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm min-w-[720px]">
              <thead className="bg-white/5 text-gray-400">
                <tr>
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Fills it</th>
                  <th className="p-4 font-medium">Projects</th>
                  <th className="p-4 font-medium">Rubric</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tracks.map((t) => {
                  const hasRubric = t.type === 'sponsor' ? !!criteriaByTrack[t.id] : hasSharedSet
                  return (
                    <tr key={t.id} className="border-t border-white/10 text-white">
                      <td className="p-4">
                        <input
                          defaultValue={t.name}
                          onBlur={(e) => {
                            if (e.target.value.trim() && e.target.value !== t.name)
                              patchTrack(t, { name: e.target.value.trim() })
                          }}
                          className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-white/40 outline-none w-full"
                        />
                        {t.sponsor_name && (
                          <p className="text-xs text-gray-500 mt-0.5">{t.sponsor_name}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <Pill tone={t.type === 'sponsor' ? 'orange' : 'neutral'}>
                          {t.type === 'sponsor' ? 'Sponsor' : 'In-house'}
                        </Pill>
                      </td>
                      <td className="p-4">
                        {t.type === 'sponsor' ? (
                          <button
                            onClick={() =>
                              patchTrack(t, { sponsor_judges_only: !t.sponsor_judges_only })
                            }
                            className="text-left"
                          >
                            <Pill tone={t.sponsor_judges_only ? 'orange' : 'neutral'}>
                              {t.sponsor_judges_only ? 'Linked judges' : 'Any judge'}
                            </Pill>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500">Any judge</span>
                        )}
                      </td>
                      <td className="p-4 text-gray-300">{counts[t.id] || 0}</td>
                      <td className="p-4">
                        {hasRubric ? (
                          <Pill tone="green">Ready</Pill>
                        ) : (
                          <Pill tone="red">Missing</Pill>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => patchTrack(t, { is_active: !t.is_active })}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition"
                          >
                            {t.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(t)}
                            className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 rounded-lg text-xs font-semibold transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a1628] border border-white/10 rounded-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Delete “{confirmDelete.name}”?</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              This also deletes its criteria set, its sponsor opt-in links, and any assignments made
              against it. Scores recorded for those assignments are removed too. Deactivating is
              usually what you want instead.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={deleteTrack}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
