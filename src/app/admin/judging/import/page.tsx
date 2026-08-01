'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { JudgeProfile, JudgingSettings, Project, Track } from '@/types/judging'
import {
  Banner,
  EmptyState,
  ExportButton,
  Field,
  HelpTip,
  Panel,
  Pill,
  inputClass,
  selectClass,
} from '@/components/judging/ui'
import { exportWorkbook } from '@/lib/judging/export'
import { clusterAssignTables, nextTableNumber } from '@/lib/judging/tables'
import {
  FALLBACK_SETTINGS,
  buildVisits,
  formatDuration,
  type AssignmentLite,
} from '@/lib/judging/visits'

const SYSTEM_FIELDS = [
  { key: 'title', label: 'Project title' },
  { key: 'submission_url', label: 'Submission URL (dedupe key)' },
  { key: 'about', label: 'About / description' },
  { key: 'video_url', label: 'Demo video URL' },
  { key: 'github_url', label: 'Code repository URL' },
  { key: 'opt_in_prizes', label: 'Opt-in prizes (sponsor tracks)' },
  { key: 'main_track', label: 'Main track' },
  { key: 'built_with', label: 'Built with (creates tags)' },
  { key: 'table_number', label: 'Table number' },
  { key: 'skip', label: '— ignore this column —' },
] as const

type SystemKey = (typeof SYSTEM_FIELDS)[number]['key']

type Validation = {
  usableRows: number
  skippedRows: number
  newProjects: number
  updatedProjects: number
  unmatchedPrizes: string[]
  unmatchedTracks: string[]
  duplicateUrls: string[]
}

function sanitizeCell(value: string): string {
  const v = (value || '').trim()
  return /^[=+\-@]/.test(v) ? `'${v}` : v
}

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"'
        i++
      } else if (ch === '"') inQuotes = false
      else cell += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ',') {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      if (ch === '\r') i++
    } else if (ch !== '\r') cell += ch
  }
  if (cell.length || row.length) {
    row.push(cell)
    rows.push(row)
  }
  const headers = (rows.shift() || []).map((h) => h.trim())
  return { headers, rows: rows.filter((r) => r.some((c) => c.trim())) }
}

function guessMapping(headers: string[]): Record<string, SystemKey> {
  const map: Record<string, SystemKey> = {}
  for (const h of headers) {
    const l = h.toLowerCase()
    if (/team member/i.test(h)) map[h] = 'skip'
    else if (l.includes('project title') || l === 'title') map[h] = 'title'
    else if (l.includes('submission url') || l.includes('project url')) map[h] = 'submission_url'
    else if (l.includes('about') || l.includes('description') || l.includes('elevator')) map[h] = 'about'
    else if (l.includes('video')) map[h] = 'video_url'
    else if (l.includes('github') || l.includes('repo') || l.includes('try it out')) map[h] = 'github_url'
    else if (l.includes('opt-in') || l.includes('opt in') || l.includes('desired prizes')) map[h] = 'opt_in_prizes'
    else if (l.includes('built with')) map[h] = 'built_with'
    else if (l.includes('table')) map[h] = 'table_number'
    else if (l.includes('track') || l.includes('category')) map[h] = 'main_track'
    else map[h] = 'skip'
  }
  return map
}

function splitList(raw: string): string[] {
  return (raw || '')
    .split(/[;,|]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export default function ImportAdminPage() {
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<string, SystemKey>>({})
  const [tracks, setTracks] = useState<Track[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [judges, setJudges] = useState<JudgeProfile[]>([])
  const [assignments, setAssignments] = useState<AssignmentLite[]>([])
  const [judgeTrackLinks, setJudgeTrackLinks] = useState<Record<string, string[]>>({})
  const [settings, setSettings] = useState<JudgingSettings>(FALLBACK_SETTINGS)
  const [validation, setValidation] = useState<Validation | null>(null)
  const [checking, setChecking] = useState(false)
  const [importing, setImporting] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [manual, setManual] = useState({
    title: '',
    submission_url: '',
    about: '',
    video_url: '',
    github_url: '',
    main_track_id: '',
    built_with: '',
    member_first: '',
    member_last: '',
    member_email: '',
  })
  const [manualSponsors, setManualSponsors] = useState<string[]>([])
  const [manualJudges, setManualJudges] = useState<string[]>([])

  const loadContext = useCallback(async () => {
    const supabase = createClient()
    const [trackRes, projectRes, judgeRes, assignRes, settingsRes, jtRes] = await Promise.all([
      supabase.from('tracks').select('*').order('sort_order').order('name'),
      supabase.from('projects').select('*').order('table_number'),
      supabase.from('judge_profiles').select('*').order('full_name'),
      supabase.from('judge_assignments').select('id, judge_id, project_id, track_context_id, status'),
      supabase.from('judging_settings').select('*').eq('id', true).maybeSingle(),
      supabase.from('judge_tracks').select('judge_id, track_id'),
    ])
    setTracks((trackRes.data || []) as Track[])
    setProjects((projectRes.data || []) as Project[])
    setJudges((judgeRes.data || []) as JudgeProfile[])
    setAssignments((assignRes.data || []) as AssignmentLite[])
    if (settingsRes.data) setSettings(settingsRes.data as JudgingSettings)

    const linkMap: Record<string, string[]> = {}
    for (const row of (jtRes.data || []) as { judge_id: string; track_id: string }[]) {
      linkMap[row.judge_id] = [...(linkMap[row.judge_id] || []), row.track_id]
    }
    setJudgeTrackLinks(linkMap)
  }, [])

  useEffect(() => {
    loadContext()
  }, [loadContext])

  const inHouseTracks = useMemo(() => tracks.filter((t) => t.type === 'in_house' && t.is_active), [tracks])
  const sponsorTracks = useMemo(() => tracks.filter((t) => t.type === 'sponsor' && t.is_active), [tracks])

  const trackById = useMemo(() => new Map(tracks.map((t) => [t.id, t])), [tracks])

  const suggestedTable = useMemo(() => nextTableNumber(projects), [projects])

  const trackIdsForManual = useMemo(() => {
    const ids = [...manualSponsors]
    if (manual.main_track_id) ids.unshift(manual.main_track_id)
    return Array.from(new Set(ids))
  }, [manual.main_track_id, manualSponsors])

  const judgeWorkload = useMemo(() => {
    const visits = buildVisits(assignments, trackById, settings)
    const byJudge = new Map<string, { visits: number; seconds: number }>()
    for (const v of visits) {
      const entry = byJudge.get(v.judgeId) || { visits: 0, seconds: 0 }
      entry.visits += 1
      entry.seconds += v.seconds
      byJudge.set(v.judgeId, entry)
    }

    const restrictedNeeded = trackIdsForManual.filter(
      (id) => trackById.get(id)?.sponsor_judges_only
    )

    return judges
      .map((j) => {
        const load = byJudge.get(j.user_id) || { visits: 0, seconds: 0 }
        const linked = judgeTrackLinks[j.user_id] || []
        const blockedRestricted = restrictedNeeded.some((tid) => !linked.includes(tid))
        return { judge: j, ...load, blockedRestricted }
      })
      .sort((a, b) => a.visits - b.visits || a.seconds - b.seconds || (a.judge.full_name || '').localeCompare(b.judge.full_name || ''))
  }, [assignments, judges, judgeTrackLinks, settings, trackById, trackIdsForManual])

  const toggleManualSponsor = (trackId: string) => {
    setManualSponsors((prev) =>
      prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId]
    )
  }

  const toggleManualJudge = (judgeId: string) => {
    setManualJudges((prev) =>
      prev.includes(judgeId) ? prev.filter((id) => id !== judgeId) : [...prev, judgeId]
    )
  }

  const pickLightestJudges = () => {
    const eligible = judgeWorkload.filter((j) => !j.blockedRestricted).slice(0, 3)
    setManualJudges(eligible.map((j) => j.judge.user_id))
  }

  const addManualProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    const title = manual.title.trim()
    const url = manual.submission_url.trim()
    if (!title || !url) {
      setError('Title and submission URL are required.')
      return
    }
    if (!manual.main_track_id && manualSponsors.length === 0) {
      setError('Pick a main track and/or at least one sponsor track so judges have rubrics to fill.')
      return
    }

    const blocked = manualJudges.filter((id) =>
      judgeWorkload.find((j) => j.judge.user_id === id)?.blockedRestricted
    )
    if (blocked.length > 0) {
      setError(
        'One or more selected judges are not linked to a Linked-judges-only sponsor track on this project.'
      )
      return
    }

    setAdding(true)
    const supabase = createClient()
    const tableNumber = suggestedTable

    const { data: project, error: pErr } = await supabase
      .from('projects')
      .insert({
        title,
        submission_url: url,
        about: manual.about.trim() || null,
        video_url: manual.video_url.trim() || null,
        github_url: manual.github_url.trim() || null,
        main_track_id: manual.main_track_id || null,
        table_number: tableNumber,
        status: 'submitted',
        imported_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (pErr || !project) {
      setError(
        pErr?.message?.includes('duplicate') || pErr?.code === '23505'
          ? 'That submission URL already exists. Use CSV import to update it, or pick a unique URL.'
          : pErr?.message || 'Could not create the project.'
      )
      setAdding(false)
      return
    }

    if (manualSponsors.length > 0) {
      const { error: sErr } = await supabase.from('project_sponsor_tracks').insert(
        manualSponsors.map((track_id) => ({ project_id: project.id, track_id }))
      )
      if (sErr) {
        setError(sErr.message)
        setAdding(false)
        return
      }
    }

    if (manual.member_email.trim() || manual.member_first.trim() || manual.member_last.trim()) {
      const { error: mErr } = await supabase.from('project_team_members').insert({
        project_id: project.id,
        first_name: manual.member_first.trim() || null,
        last_name: manual.member_last.trim() || null,
        email: manual.member_email.trim().toLowerCase() || null,
        is_submitter: true,
      })
      if (mErr) {
        setError(mErr.message)
        setAdding(false)
        return
      }
    }

    const tagNames = [
      ...splitList(manual.built_with),
      ...(manual.main_track_id
        ? [tracks.find((t) => t.id === manual.main_track_id)?.name].filter(Boolean)
        : []),
      ...manualSponsors.map((id) => tracks.find((t) => t.id === id)?.name).filter(Boolean),
    ] as string[]

    if (tagNames.length > 0) {
      const unique = Array.from(new Set(tagNames.map((n) => n.trim()).filter(Boolean)))
      const tagIds: string[] = []
      for (const name of unique) {
        const { data: tag, error: tErr } = await supabase
          .from('tags')
          .upsert({ name, category: 'expertise' }, { onConflict: 'name' })
          .select('id')
          .single()
        if (tErr) {
          setError(tErr.message)
          setAdding(false)
          return
        }
        if (tag) tagIds.push(tag.id)
      }
      if (tagIds.length > 0) {
        await supabase.from('project_tags').upsert(
          tagIds.map((tag_id) => ({ project_id: project.id, tag_id })),
          { onConflict: 'project_id,tag_id' }
        )
      }
    }

    const sheets = trackIdsForManual.flatMap((track_context_id) =>
      manualJudges.map((judge_id) => ({
        judge_id,
        project_id: project.id,
        track_context_id,
        status: 'assigned' as const,
      }))
    )

    if (sheets.length > 0) {
      const { error: aErr } = await supabase.from('judge_assignments').insert(sheets)
      if (aErr) {
        setError(aErr.message)
        setAdding(false)
        return
      }
    }

    setMessage(
      `Added “${title}” at ${tableNumber}` +
        (manualJudges.length
          ? ` with ${manualJudges.length} judge${manualJudges.length === 1 ? '' : 's'} (${sheets.length} sheet${sheets.length === 1 ? '' : 's'}).`
          : '. No judges assigned yet — pick them here or on Assignments / Tables.') +
        ' It appears last on Tables; run Reseat for short walks when you want the floor re-packed.'
    )
    setManual({
      title: '',
      submission_url: '',
      about: '',
      video_url: '',
      github_url: '',
      main_track_id: '',
      built_with: '',
      member_first: '',
      member_last: '',
      member_email: '',
    })
    setManualSponsors([])
    setManualJudges([])
    await loadContext()
    setAdding(false)
  }

  const colIndex = useCallback((header: string) => headers.indexOf(header), [headers])

  const mappedHeader = useCallback(
    (key: SystemKey) => Object.entries(mapping).find(([, v]) => v === key)?.[0] || null,
    [mapping]
  )

  const teamMemberGroups = useMemo(() => {
    const groups = new Map<number, { first?: string; last?: string; email?: string }>()
    for (const h of headers) {
      const m = h.match(/team member\s+(\d+)\s+(first name|last name|email)/i)
      if (!m) continue
      const n = Number(m[1])
      const g = groups.get(n) || {}
      const kind = m[2].toLowerCase()
      if (kind === 'first name') g.first = h
      if (kind === 'last name') g.last = h
      if (kind === 'email') g.email = h
      groups.set(n, g)
    }
    return groups
  }, [headers])

  const cellOf = useCallback(
    (row: string[], key: SystemKey) => {
      const h = mappedHeader(key)
      if (!h) return ''
      return sanitizeCell(row[colIndex(h)] || '')
    },
    [colIndex, mappedHeader]
  )

  const onFile = async (file: File) => {
    setError('')
    setMessage('')
    setValidation(null)
    setProgress(0)
    const text = await file.text()
    const parsed = parseCsv(text)
    if (parsed.headers.length === 0) {
      setError('That file has no header row.')
      return
    }
    setFileName(file.name)
    setHeaders(parsed.headers)
    setRows(parsed.rows)
    setMapping(guessMapping(parsed.headers))
  }

  const validate = async () => {
    setChecking(true)
    setError('')
    setMessage('')

    if (!mappedHeader('title') || !mappedHeader('submission_url')) {
      setError('Map both “Project title” and “Submission URL” before continuing.')
      setChecking(false)
      return
    }

    const sponsorTracks = tracks.filter((t) => t.type === 'sponsor')
    const inHouseTracks = tracks.filter((t) => t.type === 'in_house')
    const unmatchedPrizes = new Set<string>()
    const unmatchedTracks = new Set<string>()
    const seen = new Map<string, number>()
    let usable = 0

    for (const row of rows) {
      const url = cellOf(row, 'submission_url')
      const title = cellOf(row, 'title')
      if (!url || !title) continue
      usable++
      seen.set(url, (seen.get(url) || 0) + 1)

      for (const prize of splitList(cellOf(row, 'opt_in_prizes'))) {
        if (!sponsorTracks.some((t) => t.name.toLowerCase() === prize.toLowerCase()))
          unmatchedPrizes.add(prize)
      }
      const mainTrack = cellOf(row, 'main_track')
      if (mainTrack && !inHouseTracks.some((t) => t.name.toLowerCase() === mainTrack.toLowerCase()))
        unmatchedTracks.add(mainTrack)
    }

    const urls = Array.from(seen.keys())
    const supabase = createClient()
    const existing = new Set<string>()
    for (const part of chunk(urls, 200)) {
      const { data } = await supabase.from('projects').select('submission_url').in('submission_url', part)
      for (const r of (data || []) as { submission_url: string }[]) existing.add(r.submission_url)
    }

    setValidation({
      usableRows: usable,
      skippedRows: rows.length - usable,
      newProjects: urls.filter((u) => !existing.has(u)).length,
      updatedProjects: urls.filter((u) => existing.has(u)).length,
      unmatchedPrizes: Array.from(unmatchedPrizes),
      unmatchedTracks: Array.from(unmatchedTracks),
      duplicateUrls: Array.from(seen.entries())
        .filter(([, n]) => n > 1)
        .map(([u]) => u),
    })
    setChecking(false)
  }

  const runImport = async () => {
    setImporting(true)
    setError('')
    setMessage('')
    setProgress(0)

    const supabase = createClient()
    const sponsorTracks = tracks.filter((t) => t.type === 'sponsor')
    const inHouseTracks = tracks.filter((t) => t.type === 'in_house')

    const payloads: Record<string, unknown>[] = []
    const byUrl = new Map<
      string,
      {
        prizes: string[]
        tech: string[]
        /** Track names stored as tags so affinity has something to match when Built With is empty. */
        domains: string[]
        members: { first: string; last: string; email: string }[]
      }
    >()

    for (const row of rows) {
      const submission_url = cellOf(row, 'submission_url')
      const title = cellOf(row, 'title')
      if (!submission_url || !title) continue

      const mainTrackName = cellOf(row, 'main_track')
      const mainTrack = inHouseTracks.find(
        (t) => t.name.toLowerCase() === mainTrackName.toLowerCase()
      )

      const payload: Record<string, unknown> = { title, submission_url }
      if (mappedHeader('about')) payload.about = cellOf(row, 'about') || null
      if (mappedHeader('video_url')) payload.video_url = cellOf(row, 'video_url') || null
      if (mappedHeader('github_url')) payload.github_url = cellOf(row, 'github_url') || null
      if (mappedHeader('table_number')) payload.table_number = cellOf(row, 'table_number') || null
      if (mainTrack) payload.main_track_id = mainTrack.id
      payload.imported_at = new Date().toISOString()
      payloads.push(payload)

      const members: { first: string; last: string; email: string }[] = []
      for (const [, cols] of teamMemberGroups) {
        const first = cols.first ? sanitizeCell(row[colIndex(cols.first)] || '') : ''
        const last = cols.last ? sanitizeCell(row[colIndex(cols.last)] || '') : ''
        const email = cols.email ? sanitizeCell(row[colIndex(cols.email)] || '') : ''
        if (first || last || email) members.push({ first, last, email })
      }

      byUrl.set(submission_url, {
        prizes: splitList(cellOf(row, 'opt_in_prizes')),
        tech: splitList(cellOf(row, 'built_with')),
        domains: mainTrack ? [mainTrack.name] : [],
        members,
      })
    }

    if (payloads.length === 0) {
      setError('Nothing to import — no rows had both a title and a submission URL.')
      setImporting(false)
      return
    }

    try {
      const idByUrl = new Map<string, string>()
      const batches = chunk(payloads, 100)
      for (let i = 0; i < batches.length; i++) {
        const { data, error: pErr } = await supabase
          .from('projects')
          .upsert(batches[i], { onConflict: 'submission_url' })
          .select('id, submission_url')
        if (pErr) throw pErr
        for (const r of (data || []) as { id: string; submission_url: string }[])
          idByUrl.set(r.submission_url, r.id)
        setProgress(Math.round(((i + 1) / batches.length) * 50))
      }

      const projectIds = Array.from(idByUrl.values())

      const memberRows: Record<string, unknown>[] = []
      const sponsorRows: { project_id: string; track_id: string }[] = []
      const techNames = new Set<string>()
      const domainNames = new Set<string>()

      for (const [url, extra] of byUrl) {
        const pid = idByUrl.get(url)
        if (!pid) continue
        extra.members.forEach((m, idx) =>
          memberRows.push({
            project_id: pid,
            first_name: m.first || null,
            last_name: m.last || null,
            email: m.email || null,
            is_submitter: idx === 0,
          })
        )
        for (const prize of extra.prizes) {
          const track = sponsorTracks.find((t) => t.name.toLowerCase() === prize.toLowerCase())
          if (track) {
            sponsorRows.push({ project_id: pid, track_id: track.id })
            extra.domains.push(track.sponsor_name || track.name)
          }
        }
        extra.tech.forEach((t) => techNames.add(t))
        extra.domains.forEach((d) => domainNames.add(d))
      }

      for (const part of chunk(projectIds, 100)) {
        await supabase.from('project_team_members').delete().in('project_id', part)
        await supabase.from('project_sponsor_tracks').delete().in('project_id', part)
      }
      setProgress(60)

      for (const part of chunk(memberRows, 200)) {
        const { error: mErr } = await supabase.from('project_team_members').insert(part)
        if (mErr) throw mErr
      }
      setProgress(75)

      if (sponsorRows.length) {
        for (const part of chunk(sponsorRows, 200)) {
          const { error: sErr } = await supabase
            .from('project_sponsor_tracks')
            .upsert(part, { onConflict: 'project_id,track_id', ignoreDuplicates: true })
          if (sErr) throw sErr
        }
      }
      setProgress(85)

      const techList = Array.from(techNames)
      const domainList = Array.from(domainNames).filter((n) => !techNames.has(n))
      const allTagNames = [...techList, ...domainList]

      if (allTagNames.length) {
        const categoryOf = (name: string) => (techNames.has(name) ? 'tech' : 'domain')
        for (const part of chunk(allTagNames, 200)) {
          const { error: tErr } = await supabase
            .from('tags')
            .upsert(
              part.map((name) => ({ name, category: categoryOf(name) })),
              { onConflict: 'name', ignoreDuplicates: true }
            )
          if (tErr) throw tErr
        }

        const tagIdByName = new Map<string, string>()
        for (const part of chunk(allTagNames, 200)) {
          const { data } = await supabase.from('tags').select('id, name').in('name', part)
          for (const t of (data || []) as { id: string; name: string }[]) tagIdByName.set(t.name, t.id)
        }

        const tagRows: { project_id: string; tag_id: string }[] = []
        for (const [url, extra] of byUrl) {
          const pid = idByUrl.get(url)
          if (!pid) continue
          for (const name of new Set([...extra.tech, ...extra.domains])) {
            const tagId = tagIdByName.get(name)
            if (tagId) tagRows.push({ project_id: pid, tag_id: tagId })
          }
        }
        for (const part of chunk(tagRows, 300)) {
          const { error: ptErr } = await supabase
            .from('project_tags')
            .upsert(part, { onConflict: 'project_id,tag_id', ignoreDuplicates: true })
          if (ptErr) throw ptErr
        }
      }

      // Fill blank table numbers by main-track clusters (never overwrite CSV/manual values).
      let tablesAssigned = 0
      const { data: seatedRows, error: seatedErr } = await supabase
        .from('projects')
        .select('id, title, table_number, main_track_id')
        .eq('status', 'submitted')
      if (seatedErr) throw seatedErr

      const tableMap = clusterAssignTables(
        (seatedRows || []) as {
          id: string
          title: string
          table_number: string | null
          main_track_id: string | null
        }[],
        tracks.map((t) => ({ id: t.id, name: t.name, sort_order: t.sort_order }))
      )

      if (tableMap.size) {
        for (const [id, table_number] of tableMap) {
          const { error: tErr } = await supabase.from('projects').update({ table_number }).eq('id', id)
          if (tErr) throw tErr
          tablesAssigned++
        }
      }

      setProgress(100)
      setMessage(
        `Imported ${idByUrl.size} projects, ${memberRows.length} team members, ${sponsorRows.length} sponsor opt-ins, ${techList.length} tech tags and ${domainList.length} track tags.` +
          (tablesAssigned
            ? ` Assigned ${tablesAssigned} table number${tablesAssigned === 1 ? '' : 's'} by main track.`
            : '')
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const previewRows = rows.slice(0, 3)

  const exportProjects = async () => {
    const supabase = createClient()
    const [projectRes, sponsorRes, memberRes, tagRes] = await Promise.all([
      supabase
        .from('projects')
        .select(
          'id, title, table_number, about, submission_url, video_url, github_url, status, main_track_id'
        )
        .order('table_number'),
      supabase.from('project_sponsor_tracks').select('project_id, track_id'),
      supabase
        .from('project_team_members')
        .select('project_id, first_name, last_name, email, is_submitter'),
      supabase.from('project_tags').select('project_id, tag:tags(name)'),
    ])

    const projects = (projectRes.data || []) as {
      id: string
      title: string
      table_number: string | null
      about: string | null
      submission_url: string | null
      video_url: string | null
      github_url: string | null
      status: string
      main_track_id: string | null
    }[]

    if (projects.length === 0) {
      setError('No projects to export yet — run an import first.')
      return
    }

    const sponsors = (sponsorRes.data || []) as { project_id: string; track_id: string }[]
    const members = (memberRes.data || []) as {
      project_id: string
      first_name: string | null
      last_name: string | null
      email: string | null
      is_submitter: boolean
    }[]
    const projectTags = (tagRes.data || []) as unknown as {
      project_id: string
      tag: { name: string } | null
    }[]
    const trackName = (id: string | null) => (id ? tracks.find((t) => t.id === id)?.name || '' : '')

    exportWorkbook('Projects', [
      {
        name: 'Projects',
        rows: projects.map((p) => ({
          Table: p.table_number || '',
          Project: p.title,
          'Main track': trackName(p.main_track_id),
          'Sponsor tracks': sponsors
            .filter((s) => s.project_id === p.id)
            .map((s) => trackName(s.track_id))
            .filter(Boolean)
            .join(', '),
          Tags: projectTags
            .filter((t) => t.project_id === p.id)
            .map((t) => t.tag?.name)
            .filter(Boolean)
            .join(', '),
          Team: members
            .filter((m) => m.project_id === p.id)
            .map((m) => [m.first_name, m.last_name].filter(Boolean).join(' ') || m.email || '')
            .filter(Boolean)
            .join(', '),
          Devpost: p.submission_url || '',
          Video: p.video_url || '',
          Code: p.github_url || '',
          Status: p.status,
          About: p.about ? p.about.replace(/\s+/g, ' ').slice(0, 500) : '',
        })),
      },
      {
        name: 'Team members',
        rows: members.map((m) => ({
          Project: projects.find((p) => p.id === m.project_id)?.title || '',
          Name: [m.first_name, m.last_name].filter(Boolean).join(' '),
          Email: m.email || '',
          Submitter: m.is_submitter ? 'Yes' : 'No',
        })),
      },
    ])
  }

  return (
    <div className="space-y-6">
      {error && <Banner tone="error">{error}</Banner>}
      {message && <Banner tone="success">{message}</Banner>}

      <Banner tone="info">
        Bulk-import a Devpost CSV above. Need an additional project? Open Add a project below the
        CSV cards. Projects are matched on submission URL, so re-imports update instead of
        duplicating.
      </Banner>

      <Panel
        title="1. Upload the export"
        tip="importIdempotent"
        description="Devpost CSV bulk import. Column names change between events, so you confirm the mapping in the next step."
        actions={<ExportButton onClick={exportProjects} label="Export projects" />}
      >
        <div className="p-5 space-y-3">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onFile(f)
            }}
            className="block w-full text-sm text-gray-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-semibold hover:file:bg-blue-700 file:cursor-pointer"
          />
          {fileName && (
            <p className="text-sm text-gray-400">
              {fileName} · {rows.length} data rows · {headers.length} columns ·{' '}
              {teamMemberGroups.size} team member slots detected
            </p>
          )}
          {tracks.length === 0 && (
            <Banner tone="warning">
              No tracks exist yet. Create your tracks first or nothing will match the main track and
              opt-in prize columns.
            </Banner>
          )}
        </div>
      </Panel>

      {headers.length > 0 && (
        <>
          <Panel
            title="2. Map the columns"
            description="Team member columns are detected automatically by their numbering and do not need mapping."
          >
            <div className="overflow-x-auto custom-scrollbar max-h-[420px]">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="bg-white/5 text-gray-400 sticky top-0">
                  <tr>
                    <th className="p-3 text-left font-medium">CSV column</th>
                    <th className="p-3 text-left font-medium">Sample value</th>
                    <th className="p-3 text-left font-medium">Maps to</th>
                  </tr>
                </thead>
                <tbody>
                  {headers.map((h) => (
                    <tr key={h} className="border-t border-white/10">
                      <td className="p-3 text-white">{h}</td>
                      <td className="p-3 text-gray-500 max-w-[220px] truncate">
                        {previewRows[0]?.[colIndex(h)] || '—'}
                      </td>
                      <td className="p-3">
                        <select
                          value={mapping[h] || 'skip'}
                          onChange={(e) => {
                            setMapping({ ...mapping, [h]: e.target.value as SystemKey })
                            setValidation(null)
                          }}
                          className={selectClass}
                        >
                          {SYSTEM_FIELDS.map((f) => (
                            <option key={f.key} value={f.key}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-5 border-t border-white/10">
              <button
                onClick={validate}
                disabled={checking}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition"
              >
                {checking ? 'Checking…' : 'Check this mapping'}
              </button>
            </div>
          </Panel>

          {validation && (
            <Panel
              title="3. Review before importing"
              description="Nothing has been written yet. Fix any mismatches now — unmatched names are skipped rather than guessed."
            >
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'New projects', value: validation.newProjects },
                    { label: 'Will update', value: validation.updatedProjects },
                    { label: 'Rows skipped', value: validation.skippedRows },
                    { label: 'Duplicate URLs', value: validation.duplicateUrls.length },
                  ].map((s) => (
                    <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <p className="text-xs text-gray-400 uppercase">{s.label}</p>
                      <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
                    </div>
                  ))}
                </div>

                {validation.unmatchedPrizes.length > 0 && (
                  <Banner tone="warning">
                    <p className="font-semibold mb-1">Opt-in prizes with no matching sponsor track</p>
                    <p className="leading-relaxed">
                      {validation.unmatchedPrizes.join(', ')}. Create sponsor tracks with these exact
                      names first, or these projects will not appear in that sponsor’s judging.
                    </p>
                  </Banner>
                )}

                {validation.unmatchedTracks.length > 0 && (
                  <Banner tone="warning">
                    <p className="font-semibold mb-1">Main track values with no matching track</p>
                    <p className="leading-relaxed">
                      {validation.unmatchedTracks.join(', ')}. Those projects import without a main
                      track and will not show up when you assign judges for it.
                    </p>
                  </Banner>
                )}

                {validation.duplicateUrls.length > 0 && (
                  <Banner tone="warning">
                    The file contains repeated submission URLs. Only the last row for each wins.
                  </Banner>
                )}

                {validation.skippedRows > 0 && (
                  <Banner tone="info">
                    {validation.skippedRows} rows have no title or submission URL and will be ignored.
                  </Banner>
                )}

                {importing && (
                  <div className="space-y-2">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">Writing in batches… {progress}%</p>
                  </div>
                )}

                <button
                  onClick={runImport}
                  disabled={importing || validation.usableRows === 0}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-lg transition"
                >
                  {importing
                    ? 'Importing…'
                    : `Import ${validation.usableRows} projects`}
                </button>
              </div>
            </Panel>
          )}
        </>
      )}

      {headers.length === 0 && (
        <Panel>
          <EmptyState
            title="No CSV loaded"
            description="Upload a Devpost CSV above, or open Add a project below for a single walk-up."
          />
        </Panel>
      )}

      <section className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
        <button
          type="button"
          onClick={() => setAddOpen((o) => !o)}
          aria-expanded={addOpen}
          className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white/5 transition"
        >
          <div className="min-w-0 space-y-1">
            <p className="text-lg font-bold text-white inline-flex items-center gap-2">
              <span>Add a project</span>
              <HelpTip tip="lateAddProject" label="About adding a project" />
            </p>
            <p className="text-sm text-gray-400 leading-relaxed">
              Last-minute walk-up at {suggestedTable}. Optionally assign lightest-loaded judges.
            </p>
          </div>
          <span
            className={`shrink-0 text-gray-400 text-lg leading-none transition-transform ${
              addOpen ? 'rotate-180' : ''
            }`}
            aria-hidden
          >
            ▾
          </span>
        </button>

        {addOpen && (
          <form
            onSubmit={addManualProject}
            className="px-5 pb-5 space-y-5 border-t border-white/10 pt-5"
          >
            <p className="text-xs text-gray-500 leading-relaxed">
              Fills the next free table so it lands last on Tables. Reseat for short walks can
              re-pack the floor afterward using the same visit graph.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Project title" required hint="Shown on Tables and score sheets.">
                <input
                  required
                  value={manual.title}
                  onChange={(e) => setManual({ ...manual, title: e.target.value })}
                  className={inputClass}
                  placeholder="AstroCart"
                />
              </Field>
              <Field
                label="Submission URL"
                required
                hint="Unique key — use the Devpost URL, or a placeholder like manual://team-name if there is none."
              >
                <input
                  required
                  value={manual.submission_url}
                  onChange={(e) => setManual({ ...manual, submission_url: e.target.value })}
                  className={inputClass}
                  placeholder="https://devpost.com/software/… or manual://team-name"
                />
              </Field>
              <Field label="Main track" hint="In-house track this project primarily competes in.">
                <select
                  value={manual.main_track_id}
                  onChange={(e) => setManual({ ...manual, main_track_id: e.target.value })}
                  className={selectClass}
                >
                  <option value="">— none —</option>
                  {inHouseTracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Table number"
                hint="Assigned automatically as the last table. Reseat can move it later."
              >
                <input value={suggestedTable} readOnly className={`${inputClass} opacity-80`} />
              </Field>
              <Field label="About / description" className="md:col-span-2">
                <textarea
                  value={manual.about}
                  onChange={(e) => setManual({ ...manual, about: e.target.value })}
                  className={`${inputClass} min-h-[80px]`}
                  placeholder="Short pitch judges will see on the score sheet."
                />
              </Field>
              <Field label="Demo video URL">
                <input
                  value={manual.video_url}
                  onChange={(e) => setManual({ ...manual, video_url: e.target.value })}
                  className={inputClass}
                  placeholder="https://…"
                />
              </Field>
              <Field label="Code repository URL">
                <input
                  value={manual.github_url}
                  onChange={(e) => setManual({ ...manual, github_url: e.target.value })}
                  className={inputClass}
                  placeholder="https://github.com/…"
                />
              </Field>
              <Field
                label="Built with"
                className="md:col-span-2"
                hint="Comma-separated tech tags for affinity matching."
              >
                <input
                  value={manual.built_with}
                  onChange={(e) => setManual({ ...manual, built_with: e.target.value })}
                  className={inputClass}
                  placeholder="React, Python, OpenAI"
                />
              </Field>
            </div>

            {sponsorTracks.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-200">Sponsor / opt-in prizes</p>
                <p className="text-xs text-gray-500">
                  Creates score sheets for each selected prize on this table.
                </p>
                <div className="flex flex-wrap gap-2">
                  {sponsorTracks.map((t) => {
                    const on = manualSponsors.includes(t.id)
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleManualSponsor(t.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                          on
                            ? 'bg-orange-500/80 border-orange-400 text-white'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        {t.name}
                        {t.sponsor_judges_only ? ' *' : ''}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              <Field label="Submitter first name" hint="For COI checks when moving judges.">
                <input
                  value={manual.member_first}
                  onChange={(e) => setManual({ ...manual, member_first: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Submitter last name">
                <input
                  value={manual.member_last}
                  onChange={(e) => setManual({ ...manual, member_last: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Submitter email">
                <input
                  type="email"
                  value={manual.member_email}
                  onChange={(e) => setManual({ ...manual, member_email: e.target.value })}
                  className={inputClass}
                  placeholder="hacker@school.edu"
                />
              </Field>
            </div>

            <div className="space-y-3 border-t border-white/10 pt-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-200">Assign judges for this table</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-xl leading-relaxed">
                    Sorted lightest workload first. A sheet is created for each selected judge × each
                    track this project qualifies for (main + sponsors).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={pickLightestJudges}
                  disabled={judgeWorkload.filter((j) => !j.blockedRestricted).length === 0}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition"
                >
                  Pick 3 lightest
                </button>
              </div>

              {judges.length === 0 ? (
                <p className="text-xs text-gray-500">
                  No judges activated yet. Invite them on the Judges tab.
                </p>
              ) : (
                <ul className="max-h-56 overflow-y-auto custom-scrollbar divide-y divide-white/10 rounded-xl border border-white/10">
                  {judgeWorkload.map(({ judge, visits, seconds, blockedRestricted }) => {
                    const on = manualJudges.includes(judge.user_id)
                    return (
                      <li key={judge.user_id}>
                        <button
                          type="button"
                          disabled={blockedRestricted}
                          onClick={() => toggleManualJudge(judge.user_id)}
                          title={
                            blockedRestricted
                              ? 'Not linked to a Linked-judges-only sponsor track on this project'
                              : undefined
                          }
                          className={`w-full text-left px-4 py-3 flex flex-wrap items-center justify-between gap-2 transition ${
                            blockedRestricted
                              ? 'opacity-40 cursor-not-allowed'
                              : on
                                ? 'bg-blue-600/20'
                                : 'hover:bg-white/5'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-sm text-white font-medium truncate">
                              {judge.full_name || judge.email}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {judge.company || judge.email}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-gray-400">{formatDuration(seconds)}</span>
                            <Pill tone={visits === 0 ? 'yellow' : 'neutral'}>{visits} visits</Pill>
                            {on && <Pill tone="blue">Selected</Pill>}
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <button
              type="submit"
              disabled={adding}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition"
            >
              {adding
                ? 'Adding…'
                : `Add project at ${suggestedTable}${
                    manualJudges.length ? ` · ${manualJudges.length} judges` : ''
                  }`}
            </button>
          </form>
        )}
      </section>

      {tracks.length > 0 && headers.length === 0 && (
        <Panel
          title="Sponsor track names to match"
          tip="trackNames"
          description="Opt-in prize values must match these exactly (case-insensitive)."
        >
          <div className="p-5 flex flex-wrap gap-2">
            {tracks
              .filter((t) => t.type === 'sponsor')
              .map((t) => (
                <Pill key={t.id} tone="orange">
                  {t.name}
                </Pill>
              ))}
            {tracks.filter((t) => t.type === 'sponsor').length === 0 && (
              <p className="text-sm text-gray-500">No sponsor tracks created yet.</p>
            )}
          </div>
        </Panel>
      )}
    </div>
  )
}
