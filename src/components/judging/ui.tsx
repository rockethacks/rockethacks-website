'use client'

import type { ReactNode } from 'react'
import { JUDGING_TIPS, type JudgingTipKey } from '@/lib/judging/tips'

/** Hover/focus tip for first-run concepts. Prefer this over native title alone. */
export function HelpTip({
  text,
  tip,
  label = 'More about this',
  className = '',
}: {
  text?: string
  tip?: JudgingTipKey
  label?: string
  className?: string
}) {
  const body = text || (tip ? JUDGING_TIPS[tip] : '')
  if (!body) return null
  return (
    <span className={`relative inline-flex items-center group/tip ${className}`}>
      <button
        type="button"
        aria-label={label}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/25 bg-white/5 text-[10px] font-bold leading-none text-gray-300 hover:border-blue-400/50 hover:text-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        ?
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 bottom-full z-50 mb-1.5 w-64 -translate-x-1/2 rounded-lg border border-white/15 bg-[#0a1628] px-3 py-2 text-left text-xs font-normal leading-relaxed text-gray-200 opacity-0 shadow-lg transition-opacity duration-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100 motion-reduce:transition-none"
      >
        {body}
      </span>
    </span>
  )
}

/** Label text with an optional attached help tip. */
export function TipLabel({
  children,
  text,
  tip,
}: {
  children: ReactNode
  text?: string
  tip?: JudgingTipKey
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{children}</span>
      <HelpTip text={text} tip={tip} />
    </span>
  )
}

export function Panel({
  title,
  description,
  tip,
  tipText,
  children,
  actions,
}: {
  title?: string
  description?: string
  tip?: JudgingTipKey
  tipText?: string
  children: ReactNode
  actions?: ReactNode
}) {
  return (
    <section className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-visible">
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 sm:p-5 border-b border-white/10">
          <div className="min-w-0 space-y-1.5">
            {title && (
              <h2 className="text-lg font-bold text-white flex flex-wrap items-center gap-2">
                <span>{title}</span>
                {(tip || tipText) && <HelpTip tip={tip} text={tipText} label={`About ${title}`} />}
              </h2>
            )}
            {description && (
              <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">{description}</p>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  )
}

export function Field({
  label,
  hint,
  tip,
  tipText,
  required,
  children,
  className = '',
}: {
  label: string
  hint?: string
  tip?: JudgingTipKey
  tipText?: string
  required?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="flex items-center gap-1.5 text-sm font-medium text-gray-200">
        {label}
        {required && <span className="text-yellow-400">*</span>}
        {(tip || tipText) && <HelpTip tip={tip} text={tipText} label={`About ${label}`} />}
      </span>
      {children}
      {hint && <span className="block text-xs text-gray-500 leading-relaxed">{hint}</span>}
    </label>
  )
}

export const inputClass =
  'w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'

export const selectClass = `${inputClass} [&>option]:bg-[#0a1628] [&>option]:text-white`

export function Banner({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'success' | 'warning' | 'error'
  children: ReactNode
}) {
  const tones = {
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-200',
    success: 'bg-green-500/10 border-green-500/30 text-green-300',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200',
    error: 'bg-red-500/10 border-red-500/30 text-red-300',
  }
  return <div className={`border rounded-lg p-3 text-sm ${tones[tone]}`}>{children}</div>
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="p-10 text-center space-y-3">
      <p className="text-white font-semibold">{title}</p>
      <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">{description}</p>
      {action}
    </div>
  )
}

export function Pill({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'yellow' | 'blue' | 'green' | 'red' | 'orange'
  children: ReactNode
}) {
  const tones = {
    neutral: 'bg-white/10 text-gray-300',
    yellow: 'bg-yellow-500/20 text-yellow-300',
    blue: 'bg-blue-500/20 text-blue-300',
    green: 'bg-green-500/20 text-green-300',
    red: 'bg-red-500/20 text-red-300',
    orange: 'bg-orange-500/20 text-orange-300',
  }
  return (
    <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  )
}

export function ExportButton({
  onClick,
  label = 'Export to Excel',
  disabled,
}: {
  onClick: () => void
  label?: string
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-40 border border-white/10 text-white text-xs font-semibold rounded-lg transition shrink-0"
    >
      {label}
    </button>
  )
}

export function LoadingScreen({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#030c1b] via-[#0a1628] to-[#030c1b]">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-white/20 border-t-yellow-400 rounded-full animate-spin mx-auto" />
        <p className="text-gray-400 text-sm">{message}</p>
      </div>
    </div>
  )
}

export function InlineSpinner() {
  return (
    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin align-[-2px]" />
  )
}
