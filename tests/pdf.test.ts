import { describe, expect, it } from 'vitest'

import { parseRosterLines, parseTimetableLines } from '@/lib/pdf'

describe('parseRosterLines', () => {
  it('extracts numbered names with optional IDs', () => {
    const lines = [
      ' 1   ALI AHMED ',
      ' 2   SARA BENNANI   E12345',
      'Random header',
      '03  JOHN DOE  ',
    ]

    const result = parseRosterLines(lines)
    expect(result).toEqual([
      { number: '01', name: 'ALI AHMED' },
      { number: '02', name: 'SARA BENNANI', nationalId: 'E12345' },
      { number: '03', name: 'JOHN DOE' },
    ])
  })
})

describe('parseTimetableLines', () => {
  it('detects day blocks with time ranges and group codes', () => {
    const lines = [
      'Monday',
      '08h-09h 2ASCG1',
      '09:15-10:15 2ASCG2',
      'Tuesday',
      '10h30-11h30 3ASCG1',
    ]

    const slots = parseTimetableLines(lines)
    expect(slots).toEqual([
      { day: 1, start: '08:00', end: '09:00', groupCode: '2ASCG1' },
      { day: 1, start: '09:15', end: '10:15', groupCode: '2ASCG2' },
      { day: 2, start: '10:30', end: '11:30', groupCode: '3ASCG1' },
    ])
  })
})
