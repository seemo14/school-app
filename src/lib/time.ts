import { addMinutes, format, parseISO, startOfWeek } from 'date-fns'

const DASH_REGEX = /[–—−]/g
const TIME_FRAGMENT_REGEX = /(?<hours>\d{1,2})(?:[:h\.](?<minutes>\d{1,2}))?/i

export const DAY_LABELS: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
}

export function toIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/u.test(value)
}

export function normalizeTimeString(fragment: string): string {
  const cleaned = fragment.trim().replace(DASH_REGEX, '-').replace(/\s+/g, '')
  const match = cleaned.match(TIME_FRAGMENT_REGEX)
  if (!match?.groups) {
    throw new Error(`Invalid time fragment: ${fragment}`)
  }

  const hours = Math.min(Number.parseInt(match.groups.hours ?? '0', 10), 23)
  const minutes = Math.min(Number.parseInt(match.groups.minutes ?? '0', 10), 59)

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

export function parseTimeRange(value: string): { start: string; end: string } | null {
  const cleaned = value.replace(DASH_REGEX, '-').replace(/\s+/g, '')
  const delimiter = cleaned.includes('-') ? '-' : cleaned.includes('to') ? 'to' : null
  if (!delimiter) return null
  const [startRaw, endRaw] = cleaned.split(delimiter)
  if (!startRaw || !endRaw) return null

  try {
    const start = normalizeTimeString(startRaw)
    const end = normalizeTimeString(endRaw)
    return { start, end }
  } catch (error) {
    console.warn('Failed to parse time range', value, error)
    return null
  }
}

export function combineDateAndTime(date: string, time: string): Date {
  if (!isIsoDate(date)) throw new Error(`Invalid ISO date: ${date}`)
  const [hours, minutes] = time.split(':').map((part) => Number.parseInt(part, 10))
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    throw new Error(`Invalid time string: ${time}`)
  }
  const base = parseISO(`${date}T00:00:00`)
  return addMinutes(base, hours * 60 + minutes)
}

export function formatTimeRange(start: string, end: string): string {
  return `${start} – ${end}`
}

export function getWeekBounds(date: Date, weekStartsOn: 0 | 1 = 1): { start: Date; end: Date } {
  const start = startOfWeek(date, { weekStartsOn })
  const end = addMinutes(start, 7 * 24 * 60 - 1)
  return { start, end }
}
