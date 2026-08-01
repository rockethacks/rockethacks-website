export type JudgingSession = {
  isAdmin: boolean
  isOrganizer: boolean
  isJudgingTeam?: boolean
  isJudge: boolean
  isHeadJudge: boolean
  judgeRole: string | null
  user: { id: string; email: string | null; full_name: string | null } | null
}

/**
 * Reads the current session. Throws on transport or server failures so callers
 * can show an actionable error instead of hanging on a spinner forever.
 */
export async function loadSession(): Promise<JudgingSession> {
  let response: Response
  try {
    response = await fetch('/api/auth/user', { cache: 'no-store' })
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.')
  }

  if (!response.ok) {
    throw new Error(`Could not verify your session (error ${response.status}).`)
  }

  try {
    return (await response.json()) as JudgingSession
  } catch {
    throw new Error('The server sent an unexpected response. Reload the page and try again.')
  }
}
