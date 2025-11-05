import type { TextItem } from 'pdfjs-dist/types/src/display/api'
import type { WeeklySlot } from '@/lib/schemas'
import { normalizeTimeString } from '@/lib/time'

let pdfModulePromise: Promise<typeof import('pdfjs-dist')> | null = null

async function loadPdfModule() {
  if (!pdfModulePromise) {
    pdfModulePromise = import('pdfjs-dist')
    const [{ GlobalWorkerOptions }, worker] = await Promise.all([
      pdfModulePromise,
      import('pdfjs-dist/build/pdf.worker?url'),
    ])
    GlobalWorkerOptions.workerSrc = worker.default
  }
  return pdfModulePromise
}

async function getPdfDocument(file: File) {
  const pdfjs = await loadPdfModule()
  const arrayBuffer = await file.arrayBuffer()
  return pdfjs.getDocument({ data: arrayBuffer }).promise
}

export async function extractTextLines(file: File): Promise<string[]> {
  const doc = await getPdfDocument(file)
  const lines: string[] = []
  const pageCount = doc.numPages

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await doc.getPage(pageNumber)
    const textContent = await page.getTextContent()
    const items = textContent.items as TextItem[]
    for (const item of items) {
      if ('str' in item) {
        lines.push(item.str.trim())
      }
    }
  }

  await doc.destroy()
  return lines.filter((line) => line.length > 0)
}

export type RosterEntry = {
  number: string
  name: string
  nationalId?: string
}

const ROSTER_PATTERN = /^(?<number>\d{1,3})\s+(?<name>[A-ZÀ-Ÿ' -]{2,})(?:\s+(?<id>[A-Z0-9]{4,}))?$/

export function parseRosterLines(lines: string[]): RosterEntry[] {
  const entries: RosterEntry[] = []
  for (const raw of lines) {
    const line = raw.replace(/[\.]+\s*/g, ' ').trim()
    const match = line.match(ROSTER_PATTERN)
    if (match?.groups) {
      const name = match.groups.name.trim().replace(/\s+/g, ' ')
      if (!name) continue
      entries.push({
        number: match.groups.number.padStart(2, '0'),
        name,
        nationalId: match.groups.id?.trim(),
      })
    }
  }
  return entries
}

export async function parseRosterPdf(file: File): Promise<RosterEntry[]> {
  const lines = await extractTextLines(file)
  const entries = parseRosterLines(lines)
  if (entries.length === 0) {
    throw new Error('No roster entries detected — adjust the PDF or import via CSV.')
  }
  return entries
}

const DAY_KEYWORDS: Record<string, number> = {
  MON: 1,
  MONDAY: 1,
  TUE: 2,
  TUESDAY: 2,
  WED: 3,
  WEDNESDAY: 3,
  THU: 4,
  THURSDAY: 4,
  FRI: 5,
  FRIDAY: 5,
  SAT: 6,
  SATURDAY: 6,
  SUN: 7,
  SUNDAY: 7,
}

const SLOT_PATTERN = /(?<start>\d{1,2}(?::\d{2})?|\d{1,2}h\d{0,2})\s*[-–]\s*(?<end>\d{1,2}(?::\d{2})?|\d{1,2}h\d{0,2})\s+(?<code>[A-Z0-9]{3,})/g

export function parseTimetableLines(lines: string[]): WeeklySlot[] {
  const slots: WeeklySlot[] = []
  let currentDay: number = 1
  for (const raw of lines) {
    const line = raw.trim()
    if (line.length === 0) continue

    const normalized = line.toUpperCase()
    for (const [keyword, day] of Object.entries(DAY_KEYWORDS)) {
      if (normalized.startsWith(keyword)) {
        currentDay = day
        break
      }
    }

    const matches = line.matchAll(SLOT_PATTERN)
    for (const match of matches) {
      if (!match.groups) continue
      const start = normalizeTimeString(match.groups.start)
      const end = normalizeTimeString(match.groups.end)
      slots.push({
        day: currentDay,
        start,
        end,
        groupCode: match.groups.code.trim(),
      })
    }
  }

  return slots
}

export async function parseTimetablePdf(file: File): Promise<WeeklySlot[]> {
  const lines = await extractTextLines(file)
  const slots = parseTimetableLines(lines)
  if (slots.length === 0) {
    throw new Error('No timetable slots detected — ensure the PDF includes time ranges and group codes.')
  }
  return slots
}
