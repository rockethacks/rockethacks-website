'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type CopyLinkButtonProps = {
  text: string
  label?: string
  className?: string
  /** Idle button look — defaults to blue filled (staff) */
  variant?: 'blue' | 'ghost'
}

/**
 * Shared copy-to-clipboard control with a temporary green "Copied ✓" state.
 * Used for invite links in Team and Judging admin — no page banner needed.
 */
export function CopyLinkButton({
  text,
  label = 'Copy link',
  className = '',
  variant = 'blue',
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore clipboard failures (permissions / insecure context)
    }
  }, [text])

  const idleClass =
    variant === 'ghost'
      ? 'bg-white/10 hover:bg-white/20 text-white'
      : 'bg-blue-600 hover:bg-blue-700 text-white'

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-live="polite"
      className={`inline-flex items-center justify-center gap-1.5 min-w-[7.5rem] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-150 ${
        copied
          ? 'bg-green-600 hover:bg-green-600 text-white border border-green-500'
          : `${idleClass} border border-transparent`
      } ${className}`}
    >
      {copied ? (
        <>
          <svg
            className="w-3.5 h-3.5 shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
              clipRule="evenodd"
            />
          </svg>
          Copied
        </>
      ) : (
        label
      )}
    </button>
  )
}
