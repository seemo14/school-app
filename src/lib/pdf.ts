import type { TextItem } from 'pdfjs-dist/types/src/display/api'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { assessmentKinds, rosterRowSchema, weeklySlotSchema, type ParsedRoster, type ParsedSchedule, type WeeklySlot } from './schemas'
import { parseTimeRange } from './time'

GlobalWorkerOptions.workerSrc = pdfWorker

const rosterRegex = /^\s*(\d{1,3})\s+([A-ZÀ-ÿ' -]+?)(?:\s{2,}([A-Z0-9]+))?\s*$/

const dayTokens: Record<string, number> = {
  monday: 1,
  mon: 1,
  lundi: 1,
  tuesday: 2,
  tue: 2,
  mardi: 2,
  wednesday: 3,
  wed: 3,
  mercredi: 3,
  thursday: 4,
  thu: 4,
  jeudi: 4,
  friday: 5,
  fri: 5,
  vendredi: 5,
  saturday: 6,
  sat: 6,
  samedi: 6,
  sunday: 7,
  sun: 7,
  dimanche: 7,
}

type RawPdfText = {
  pages: string[]
  fileName: string
}

const extractPdfText = async (file: File): Promise<RawPdfText> => {
  const buffer = await file.arrayBuffer()
  const doc = await getDocument({ data: buffer }).promise
  const pages: string[] = []

  for (let pageIndex = 1; pageIndex <= doc.numPages; pageIndex += 1) {
    const page = await doc.getPage(pageIndex)
    const textContent = await page.getTextContent()
    const strings = textContent.items
      .map((item) => (item as TextItem).str)
      .filter(Boolean)
    pages.push(strings.join('\n'))
  }

  return { pages, fileName: file.name }
}

const normaliseName = (input: string) =>
  input
    .replace(/\s{2,}/g, ' ')
    .replace(/\b([A-ZÀ-ÿ])([A-ZÀ-ÿ]+)/g, (_, first: string, rest: string) => `${first}${rest.toLowerCase()}`)
    .trim()

export const parseRosterPdf = async (file: File): Promise<ParsedRoster> => {
  const { pages } = await extractPdfText(file)
  const rows: ParsedRoster['rows'] = []

  for (const page of pages) {
    const lines = page.split(/\n+/).map((line) => line.trim()).filter(Boolean)
    for (const line of lines) {
      const match = rosterRegex.exec(line)
      if (!match) continue
      const [, numberRaw, nameRaw, idRaw] = match
      const parsed = rosterRowSchema.safeParse({
        number: numberRaw,
        name: normaliseName(nameRaw),
        nationalId: idRaw?.trim() || undefined,
      })
      if (parsed.success) {
        rows.push(parsed.data)
      }
    }
  }

  return { rows, metadata: { pageCount: pages.length } }
}

const sanitizeGroupCode = (value: string) => value.replace(/[^0-9A-Z]/gi, '').toUpperCase()

const detectDay = (line: string): number | null => {
  const normalized = line.toLowerCase().replace(/[^a-z]/g, ' ')
  const tokens = normalized.split(/\s+/)
  for (const token of tokens) {
    if (dayTokens[token]) {
      return dayTokens[token]
    }
  }
  return null
}

const extractSlotFromLine = (line: string, currentDay: number | null): WeeklySlot | null => {
  const timeMatch = parseTimeRange(line)
  if (!timeMatch || !currentDay) return null

  const codeMatch = line.match(/([0-9A-Z]{3,})$/)
  if (!codeMatch) return null

  const slotCandidate = {
    day: currentDay,
    start: timeMatch.start,
    end: timeMatch.end,
    groupCode: sanitizeGroupCode(codeMatch[1]),
  }

  const parsed = weeklySlotSchema.safeParse(slotCandidate)
  return parsed.success ? parsed.data : null
}

export const parseTimetablePdf = async (file: File): Promise<ParsedSchedule> => {
  const { pages, fileName } = await extractPdfText(file)
  const slots: WeeklySlot[] = []
  let currentDay: number | null = null

  for (const page of pages) {
    const lines = page.split(/\n+/).map((line) => line.trim()).filter(Boolean)
    for (const line of lines) {
      const day = detectDay(line)
      if (day) {
        currentDay = day
        continue
      }

      const slot = extractSlotFromLine(line, currentDay)
      if (slot) {
        slots.push(slot)
      }
    }
  }

  const title = file.name.replace(/\.[^.]+$/, '')
  return {
    title,
    slots,
    sourcePdfName: fileName,
  }
}

export const isAssessmentKind = (value: string) =>
  assessmentKinds.includes(value as (typeof assessmentKinds)[number])

export const __debug = {
  sanitizeGroupCode,
  detectDay,
  extractSlotFromLine,
}
