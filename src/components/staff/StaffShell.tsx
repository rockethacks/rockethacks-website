'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { createClient } from '@/lib/supabase/client'

export type StaffNavItem = {
  href: string
  label: string
  exact?: boolean
  /** Only shown to admins */
  adminOnly?: boolean
}

export const STAFF_NAV: StaffNavItem[] = [
  { href: '/admin', label: 'Applicants', exact: true, adminOnly: true },
  { href: '/admin/team', label: 'Team', adminOnly: true },
  { href: '/admin/judging', label: 'Judging', adminOnly: true },
  { href: '/organizer', label: 'Check-In' },
]

function isNavActive(pathname: string, item: StaffNavItem) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href)
}

/** Option 5 tabs: text labels + sliding underline pill under the active tab. */
function StaffTabs({ items }: { items: StaffNavItem[] }) {
  const pathname = usePathname()
  const trackRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Map<string, HTMLAnchorElement>>(new Map())
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false })

  const activeHref =
    items.find((item) => isNavActive(pathname, item))?.href ?? items[0]?.href

  const updateIndicator = useCallback(() => {
    const track = trackRef.current
    const tab = activeHref ? tabRefs.current.get(activeHref) : null
    if (!track || !tab) return

    const trackRect = track.getBoundingClientRect()
    const tabRect = tab.getBoundingClientRect()
    // Short underline centered under the label (Option 5)
    const width = Math.max(28, Math.min(48, tabRect.width * 0.55))
    const left =
      tabRect.left - trackRect.left + track.scrollLeft + (tabRect.width - width) / 2

    setIndicator({ left, width, ready: true })
  }, [activeHref])

  useLayoutEffect(() => {
    updateIndicator()
  }, [updateIndicator, items])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const onResize = () => updateIndicator()
    window.addEventListener('resize', onResize)
    track.addEventListener('scroll', onResize, { passive: true })

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null
    ro?.observe(track)

    return () => {
      window.removeEventListener('resize', onResize)
      track.removeEventListener('scroll', onResize)
      ro?.disconnect()
    }
  }, [updateIndicator])

  return (
    <nav
      className="rounded-xl border border-white/10 bg-white/[0.04] px-2 sm:px-3"
      aria-label="Staff sections"
    >
      <div
        ref={trackRef}
        className="relative flex flex-nowrap items-stretch gap-0 overflow-x-auto custom-scrollbar"
      >
        {items.map((item) => {
          const active = isNavActive(pathname, item)
          return (
            <Link
              key={item.href}
              href={item.href}
              ref={(el) => {
                if (el) tabRefs.current.set(item.href, el)
                else tabRefs.current.delete(item.href)
              }}
              className={`relative z-10 shrink-0 px-4 sm:px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                active
                  ? 'text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {item.label}
            </Link>
          )
        })}

        <span
          aria-hidden
          className="pointer-events-none absolute bottom-1.5 h-[3px] rounded-full bg-white"
          style={{
            left: indicator.left,
            width: indicator.width,
            opacity: indicator.ready ? 1 : 0,
            transition:
              'left 280ms cubic-bezier(0.22, 1, 0.36, 1), width 280ms cubic-bezier(0.22, 1, 0.36, 1), opacity 150ms ease',
          }}
        />
      </div>
    </nav>
  )
}

type StaffShellProps = {
  children: React.ReactNode
  isAdmin: boolean
  title?: string
  subtitle?: string
}

export function StaffShell({
  children,
  isAdmin,
  title,
  subtitle = 'RocketHacks 2026 staff',
}: StaffShellProps) {
  const router = useRouter()

  const nav = STAFF_NAV.filter((item) => isAdmin || !item.adminOnly)
  const heading = title ?? (isAdmin ? 'Admin Portal' : 'Organizer Portal')

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030c1b] via-[#0a1628] to-[#030c1b] py-6 px-4 sm:py-8 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{heading}</h1>
            <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
          </div>
          <button
            onClick={handleLogout}
            className="self-start px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold rounded-lg transition"
          >
            Logout
          </button>
        </header>

        <StaffTabs items={nav} />

        <div>{children}</div>
      </div>
    </div>
  )
}

export function StaffLoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#030c1b] via-[#0a1628] to-[#030c1b]">
      <div className="text-white text-xl">{message}</div>
    </div>
  )
}
