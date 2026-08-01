/**
 * Table numbering helpers.
 * Import clusters blanks by main track; reseat rewrites the floor from visit co-occurrence.
 */

export type TableProject = {
  id: string
  title: string
  table_number: string | null
  main_track_id: string | null
}

export type TableTrack = {
  id: string
  name: string
  sort_order: number
}

export type VisitEdge = {
  judgeId: string
  projectId: string
}

export type ReseatResult = {
  assignment: Map<string, string>
  order: string[]
  oldCost: number
  newCost: number
  moves: { projectId: string; from: string | null; to: string }[]
}

function parseTableIndex(table: string | null | undefined): number | null {
  if (!table) return null
  const m = table.match(/(\d+)/)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

export function formatTableNumber(n: number, width = 2): string {
  const w = Math.max(width, String(n).length, 2)
  return `T${String(n).padStart(w, '0')}`
}

/** Fill null/empty table numbers by main-track clusters; leave existing numbers alone. */
export function clusterAssignTables(
  projects: TableProject[],
  tracks: TableTrack[]
): Map<string, string> {
  const trackRank = new Map<string, number>()
  const sortedTracks = [...tracks].sort(
    (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)
  )
  sortedTracks.forEach((t, i) => trackRank.set(t.id, i))

  let maxExisting = 0
  const blanks: TableProject[] = []
  for (const p of projects) {
    const idx = parseTableIndex(p.table_number)
    if (idx != null) maxExisting = Math.max(maxExisting, idx)
    else if (!p.table_number?.trim()) blanks.push(p)
  }

  blanks.sort((a, b) => {
    const ra = a.main_track_id != null ? (trackRank.get(a.main_track_id) ?? 9999) : 10000
    const rb = b.main_track_id != null ? (trackRank.get(b.main_track_id) ?? 9999) : 10000
    if (ra !== rb) return ra - rb
    return a.title.localeCompare(b.title)
  })

  const width = Math.max(2, String(maxExisting + blanks.length).length)
  const out = new Map<string, string>()
  let next = maxExisting + 1
  for (const p of blanks) {
    out.set(p.id, formatTableNumber(next, width))
    next++
  }
  return out
}

function walkCost(order: string[], visitsByJudge: Map<string, string[]>): number {
  const index = new Map(order.map((id, i) => [id, i]))
  let total = 0
  for (const projectIds of visitsByJudge.values()) {
    const positions = projectIds
      .map((id) => index.get(id))
      .filter((n): n is number => n != null)
      .sort((a, b) => a - b)
    for (let i = 1; i < positions.length; i++) total += positions[i] - positions[i - 1]
  }
  return total
}

function judgeSets(visits: VisitEdge[]): Map<string, string[]> {
  const byJudge = new Map<string, Set<string>>()
  for (const v of visits) {
    const set = byJudge.get(v.judgeId) || new Set<string>()
    set.add(v.projectId)
    byJudge.set(v.judgeId, set)
  }
  const out = new Map<string, string[]>()
  for (const [judgeId, set] of byJudge) out.set(judgeId, Array.from(set))
  return out
}

function coVisitWeights(projectIds: string[], visitsByJudge: Map<string, string[]>): Map<string, Map<string, number>> {
  const idSet = new Set(projectIds)
  const w = new Map<string, Map<string, number>>()
  for (const id of projectIds) w.set(id, new Map())

  for (const projects of visitsByJudge.values()) {
    const list = projects.filter((id) => idSet.has(id))
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]
        const b = list[j]
        w.get(a)!.set(b, (w.get(a)!.get(b) || 0) + 1)
        w.get(b)!.set(a, (w.get(b)!.get(a) || 0) + 1)
      }
    }
  }
  return w
}

function degree(id: string, weights: Map<string, Map<string, number>>): number {
  let sum = 0
  for (const v of weights.get(id)?.values() || []) sum += v
  return sum
}

function weightToSet(
  id: string,
  set: Set<string>,
  weights: Map<string, Map<string, number>>
): number {
  let sum = 0
  const row = weights.get(id)
  if (!row) return 0
  for (const other of set) sum += row.get(other) || 0
  return sum
}

/** Greedy path that grows from both ends using co-visit weights. */
function greedyOrder(projectIds: string[], weights: Map<string, Map<string, number>>): string[] {
  if (projectIds.length === 0) return []
  if (projectIds.length === 1) return [...projectIds]

  const remaining = new Set(projectIds)
  let seed = projectIds[0]
  let bestDeg = -1
  for (const id of projectIds) {
    const d = degree(id, weights)
    if (d > bestDeg || (d === bestDeg && id.localeCompare(seed) < 0)) {
      bestDeg = d
      seed = id
    }
  }

  const order = [seed]
  remaining.delete(seed)

  while (remaining.size) {
    let bestId = Array.from(remaining)[0]
    let bestScore = -1
    let bestEnd: 'left' | 'right' = 'right'
    let bestAffinity = -1

    for (const id of remaining) {
      const leftScore = weights.get(id)?.get(order[0]) || 0
      const rightScore = weights.get(id)?.get(order[order.length - 1]) || 0
      const endScore = Math.max(leftScore, rightScore)
      const end: 'left' | 'right' = leftScore > rightScore ? 'left' : 'right'
      const affinity = weightToSet(id, new Set(order), weights)

      if (
        endScore > bestScore ||
        (endScore === bestScore && affinity > bestAffinity) ||
        (endScore === bestScore && affinity === bestAffinity && id.localeCompare(bestId) < 0)
      ) {
        bestScore = endScore
        bestAffinity = affinity
        bestId = id
        bestEnd = end
      }
    }

    if (bestEnd === 'left') order.unshift(bestId)
    else order.push(bestId)
    remaining.delete(bestId)
  }

  return order
}

function improveOrder(
  order: string[],
  visitsByJudge: Map<string, string[]>,
  maxPasses = 40
): string[] {
  let current = [...order]
  let cost = walkCost(current, visitsByJudge)
  const n = current.length
  if (n < 2) return current

  for (let pass = 0; pass < maxPasses; pass++) {
    let improved = false
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const next = [...current]
        const tmp = next[i]
        next[i] = next[j]
        next[j] = tmp
        const c = walkCost(next, visitsByJudge)
        if (c < cost) {
          current = next
          cost = c
          improved = true
        }
      }
    }
    if (!improved) break
  }
  return current
}

/**
 * Rewrite table numbers for all projects so co-visited tables sit near each other.
 * Assumes judges walk tables in ascending number order.
 */
export function reseatByVisits(
  projects: TableProject[],
  visits: VisitEdge[]
): ReseatResult {
  const projectIds = projects.map((p) => p.id)
  const byId = new Map(projects.map((p) => [p.id, p]))
  const visitsByJudge = judgeSets(visits)

  // Include isolated projects (no visits) at the end of greedy in stable title order
  const visited = new Set(visits.map((v) => v.projectId))
  const active = projectIds.filter((id) => visited.has(id))
  const orphans = projectIds
    .filter((id) => !visited.has(id))
    .sort((a, b) => (byId.get(a)?.title || '').localeCompare(byId.get(b)?.title || ''))

  const weights = coVisitWeights(active, visitsByJudge)
  let order = [...greedyOrder(active, weights), ...orphans]
  order = improveOrder(order, visitsByJudge)

  // Cost against current seating (numeric order of existing tables)
  const currentOrder = [...projects]
    .sort((a, b) => {
      const ai = parseTableIndex(a.table_number)
      const bi = parseTableIndex(b.table_number)
      if (ai == null && bi == null) return a.title.localeCompare(b.title)
      if (ai == null) return 1
      if (bi == null) return -1
      return ai - bi || a.title.localeCompare(b.title)
    })
    .map((p) => p.id)

  const oldCost = walkCost(currentOrder, visitsByJudge)
  const newCost = walkCost(order, visitsByJudge)

  const width = Math.max(2, String(order.length).length)
  const assignment = new Map<string, string>()
  const moves: ReseatResult['moves'] = []

  order.forEach((id, i) => {
    const to = formatTableNumber(i + 1, width)
    assignment.set(id, to)
    const from = byId.get(id)?.table_number || null
    if (from !== to) moves.push({ projectId: id, from, to })
  })

  moves.sort((a, b) => {
    const da = Math.abs((parseTableIndex(a.to) || 0) - (parseTableIndex(a.from) || 0))
    const db = Math.abs((parseTableIndex(b.to) || 0) - (parseTableIndex(b.from) || 0))
    return db - da
  })

  return { assignment, order, oldCost, newCost, moves }
}

export function walkCostForTables(
  projects: TableProject[],
  visits: VisitEdge[]
): number {
  const order = [...projects]
    .sort((a, b) => {
      const ai = parseTableIndex(a.table_number)
      const bi = parseTableIndex(b.table_number)
      if (ai == null && bi == null) return a.title.localeCompare(b.title)
      if (ai == null) return 1
      if (bi == null) return -1
      return ai - bi
    })
    .map((p) => p.id)
  return walkCost(order, judgeSets(visits))
}
