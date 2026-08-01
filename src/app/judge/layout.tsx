/**
 * Phone-first shell for the judge portal.
 */
export default function JudgeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="judge-shell min-h-dvh pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      {children}
    </div>
  )
}
