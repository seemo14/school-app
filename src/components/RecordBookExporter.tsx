import { useMemo, useState } from 'react'
import { exportRecordBookPdf, getRangeLabel } from '@/lib/export'
import type { Group, Lesson, WeeklySchedule } from '@/lib/schemas'
import { betweenDates, nowIsoDate, toISODate } from '@/lib/time'
import { toast } from 'sonner'

type RecordBookExporterProps = {
  group: Group
  lessons: Lesson[]
  schedule?: WeeklySchedule | null
}

type RangeMode = 'all' | 'this-month' | 'custom'

export const RecordBookExporter = ({ group, lessons, schedule }: RecordBookExporterProps) => {
  const [mode, setMode] = useState<RangeMode>('this-month')
  const [customStart, setCustomStart] = useState<string>(() => nowIsoDate())
  const [customEnd, setCustomEnd] = useState<string>(() => nowIsoDate())
  const [exporting, setExporting] = useState(false)

  const now = new Date()
  const startOfMonth = toISODate(new Date(now.getFullYear(), now.getMonth(), 1))
  const endOfMonth = toISODate(new Date(now.getFullYear(), now.getMonth() + 1, 0))

  const [rangeStart, rangeEnd] = useMemo(() => {
    if (mode === 'all') {
      const sorted = [...lessons].sort((a, b) => a.date.localeCompare(b.date))
      return sorted.length ? [sorted[0].date, sorted[sorted.length - 1].date] : [nowIsoDate(), nowIsoDate()]
    }
    if (mode === 'this-month') {
      return [startOfMonth, endOfMonth]
    }
    return [customStart, customEnd]
  }, [mode, lessons, startOfMonth, endOfMonth, customStart, customEnd])

  const filteredLessons = lessons.filter((lesson) => betweenDates(rangeStart, rangeEnd, lesson.date))

  const handleExport = async () => {
    if (!filteredLessons.length) {
      toast.warning('No lessons in the selected range yet.')
      return
    }
    setExporting(true)
    try {
      await exportRecordBookPdf({
        group,
        lessons: filteredLessons,
        schedule,
        rangeLabel: getRangeLabel(rangeStart),
      })
      toast.success('Record book exported successfully')
    } catch (error) {
      console.error(error)
      toast.error('Failed to export record book')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Record Book</h3>
          <p className="text-sm text-slate-500">Export a printable PDF summary of lessons for {group.code}.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value as RangeMode)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            <option value="this-month">This month</option>
            <option value="all">All lessons</option>
            <option value="custom">Custom range</option>
          </select>
          {mode === 'custom' && (
            <div className="flex gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(event) => setCustomStart(event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
              <input
                type="date"
                value={customEnd}
                min={customStart}
                onChange={(event) => setCustomEnd(event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <span>
          {filteredLessons.length} lesson{filteredLessons.length === 1 ? '' : 's'} between {rangeStart} and {rangeEnd}
        </span>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
        >
          {exporting ? 'Exporting…' : 'Export PDF'}
        </button>
      </div>
    </div>
  )
}

export default RecordBookExporter
