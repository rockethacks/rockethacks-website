'use client'

import { useEffect } from 'react'

/**
 * Phone-first shell for the judge portal.
 * Hides the site-wide MLH badge (it covers sticky timer / Rubrics chrome).
 */
export default function JudgeLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const badge = document.getElementById('mlh-trust-badge')
    if (!badge) return
    const prev = badge.style.display
    badge.style.display = 'none'
    return () => {
      badge.style.display = prev
    }
  }, [])

  return (
    <div className="judge-shell min-h-dvh pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      {children}
    </div>
  )
}
