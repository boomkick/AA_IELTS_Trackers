import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmtDate(iso: string, pattern = 'EEE d MMM') {
  return format(parseISO(iso), pattern)
}

export function toISO(d: Date) {
  return format(d, 'yyyy-MM-dd')
}
