import { describe, expect, it, vi } from 'vitest'

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: () => ({ promise: Promise.reject(new Error('not implemented in tests')) }),
}))

vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({ default: '' }))

import { __debug } from './pdf'

const { sanitizeGroupCode, detectDay, extractSlotFromLine } = __debug

describe('pdf helpers', () => {
  it('sanitizes group codes', () => {
    expect(sanitizeGroupCode(' 3ascg2 ')).toBe('3ASCG2')
    expect(sanitizeGroupCode('G-1')).toBe('G1')
  })

  it('detects days in multiple languages', () => {
    expect(detectDay('Lundi 09h-10h')).toBe(1)
    expect(detectDay('Friday Session')).toBe(5)
    expect(detectDay('No day text')).toBeNull()
  })

  it('extracts slots from time lines', () => {
    const slot = extractSlotFromLine('09h-10h   3ASCG2', 2)
    expect(slot).toEqual({ day: 2, start: '09:00', end: '10:00', groupCode: '3ASCG2' })
  })

  it('rejects lines without codes', () => {
    expect(extractSlotFromLine('09h-10h', 2)).toBeNull()
  })
})
