import { describe, expect, it } from 'vitest'
import { nextOccurrenceOf, parseTimeRange } from './time'

describe('time utilities', () => {
  it('parses time ranges with h notation', () => {
    expect(parseTimeRange('09h-10h')).toEqual({ start: '09:00', end: '10:00' })
    expect(parseTimeRange('16h30-17h15')).toEqual({ start: '16:30', end: '17:15' })
  })

  it('parses time ranges with spaces', () => {
    expect(parseTimeRange('08:15 - 09:05')).toEqual({ start: '08:15', end: '09:05' })
  })

  it('returns null for invalid ranges', () => {
    expect(parseTimeRange('hello world')).toBeNull()
  })

  it('computes next occurrence of weekday', () => {
    const monday = nextOccurrenceOf('2025-03-12', 1) // Wed -> next Monday
    expect(monday).toBe('2025-03-17')
    const sameDay = nextOccurrenceOf('2025-03-17', 1)
    expect(sameDay).toBe('2025-03-17')
  })
})
