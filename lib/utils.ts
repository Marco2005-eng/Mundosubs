import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPEN(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return `S/ ${num.toFixed(2)}`
}

export function applyDiscount(price: number, pct: number): number {
  return price * (1 - pct / 100)
}

export function formatDate(dateStr: string | null | undefined, locale = 'es-PE'): string {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString(locale)
  } catch {
    return '-'
  }
}
