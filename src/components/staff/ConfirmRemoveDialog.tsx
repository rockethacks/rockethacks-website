'use client'

type ConfirmRemoveDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  busy?: boolean
  onCancel: () => void
  onConfirm: () => void
}

/** Modal card asking the admin to confirm a destructive person removal. */
export function ConfirmRemoveDialog({
  open,
  title,
  description,
  confirmLabel = 'Remove permanently',
  busy = false,
  onCancel,
  onConfirm,
}: ConfirmRemoveDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-remove-title"
        aria-describedby="confirm-remove-desc"
        className="bg-[#0a1628] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl"
      >
        <h3 id="confirm-remove-title" className="text-lg font-bold text-white">
          {title}
        </h3>
        <p id="confirm-remove-desc" className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">
          {description}
        </p>
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="flex-1 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-semibold rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-lg transition"
          >
            {busy ? 'Removing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
