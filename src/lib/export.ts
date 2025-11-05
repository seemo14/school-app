import html2pdf from 'html2pdf.js'
import Papa from 'papaparse'
import { assessmentKinds, type AssessmentKind, type Group, type Lesson, type LessonStages, type Student, type WeeklySchedule } from './schemas'
import { formatDateForDisplay, formatTime, getWeekRangeLabel } from './time'

type MarksByStudent = Record<string, Partial<Record<AssessmentKind, number | null>>>

const canUseFileSystemAccess = () => typeof window !== 'undefined' && 'showSaveFilePicker' in window

const saveBlob = async (
  blob: Blob,
  suggestedName: string,
  { mimeType, extensions }: { mimeType: string; extensions: string[] },
) => {
  if (typeof window !== 'undefined') {
    const picker = window.showSaveFilePicker
    if (picker && canUseFileSystemAccess()) {
      const handle = await picker({
        suggestedName,
        types: [
          {
            description: mimeType,
            accept: {
              [mimeType]: extensions,
            },
          },
        ],
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return
    }
  }

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = suggestedName
  anchor.click()
  URL.revokeObjectURL(url)
}

export const exportGradesToCsv = async (params: {
  group: Group
  students: Student[]
  marks: MarksByStudent
  fileName?: string
}) => {
  const { group, students, marks, fileName } = params
  const rows = students.map((student) => {
    const studentMarks = marks[student.id] ?? {}
    const line: Record<string, string | number | null> = {
      number: student.number,
      name: student.name,
    }
    for (const kind of assessmentKinds) {
      const value = studentMarks[kind]
      line[kind] = value ?? ''
    }
    return line
  })

  const csv = Papa.unparse(rows, {
    columns: ['number', 'name', ...assessmentKinds],
  })

  const blob = new Blob([csv], { type: 'text/csv' })
  await saveBlob(blob, fileName ?? `${group.code}-grades.csv`, {
    mimeType: 'text/csv',
    extensions: ['.csv'],
  })
}

export const exportGradesToPdf = async (params: {
  group: Group
  students: Student[]
  marks: MarksByStudent
}) => {
  const { group, students, marks } = params
  const container = document.createElement('div')
  container.innerHTML = `
    <h1 style="font-family: 'Plus Jakarta Sans', Arial, sans-serif;">${group.code} — Grade Sheet</h1>
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead>
        <tr>
          <th style="border:1px solid #e2e8f0;padding:6px;text-align:left;">#</th>
          <th style="border:1px solid #e2e8f0;padding:6px;text-align:left;">Student</th>
          ${assessmentKinds
            .map(
              (kind) =>
                `<th style="border:1px solid #e2e8f0;padding:6px;text-align:center;">${kind}</th>`,
            )
            .join('')}
        </tr>
      </thead>
      <tbody>
        ${students
          .map((student) => {
            const studentMarks = marks[student.id] ?? {}
            return `
              <tr>
                <td style="border:1px solid #e2e8f0;padding:6px;">${student.number}</td>
                <td style="border:1px solid #e2e8f0;padding:6px;">${student.name}</td>
                ${assessmentKinds
                  .map((kind) => {
                    const value = studentMarks[kind] ?? ''
                    return `<td style="border:1px solid #e2e8f0;padding:6px;text-align:center;">${value ?? ''}</td>`
                  })
                  .join('')}
              </tr>
            `
          })
          .join('')}
      </tbody>
    </table>
  `

  let pdfBlob = await html2pdf()
    .set({
      margin: [20, 14, 20, 14],
      jsPDF: { format: 'a4', orientation: 'landscape' },
      html2canvas: { scale: 2 },
    })
    .from(container)
    .output('blob')

  if (!(pdfBlob instanceof Blob)) {
    pdfBlob = new Blob([pdfBlob], { type: 'application/pdf' })
  }

  await saveBlob(pdfBlob as Blob, `${group.code}-grades.pdf`, {
    mimeType: 'application/pdf',
    extensions: ['.pdf'],
  })
}

const renderLessonStage = (label: string, content?: string) =>
  `<tr><th style="text-align:left;padding:4px 8px;width:120px;">${label}</th><td style="padding:4px 8px;">${content ?? ''}</td></tr>`

const renderLessonStages = (stages: LessonStages) =>
  `<table style="width:100%;border-collapse:collapse;margin-top:8px;">${renderLessonStage('Warm-up', stages.warmup)}${renderLessonStage('Presentation', stages.presentation)}${renderLessonStage('Practice', stages.practice)}${renderLessonStage('Production', stages.production)}${renderLessonStage('Homework', stages.homework)}</table>`

export const exportRecordBookPdf = async (params: {
  group: Group
  lessons: Lesson[]
  schedule?: WeeklySchedule | null
  rangeLabel?: string
}) => {
  const { group, lessons, schedule, rangeLabel } = params

  const container = document.createElement('div')
  const heading = `<h1 style="font-family: 'Plus Jakarta Sans', Arial, sans-serif;">${group.code} — Record Book${rangeLabel ? ` (${rangeLabel})` : ''}</h1>`

  const rows = lessons
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(
      (lesson) => `<section style="margin-bottom:24px;padding:12px;border:1px solid #e2e8f0;border-radius:12px;">
        <header style="display:flex;justify-content:space-between;font-weight:600;">
          <span>${formatDateForDisplay(lesson.date)} • ${formatTime(lesson.start)} – ${formatTime(lesson.end)}</span>
          ${lesson.theme ? `<span>${lesson.theme}</span>` : ''}
        </header>
        ${renderLessonStages(lesson.stageNotes)}
        ${lesson.observations ? `<p style="margin-top:12px;"><strong>Observations:</strong> ${lesson.observations}</p>` : ''}
      </section>`,
    )
    .join('')

  const scheduleSection = schedule
    ? `<section style="margin-top:16px;"><h2>Weekly Timetable</h2><ul>${schedule.slots
        .map(
          (slot) =>
            `<li>Day ${slot.day}: ${formatTime(slot.start)} – ${formatTime(slot.end)} (${slot.groupCode})</li>`,
        )
        .join('')}</ul></section>`
    : ''

  container.innerHTML = `${heading}${scheduleSection}${rows}`

  let pdfBlob = await html2pdf()
    .set({
      margin: [20, 14, 20, 14],
      jsPDF: { format: 'a4', orientation: 'portrait' },
      html2canvas: { scale: 2 },
    })
    .from(container)
    .output('blob')

  if (!(pdfBlob instanceof Blob)) {
    pdfBlob = new Blob([pdfBlob], { type: 'application/pdf' })
  }

  await saveBlob(pdfBlob as Blob, `${group.code}-record-book.pdf`, {
    mimeType: 'application/pdf',
    extensions: ['.pdf'],
  })
}

export const getRangeLabel = (startIso: string) => getWeekRangeLabel(startIso)

export type { MarksByStudent }
