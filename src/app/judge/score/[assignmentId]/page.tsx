'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Banner, LoadingScreen } from '@/components/judging/ui'

/**
 * Scoring moved from one page per sheet to one page per table, so a judge fills
 * every rubric for a project in a single sitting. Old links (bookmarks, the admin
 * scorecard links) resolve the assignment to its project and land on that rubric.
 */
export default function JudgeScoreRedirectPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const router = useRouter()
  const [error, setError] = useState('')

  useEffect(() => {
    async function resolve() {
      const supabase = createClient()
      const { data, error: qErr } = await supabase
        .from('judge_assignments')
        .select('project_id')
        .eq('id', assignmentId)
        .maybeSingle()

      if (qErr || !data) {
        setError('That score sheet is not available to you any more.')
        return
      }
      router.replace(`/judge/table/${data.project_id}#rubric-${assignmentId}`)
    }
    resolve()
  }, [assignmentId, router])

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#030c1b] via-[#0a1628] to-[#030c1b] p-6">
        <div className="max-w-xl mx-auto space-y-4">
          <Banner tone="error">{error}</Banner>
          <Link href="/judge" className="text-blue-400 text-sm">
            ← Back to your tables
          </Link>
        </div>
      </div>
    )
  }

  return <LoadingScreen message="Opening this table…" />
}
