import { useMemo, useState } from 'react'

import { exportGradesToCsv, exportGradesToPdf, exportRecordBookPdf } from '@/lib/export'
import { toast } from '@/lib/toast'
import { assessmentKinds, type AssessmentKind, type Group, type Lesson, type Student } from '@/lib/schemas'

type RecordBookExporterProps = {
  group: Group
  lessons: Lesson[]
  students: Student[]
  marks: Record<string, Partial<Record<AssessmentKind, number | null>>>
}

export function RecordBookExporter({ group, lessons, students, marks }: RecordBookExporterProps) {
  const [range, setRange] = useState<{ from?: string; to?: string }>({})

  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      if (range.from && lesson.date < range.from) return false
      if (range.to && lesson.date > range.to) return false
      return true
    })
  }, [lessons, range])

  const handleExportRecordBook = async () => {
    await exportRecordBookPdf(group, filteredLessons, students)
    toast.success('Record book PDF saved to your device.')
  }

  const handleExportGradesCsv = async () => {
    await exportGradesToCsv(group, students, marks)
    toast.success('Grades CSV saved to your device.')
  }

  const handleExportGradesPdf = async () => {
    await exportGradesToPdf(group, students, marks)
    toast.success('Grades PDF saved to your device.')
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Export options</h2>
          <p className="mt-1 text-sm text-slate-500">Choose a date range and export grades or record book summaries.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <label className="flex flex-col gap-1 text-slate-600">
            From
            <input
              type="date"
              value={range.from ?? ''}
              onChange={(event) => setRange((prev) => ({ ...prev, from: event.target.value || undefined }))}
              className="rounded-xl border border-slate-200 px-3 py-2 focus:border-sky-300 focus:outline-none focus:ring-1 focus:ring-sky-300"
            />
          </label>
          <label className="flex flex-col gap-1 text-slate-600">
            To
            <input
              type="date"
              value={range.to ?? ''}
              onChange={(event) => setRange((prev) => ({ ...prev, to: event.target.value || undefined }))}
              className="rounded-xl border border-slate-200 px-3 py-2 focus:border-sky-300 focus:outline-none focus:ring-1 focus:ring-sky-300"
            />
          </label>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={handleExportGradesCsv}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-sky-200 hover:text-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
        >
          Export grades CSV
        </button>
        <button
          type="button"
          onClick={handleExportGradesPdf}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-sky-200 hover:text-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
        >
          Export grades PDF
        </button>
        <button
          type="button"
          onClick={handleExportRecordBook}
          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
        >
          Export record book PDF
        </button>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Exports are generated locally and saved to your device. CSV columns include {['number', 'name', ...assessmentKinds].join(', ')}.
      </p>
    </div>
  )
}
