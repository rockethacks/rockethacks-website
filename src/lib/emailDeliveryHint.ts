/** Shown wherever Auth sends a confirmation, magic link, or password-reset email. */
export const EMAIL_DELIVERY_HINT =
  'If you do not see it within a few minutes, check Junk, Spam, Updates, Promotions, and Quarantine — school inboxes often filter these.'

export function withEmailDeliveryHint(message: string): string {
  const base = message.trim()
  if (!base) return EMAIL_DELIVERY_HINT
  if (base.includes('Junk') || base.includes('Spam')) return base
  return `${base} ${EMAIL_DELIVERY_HINT}`
}
