import { assessmentKinds, assessmentMaxDefaults, type AssessmentKind, type Group, type Lesson, type Student } from '@/lib/schemas'

const supportsFilePicker = typeof window !== 'undefined' && 'showSaveFilePicker' in window

type SaveOptions = {
  blob: Blob
  suggestedName: string
  mimeType: string
}

async function saveBlob({ blob, suggestedName, mimeType }: SaveOptions) {
  if (supportsFilePicker) {
    const picker = await (window as any).showSaveFilePicker?.({
      suggestedName,
      types: [
        {
          description: mimeType,
          accept: {
            [mimeType]: ['.' + suggestedName.split('.').pop()],
          },
        },
      ],
    })
    if (picker) {
      const writable = await picker.createWritable()
      await writable.write(blob)
      await writable.close()
      return
    }
  }

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = suggestedName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export async function exportGradesToCsv(
  group: Group,
  students: Student[],
  marks: Record<string, Partial<Record<AssessmentKind, number | null>>>,
) {
  const papa = await import('papaparse')
  const rows = students.map((student) => {
    const entry: Record<string, string | number | null> = {
      number: student.number,
      name: student.name,
    }
    assessmentKinds.forEach((kind) => {
      entry[kind] = marks[student.id]?.[kind] ?? null
    })
    return entry
  })

  const csv = papa.unparse(rows, {
    columns: ['number', 'name', ...assessmentKinds],
  })

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  await saveBlob({ blob, suggestedName: `${group.code}-grades.csv`, mimeType: 'text/csv' })
}

function buildRecordBookMarkup(group: Group, lessons: Lesson[], students: Student[]) {
  const container = document.createElement('div')
  container.className = 'record-book-print'
  container.innerHTML = `
    <style>
      .record-book-print { font-family: Inter, system-ui, sans-serif; color: #0f172a; padding: 24px; }
      .record-book-print h1 { font-size: 20px; margin-bottom: 8px; }
      .record-book-print table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      .record-book-print th, .record-book-print td { border: 1px solid #cbd5f5; padding: 8px; font-size: 12px; text-align: left; }
      .record-book-print th { background: #f1f5f9; }
    </style>
    <h1>Record Book · ${group.code}</h1>
    <p>Total students: ${students.length}</p>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Time</th>
          <th>Theme</th>
          <th>Warm-up</th>
          <th>Presentation</th>
          <th>Practice</th>
          <th>Production</th>
          <th>Homework</th>
          <th>Observations</th>
        </tr>
      </thead>
      <tbody>
        ${lessons
          .map(
            (lesson) => `
              <tr>
                <td>${lesson.date}</td>
                <td>${lesson.start} – ${lesson.end}</td>
                <td>${lesson.theme ?? ''}</td>
                <td>${lesson.stageNotes?.warmup ?? ''}</td>
                <td>${lesson.stageNotes?.presentation ?? ''}</td>
                <td>${lesson.stageNotes?.practice ?? ''}</td>
                <td>${lesson.stageNotes?.production ?? ''}</td>
                <td>${lesson.stageNotes?.homework ?? ''}</td>
                <td>${lesson.observations ?? ''}</td>
              </tr>
            `,
          )
          .join('')}
      </tbody>
    </table>
  `
  return container
}

export async function exportRecordBookPdf(group: Group, lessons: Lesson[], students: Student[]) {
  const element = buildRecordBookMarkup(group, lessons, students)
  document.body.appendChild(element)
  const html2pdf = (await import('html2pdf.js')).default
  await html2pdf().from(element).set({
    margin: 0.5,
    filename: `${group.code}-record-book.pdf`,
    jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' },
  }).save()
  document.body.removeChild(element)
}

export async function exportGradesToPdf(
  group: Group,
  students: Student[],
  marks: Record<string, Partial<Record<AssessmentKind, number | null>>>,
) {
    const rows = students.map((student) => {
      const values = assessmentKinds
        .map((kind) => marks[student.id]?.[kind] ?? '')
        .map((value) => `<td>${value === null ? '' : value}</td>`)
        .join('')
    return `
      <tr>
        <td>${student.number}</td>
        <td>${student.name}</td>
        ${values}
      </tr>
    `
  })

  const container = document.createElement('div')
  container.className = 'grades-print'
  container.innerHTML = `
    <style>
      .grades-print { font-family: Inter, system-ui, sans-serif; color: #0f172a; padding: 24px; }
      .grades-print table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      .grades-print th, .grades-print td { border: 1px solid #cbd5f5; padding: 6px; font-size: 11px; text-align: left; }
      .grades-print th { background: #f1f5f9; }
    </style>
    <h1>Grades · ${group.code}</h1>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Student</th>
          ${assessmentKinds.map((kind) => `<th>${kind} / ${assessmentMaxDefaults[kind]}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows.join('')}
      </tbody>
    </table>
  `

  document.body.appendChild(container)
  const html2pdf = (await import('html2pdf.js')).default
  await html2pdf().from(container).set({
    margin: 0.5,
    filename: `${group.code}-grades.pdf`,
    jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' },
  }).save()
  document.body.removeChild(container)
}
