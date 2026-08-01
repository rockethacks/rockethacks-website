'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CriteriaBand, CriteriaItem, CriteriaSet, Track } from '@/types/judging'
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
import { exportWorkbook } from '@/lib/judging/export'

const DEFAULT_BANDS = [
  { label: 'Underachieving', points: 1, description: 'Barely addresses this criterion.' },
  { label: 'Developing', points: 2, description: 'Partially meets expectations.' },
  { label: 'Proficient', points: 3, description: 'Meets expectations well.' },
  { label: 'Exemplary', points: 4, description: 'Clearly exceeds expectations.' },
]

export default function CriteriaAdminPage() {
  const [sets, setSets] = useState<CriteriaSet[]>([])
  const [tracks, setTracks] = useState<Track[]>([])
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null)
  const [items, setItems] = useState<CriteriaItem[]>([])
  const [bandsByItem, setBandsByItem] = useState<Record<string, CriteriaBand[]>>({})
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [newSetName, setNewSetName] = useState('')
  const [newSetMode, setNewSetMode] = useState<'in_house_shared' | 'sponsor'>('in_house_shared')
  const [newSetTrackId, setNewSetTrackId] = useState('')
  const [confirmDeleteSet, setConfirmDeleteSet] = useState(false)

  const selectedSet = useMemo(
    () => sets.find((s) => s.id === selectedSetId) || null,
    [sets, selectedSetId]
  )
  const sharedSetExists = sets.some((s) => s.applies_to === 'in_house_shared')

  const loadSets = useCallback(async () => {
    const supabase = createClient()
    const [setRes, trackRes] = await Promise.all([
      supabase.from('criteria_sets').select('*').order('created_at'),
      supabase.from('tracks').select('*').order('sort_order').order('name'),
    ])
    if (setRes.error) setError(setRes.error.message)
    const list = (setRes.data || []) as CriteriaSet[]
    setSets(list)
    setTracks((trackRes.data || []) as Track[])
    setSelectedSetId((prev) => prev ?? list[0]?.id ?? null)
  }, [])

  const loadItems = useCallback(async (setId: string) => {
    const supabase = createClient()
    const { data, error: qErr } = await supabase
      .from('criteria_items')
      .select('*')
      .eq('criteria_set_id', setId)
      .order('sort_order')
    if (qErr) {
      setError(qErr.message)
      return
    }
    const list = (data || []) as CriteriaItem[]
    setItems(list)

    const scoredIds = list.filter((i) => i.type === 'scored').map((i) => i.id)
    if (scoredIds.length === 0) {
      setBandsByItem({})
      return
    }
    const { data: bands } = await supabase
      .from('criteria_bands')
      .select('*')
      .in('criteria_item_id', scoredIds)
      .order('sort_order')

    const map: Record<string, CriteriaBand[]> = {}
    for (const b of (bands || []) as CriteriaBand[]) {
      map[b.criteria_item_id] = [...(map[b.criteria_item_id] || []), b]
    }
    setBandsByItem(map)
  }, [])

  useEffect(() => {
    loadSets()
  }, [loadSets])

  useEffect(() => {
    if (selectedSetId) loadItems(selectedSetId)
  }, [selectedSetId, loadItems])

  const sponsorTracksWithoutSet = tracks.filter(
    (t) => t.type === 'sponsor' && !sets.some((s) => s.track_id === t.id)
  )

  const exportCriteria = async () => {
    const supabase = createClient()
    const { data: itemRows } = await supabase
      .from('criteria_items')
      .select('*')
      .order('sort_order')
    const allItems = (itemRows || []) as CriteriaItem[]
    const { data: bandRows } = await supabase
      .from('criteria_bands')
      .select('*')
      .order('sort_order')
    const allBands = (bandRows || []) as CriteriaBand[]

    const sheets = sets.map((set) => {
      const rows: Record<string, string | number | null>[] = []
      for (const item of allItems.filter((i) => i.criteria_set_id === set.id)) {
        if (item.type === 'eligibility') {
          rows.push({
            Criterion: item.title,
            Type: 'Eligibility',
            'Max points': '',
            Band: 'Yes / No gate',
            Points: '',
            Description: item.description || '',
          })
          continue
        }
        const bands = allBands.filter((b) => b.criteria_item_id === item.id)
        if (bands.length === 0) {
          rows.push({
            Criterion: item.title,
            Type: 'Scored',
            'Max points': item.max_points ?? '',
            Band: 'No bands configured',
            Points: '',
            Description: item.description || '',
          })
        }
        for (const band of bands) {
          rows.push({
            Criterion: item.title,
            Type: 'Scored',
            'Max points': item.max_points ?? '',
            Band: band.label,
            Points: band.points,
            Description: band.description || item.description || '',
          })
        }
      }
      return { name: set.name, rows }
    })

    if (!exportWorkbook('Rubrics', sheets)) setError('Nothing to export yet.')
  }

  const createSet = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    const supabase = createClient()
    const payload =
      newSetMode === 'in_house_shared'
        ? { name: newSetName.trim(), applies_to: 'in_house_shared', track_id: null }
        : { name: newSetName.trim(), applies_to: 'sponsor', track_id: newSetTrackId }

    const { data, error: iErr } = await supabase
      .from('criteria_sets')
      .insert(payload)
      .select()
      .single()

    if (iErr) setError(iErr.message)
    else {
      setNewSetName('')
      setNewSetTrackId('')
      await loadSets()
      if (data) setSelectedSetId(data.id)
      setMessage('Criteria set created. Add your criteria below.')
    }
  }

  const deleteSet = async () => {
    if (!selectedSet) return
    const supabase = createClient()
    const { error: dErr } = await supabase.from('criteria_sets').delete().eq('id', selectedSet.id)
    if (dErr) setError(dErr.message)
    else {
      setSelectedSetId(null)
      setItems([])
      await loadSets()
      setMessage('Criteria set deleted.')
    }
    setConfirmDeleteSet(false)
  }

  const addItem = async (type: 'eligibility' | 'scored') => {
    if (!selectedSetId) return
    const supabase = createClient()
    const { data, error: iErr } = await supabase
      .from('criteria_items')
      .insert({
        criteria_set_id: selectedSetId,
        type,
        title: type === 'eligibility' ? 'New eligibility check' : 'New criterion',
        description: '',
        max_points: type === 'scored' ? 4 : null,
        sort_order: items.length,
      })
      .select()
      .single()

    if (iErr) {
      setError(iErr.message)
      return
    }
    if (type === 'scored' && data) {
      await supabase.from('criteria_bands').insert(
        DEFAULT_BANDS.map((b, i) => ({
          criteria_item_id: data.id,
          label: b.label,
          points: b.points,
          description: b.description,
          sort_order: i,
        }))
      )
    }
    await loadItems(selectedSetId)
  }

  const updateItem = async (item: CriteriaItem, patch: Partial<CriteriaItem>) => {
    const supabase = createClient()
    const { error: uErr } = await supabase.from('criteria_items').update(patch).eq('id', item.id)
    if (uErr) setError(uErr.message)
    else if (selectedSetId) await loadItems(selectedSetId)
  }

  const moveItem = async (index: number, dir: -1 | 1) => {
    const j = index + dir
    if (j < 0 || j >= items.length) return
    const supabase = createClient()
    await supabase.from('criteria_items').update({ sort_order: j }).eq('id', items[index].id)
    await supabase.from('criteria_items').update({ sort_order: index }).eq('id', items[j].id)
    if (selectedSetId) await loadItems(selectedSetId)
  }

  const deleteItem = async (itemId: string) => {
    const supabase = createClient()
    await supabase.from('criteria_items').delete().eq('id', itemId)
    if (selectedSetId) await loadItems(selectedSetId)
  }

  const updateBand = async (band: CriteriaBand, patch: Partial<CriteriaBand>) => {
    const supabase = createClient()
    const { error: uErr } = await supabase.from('criteria_bands').update(patch).eq('id', band.id)
    if (uErr) setError(uErr.message)
    else if (selectedSetId) await loadItems(selectedSetId)
  }

  const addBand = async (item: CriteriaItem) => {
    const supabase = createClient()
    const existing = bandsByItem[item.id] || []
    await supabase.from('criteria_bands').insert({
      criteria_item_id: item.id,
      label: 'New band',
      points: (existing[existing.length - 1]?.points || 0) + 1,
      description: '',
      sort_order: existing.length,
    })
    if (selectedSetId) await loadItems(selectedSetId)
  }

  const deleteBand = async (bandId: string) => {
    const supabase = createClient()
    await supabase.from('criteria_bands').delete().eq('id', bandId)
    if (selectedSetId) await loadItems(selectedSetId)
  }

  const scoredItems = items.filter((i) => i.type === 'scored')
  const eligibilityItems = items.filter((i) => i.type === 'eligibility')

  const maxColumns = useMemo(
    () => Math.max(0, ...scoredItems.map((i) => (bandsByItem[i.id] || []).length)),
    [scoredItems, bandsByItem]
  )

  const maxTotal = useMemo(
    () =>
      scoredItems.reduce(
        (sum, i) => sum + Math.max(0, ...(bandsByItem[i.id] || []).map((b) => b.points), 0),
        0
      ),
    [scoredItems, bandsByItem]
  )

  const setLabel = (s: CriteriaSet) =>
    s.applies_to === 'in_house_shared'
      ? `${s.name} · all in-house tracks`
      : `${s.name} · ${tracks.find((t) => t.id === s.track_id)?.name || 'sponsor track'}`

  return (
    <div className="space-y-6">
      {error && <Banner tone="error">{error}</Banner>}
      {message && <Banner tone="success">{message}</Banner>}

      <Banner tone="info">
        All four in-house tracks share one rubric. Every sponsor track gets its own. Judges see these
        exact titles, descriptions, and point bands while scoring, so write them for someone reading
        on a phone at a noisy table.
      </Banner>

      {sponsorTracksWithoutSet.length > 0 && (
        <Banner tone="warning">
          These sponsor tracks have no rubric yet:{' '}
          {sponsorTracksWithoutSet.map((t) => t.name).join(', ')}. Judges assigned to them will see an
          empty score sheet.
        </Banner>
      )}

      <Panel
        title="Create a criteria set"
        description="A set is one rubric. Create the shared in-house set once, then one set per sponsor track."
      >
        <form onSubmit={createSet} className="p-5 grid md:grid-cols-3 gap-4">
          <Field
            label="Set name"
            required
            hint="Internal label, e.g. “RocketHacks 2026 Main Rubric” or “Acme AI Prize”."
          >
            <input
              required
              value={newSetName}
              onChange={(e) => setNewSetName(e.target.value)}
              className={inputClass}
              placeholder="RocketHacks 2026 Main Rubric"
            />
          </Field>

          <Field
            label="Applies to"
            hint={
              sharedSetExists
                ? 'A shared in-house set already exists — you normally only need one.'
                : 'Shared sets cover every in-house track at once.'
            }
          >
            <select
              value={newSetMode}
              onChange={(e) => setNewSetMode(e.target.value as 'in_house_shared' | 'sponsor')}
              className={selectClass}
            >
              <option value="in_house_shared">All in-house tracks (shared)</option>
              <option value="sponsor">One sponsor track</option>
            </select>
          </Field>

          {newSetMode === 'sponsor' ? (
            <Field label="Sponsor track" required hint="Only sponsor-type tracks can have their own set.">
              <select
                required
                value={newSetTrackId}
                onChange={(e) => setNewSetTrackId(e.target.value)}
                className={selectClass}
              >
                <option value="">Select track</option>
                {tracks
                  .filter((t) => t.type === 'sponsor')
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </Field>
          ) : (
            <div className="hidden md:block" />
          )}

          <div className="md:col-span-3">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              Create set
            </button>
          </div>
        </form>
      </Panel>

      {sets.length === 0 ? (
        <Panel>
          <EmptyState
            title="No rubrics yet"
            description="Create your shared in-house set above. Judges cannot score anything until at least one criteria set exists for the track they are assigned to."
          />
        </Panel>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {sets.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSetId(s.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
                  selectedSetId === s.id
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                {setLabel(s)}
              </button>
            ))}
          </div>

          {selectedSet && (
            <>
              <Panel
                title={selectedSet.name}
                tip="eligibility"
                description="Eligibility items are yes/no gates that do not add points. Scored items give judges one row of tappable bands."
                actions={
                  <div className="flex flex-wrap gap-2 items-center">
                    <ExportButton onClick={exportCriteria} label="Export all rubrics" />
                    <button
                      onClick={() => addItem('eligibility')}
                      title="Yes/no gates. If any fail, the sheet cannot win."
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition"
                    >
                      + Eligibility check
                    </button>
                    <button
                      onClick={() => addItem('scored')}
                      title="Point bands for a criterion. Judges pick a band; points feed the sheet total."
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
                    >
                      + Scored criterion
                    </button>
                    <button
                      onClick={() => setConfirmDeleteSet(true)}
                      className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition"
                    >
                      Delete set
                    </button>
                  </div>
                }
              >
                {items.length === 0 ? (
                  <EmptyState
                    title="This rubric is empty"
                    description="Add scored criteria for the things judges award points for, and eligibility checks for any hard requirements a sponsor has."
                  />
                ) : (
                  <div className="p-5 space-y-4">
                    {items.map((item, index) => (
                      <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                        <div className="flex flex-wrap gap-3 items-start justify-between">
                          <div className="flex-1 min-w-[220px] space-y-3">
                            <div className="flex items-center gap-2">
                              <Pill tone={item.type === 'scored' ? 'blue' : 'yellow'}>
                                {item.type === 'scored' ? 'Scored' : 'Eligibility'}
                              </Pill>
                              <span className="text-xs text-gray-500">#{index + 1}</span>
                            </div>
                            <Field label="Title" hint="Short and scannable — judges read this first.">
                              <input
                                defaultValue={item.title}
                                onBlur={(e) => {
                                  if (e.target.value !== item.title)
                                    updateItem(item, { title: e.target.value })
                                }}
                                className={inputClass}
                              />
                            </Field>
                            <Field
                              label="Description"
                              hint={
                                item.type === 'scored'
                                  ? 'Explain what you are judging. One or two sentences.'
                                  : 'State the requirement plainly, e.g. “Uses the sponsor API in the submitted build”.'
                              }
                            >
                              <textarea
                                defaultValue={item.description || ''}
                                onBlur={(e) => updateItem(item, { description: e.target.value })}
                                rows={2}
                                className={inputClass}
                              />
                            </Field>
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-1">
                              <button
                                onClick={() => moveItem(index, -1)}
                                disabled={index === 0}
                                className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white rounded text-sm transition"
                              >
                                ↑
                              </button>
                              <button
                                onClick={() => moveItem(index, 1)}
                                disabled={index === items.length - 1}
                                className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white rounded text-sm transition"
                              >
                                ↓
                              </button>
                            </div>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {item.type === 'scored' && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <p className="text-sm font-medium text-gray-200">Score bands</p>
                              <button
                                onClick={() => addBand(item)}
                                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition"
                              >
                                + Band
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">
                              Each band is one tappable option. The label and description are what a
                              judge reads to decide; the points are what gets recorded.
                            </p>
                            <div className="grid md:grid-cols-2 gap-2">
                              {(bandsByItem[item.id] || []).map((band) => (
                                <div key={band.id} className="bg-black/20 rounded-lg p-3 space-y-2">
                                  <div className="flex gap-2">
                                    <input
                                      defaultValue={band.label}
                                      onBlur={(e) => updateBand(band, { label: e.target.value })}
                                      className="flex-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white text-sm"
                                      placeholder="Band label"
                                    />
                                    <input
                                      type="number"
                                      defaultValue={band.points}
                                      onBlur={(e) =>
                                        updateBand(band, { points: Number(e.target.value) })
                                      }
                                      className="w-16 px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white text-sm"
                                    />
                                    <button
                                      onClick={() => deleteBand(band.id)}
                                      className="px-2 text-red-400 hover:text-red-300 text-sm"
                                      aria-label="Delete band"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                  <input
                                    defaultValue={band.description || ''}
                                    onBlur={(e) => updateBand(band, { description: e.target.value })}
                                    placeholder="What this band means"
                                    className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-gray-300 text-xs"
                                  />
                                </div>
                              ))}
                              {(bandsByItem[item.id] || []).length === 0 && (
                                <p className="text-xs text-red-300">
                                  No bands yet — judges would see nothing to tap. Add at least two.
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Panel>

              {scoredItems.length > 0 && (
                <Panel
                  title="Rubric at a glance"
                  description={`What judges can award. Maximum possible score: ${maxTotal} points across ${scoredItems.length} criteria${
                    eligibilityItems.length ? `, plus ${eligibilityItems.length} eligibility checks` : ''
                  }.`}
                >
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm text-left min-w-[640px]">
                      <thead className="bg-white/5 text-gray-400">
                        <tr>
                          <th className="p-3 font-medium">Criterion</th>
                          {Array.from({ length: maxColumns }).map((_, i) => (
                            <th key={i} className="p-3 font-medium">
                              Band {i + 1}
                            </th>
                          ))}
                          <th className="p-3 font-medium">Max</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scoredItems.map((item) => {
                          const bands = bandsByItem[item.id] || []
                          return (
                            <tr key={item.id} className="border-t border-white/10 text-white">
                              <td className="p-3">{item.title}</td>
                              {Array.from({ length: maxColumns }).map((_, i) => (
                                <td key={i} className="p-3 text-gray-300">
                                  {bands[i] ? (
                                    <>
                                      <span className="text-yellow-400 font-bold">{bands[i].points}</span>{' '}
                                      <span className="text-xs">{bands[i].label}</span>
                                    </>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                              ))}
                              <td className="p-3 text-yellow-400 font-bold">
                                {Math.max(0, ...bands.map((b) => b.points), 0)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              )}
            </>
          )}
        </>
      )}

      {confirmDeleteSet && selectedSet && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a1628] border border-white/10 rounded-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Delete “{selectedSet.name}”?</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Every criterion, band, and recorded score under this rubric is deleted. Do not do this
              once judging has started.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDeleteSet(false)}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={deleteSet}
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
