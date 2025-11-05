import { format, parse, parseISO } from 'date-fns'

export const ISO_DATE_FORMAT = 'yyyy-MM-dd'

export const toISODate = (value: Date | string | number) => {
  if (value instanceof Date) {
    return format(value, ISO_DATE_FORMAT)
  }
  if (typeof value === 'number') {
    return format(new Date(value), ISO_DATE_FORMAT)
  }
  return format(parseISO(value), ISO_DATE_FORMAT)
}

export const formatDateForDisplay = (value: string | Date | number, pattern = 'MMM d, yyyy') => {
  if (typeof value === 'string') {
    return format(parseISO(value), pattern)
  }
  const date = value instanceof Date ? value : new Date(value)
  return format(date, pattern)
}

export const formatTime = (time: string) => {
  const parsed = parse(time, 'HH:mm', new Date())
  return format(parsed, 'HH:mm')
}

export const parseTimeRange = (input: string): { start: string; end: string } | null => {
  const trimmed = input.trim()
  const [startRaw, endRaw] = trimmed.split(/\s*[-–]\s*/)
  if (!startRaw || !endRaw) return null

  const normalize = (value: string) => {
    const raw = value.trim().toLowerCase()
    const match = raw.match(/^(\d{1,2})(?:[:h]?(\d{1,2}))?/)
    if (!match) return null
    const [, hours, minutes] = match
    return `${hours!.padStart(2, '0')}:${(minutes ?? '00').padStart(2, '0')}`
  }

  const start = normalize(startRaw)
  const end = normalize(endRaw)
  if (!start || !end) return null
  return { start, end }
}

export const weekdayFromIndex = (day: number, locale = 'en-US') => {
  const date = new Date()
  const delta = day - ((date.getUTCDay() || 7) as number)
  date.setDate(date.getDate() + delta)
  return date.toLocaleDateString(locale, { weekday: 'long' })
}

export const nextOccurrenceOf = (dayIso: string, targetWeekday: number) => {
  const date = parseISO(dayIso)
  const currentWeekday = date.getDay() === 0 ? 7 : date.getDay()
  const delta = (targetWeekday - currentWeekday + 7) % 7
  const next = new Date(date)
  next.setDate(date.getDate() + delta)
  return format(next, ISO_DATE_FORMAT)
}

export const startOfWeekIso = (reference = new Date()) => {
  const day = reference.getDay()
  const diff = reference.getDate() - day + (day === 0 ? -6 : 1)
  const start = new Date(reference)
  start.setDate(diff)
  return format(start, ISO_DATE_FORMAT)
}

export const betweenDates = (start: string, end: string, value: string) => {
  const startDate = parseISO(start)
  const endDate = parseISO(end)
  const target = parseISO(value)
  return target >= startDate && target <= endDate
}

export const getWeekRangeLabel = (isoDate: string) => {
  const start = parseISO(isoDate)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
}

export const nowIsoDate = () => toISODate(new Date())
