import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)
}

export function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Referral codes are the email's local part, lowercased and stripped to
// url-safe chars — e.g. mads.groenlund1@gmail.com → madsgroenlund1
export function refCodeFromEmail(email: string): string {
  const local = email.split('@')[0] ?? ''
  const slug = local.toLowerCase().replace(/[^a-z0-9]/g, '')
  return slug || generateReferralCode().toLowerCase()
}
