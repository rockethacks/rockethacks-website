'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AuditLogEntry } from '@/types/judging'
import { Banner, EmptyState, ExportButton, Panel, Pill, inputClass } from '@/components/judging/ui'
import { exportWorkbook } from '@/lib/judging/export'

const ACTION_TONE: Record<string, 'green' | 'blue' | 'red'> = {
  INSERT: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
}

const ACTION_WORD: Record<string, string> = {
  INSERT: 'created',
  UPDATE: 'changed',
  DELETE: 'deleted',
}

const TABLE_WORD: Record<string, string> = {
  scores: 'Score',
  judge_assignments: 'Assignment',
}

export default function AuditAdminPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [judgeNames, setJudgeNames] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const [{ data, error: qErr }, { data: judges }] = await Promise.all([
      supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('judge_profiles').select('user_id, full_name, email'),
    ])
    if (qErr) setError(qErr.message)
    else setEntries((data || []) as AuditLogEntry[])

    const map: Record<string, string> = {}
    for (const j of (judges || []) as { user_id: string; full_name: string | null; email: string }[]) {
      map[j.user_id] = j.full_name || j.email
    }
    setJudgeNames(map)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return entries
    return entries.filter((e) =>
      [e.table_name, e.record_id, e.changed_by || '', e.action, judgeNames[e.changed_by || ''] || '']
        .some((v) => v.toLowerCase().includes(q))
    )
  }, [entries, filter, judgeNames])

  const describe = (e: AuditLogEntry) => {
    const subject = TABLE_WORD[e.table_name] || e.table_name
    const who = e.changed_by ? judgeNames[e.changed_by] || 'an organizer' : 'the system'
    if (e.table_name === 'judge_assignments' && e.action === 'UPDATE') {
      const oldStatus = (e.old_data as { status?: string } | null)?.status
      const newStatus = (e.new_data as { status?: string } | null)?.status
      if (oldStatus && newStatus && oldStatus !== newStatus)
        return `${subject} moved from ${oldStatus.replace('_', ' ')} to ${newStatus.replace('_', ' ')} by ${who}`
    }
    return `${subject} ${ACTION_WORD[e.action] || e.action.toLowerCase()} by ${who}`
  }

  const exportAudit = () => {
    exportWorkbook('Audit', [
      {
        name: 'Audit log',
        rows: filtered.map((e) => ({
          When: new Date(e.created_at).toLocaleString(),
          Action: e.action,
          Table: e.table_name,
          Summary: describe(e),
          'Changed by': e.changed_by ? judgeNames[e.changed_by] || e.changed_by : 'System',
          Record: e.record_id,
          Before: e.old_data ? JSON.stringify(e.old_data) : '',
          After: e.new_data ? JSON.stringify(e.new_data) : '',
        })),
      },
    ])
  }

  return (
    <div className="space-y-6">
      {error && <Banner tone="error">{error}</Banner>}

      <Banner tone="info">
        Every score and assignment change is recorded here automatically, including who made it. This
        is your evidence trail if a team disputes a result — entries cannot be edited or deleted from
        the app.
      </Banner>

      <div className="flex flex-wrap gap-3">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by judge name, table, record id, or action…"
          className={`${inputClass} flex-1 min-w-[240px]`}
        />
        <button
          onClick={load}
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      <Panel
        title={`Recent activity (${filtered.length})`}
        tipText="Plain-language log of every score and assignment change. Reopens, moves, and score edits show up here."
        description="Newest first, capped at the last 200 changes."
        actions={<ExportButton onClick={exportAudit} disabled={filtered.length === 0} />}
      >
        {filtered.length === 0 ? (
          <EmptyState
            title={entries.length === 0 ? 'Nothing logged yet' : 'No matches'}
            description={
              entries.length === 0
                ? 'Entries appear as soon as judges start scoring or you change assignments.'
                : 'Try a different search term.'
            }
          />
        ) : (
          <ul className="divide-y divide-white/10 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {filtered.map((e) => (
              <li key={e.id} className="p-4 space-y-2 text-sm">
                <div className="flex flex-wrap justify-between gap-2 items-start">
                  <div className="flex items-center gap-2">
                    <Pill tone={ACTION_TONE[e.action] || 'neutral'}>{e.action}</Pill>
                    <span className="text-white">{describe(e)}</span>
                  </div>
                  <p className="text-gray-500 shrink-0">{new Date(e.created_at).toLocaleString()}</p>
                </div>
                <p className="text-gray-500 font-mono text-xs">record {e.record_id}</p>
                <details className="text-gray-400">
                  <summary className="cursor-pointer text-blue-400 text-xs">Raw payload</summary>
                  <pre className="mt-2 p-3 bg-black/30 rounded-lg overflow-x-auto text-xs">
                    {JSON.stringify({ old: e.old_data, new: e.new_data }, null, 2)}
                  </pre>
                </details>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
