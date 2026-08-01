'use client'

import { useCallback, useState } from 'react'

type CopyLinkButtonProps = {
  text: string
  label?: string
  className?: string
  /** Idle button look — defaults to blue filled (staff) */
  variant?: 'blue' | 'ghost'
}

/**
 * Shared copy-to-clipboard control with a temporary "Copied" confirmation.
 * Used for invite links in Team and Judging admin.
 */
export function CopyLinkButton({
  text,
  label = 'Copy link',
  className = '',
  variant = 'blue',
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
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
      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-150 ${
        copied
          ? 'bg-green-600 hover:bg-green-600 text-white'
          : idleClass
      } ${className}`}
    >
      {copied ? 'Copied' : label}
    </button>
  )
}
