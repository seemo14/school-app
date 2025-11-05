import { useMemo, useState } from 'react'
import { formatDateForDisplay, formatTime } from '@/lib/time'
import type { Lesson } from '@/lib/schemas'

type LessonListProps = {
  lessons: Lesson[]
  onEdit?: (lesson: Lesson) => void
  onDelete?: (lesson: Lesson) => void
}

const lessonMatchesFilter = (lesson: Lesson, query: string) => {
  const haystack = `${lesson.theme ?? ''} ${lesson.stageNotes.warmup ?? ''} ${lesson.stageNotes.presentation ?? ''} ${lesson.stageNotes.practice ?? ''}`.toLowerCase()
  return haystack.includes(query.toLowerCase())
}

export const LessonList = ({ lessons, onEdit, onDelete }: LessonListProps) => {
  const [search, setSearch] = useState('')
  const [monthFilter, setMonthFilter] = useState<string>('all')

  const months = useMemo(() => {
    const unique = new Set(lessons.map((lesson) => lesson.date.slice(0, 7)))
    return Array.from(unique).sort().reverse()
  }, [lessons])

  const filtered = useMemo(() => {
    return lessons
      .filter((lesson) => monthFilter === 'all' || lesson.date.startsWith(monthFilter))
      .filter((lesson) => (search ? lessonMatchesFilter(lesson, search) : true))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [lessons, monthFilter, search])

  if (!lessons.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        No lessons logged yet. Start by creating one from the timetable or manually.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by theme or notes"
              className="w-full border-none bg-transparent text-sm focus:outline-none"
            />
          </div>
          <select
            value={monthFilter}
            onChange={(event) => setMonthFilter(event.target.value)}
            className="w-36 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            <option value="all">All months</option>
            {months.map((month) => (
              <option key={month} value={month}>
                {new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, {
                  month: 'long',
                  year: 'numeric',
                })}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ul className="space-y-3">
        {filtered.map((lesson) => (
          <li key={lesson.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {formatDateForDisplay(lesson.date)} • {formatTime(lesson.start)} – {formatTime(lesson.end)}
                </p>
                <p className="text-sm text-slate-500">{lesson.theme ?? 'No theme'}</p>
              </div>
              <div className="flex gap-2 text-xs text-slate-500">
                {lesson.stageNotes.warmup && <span className="rounded-full bg-brand-50 px-2 py-1 text-brand-700">Warm-up</span>}
                {lesson.stageNotes.practice && (
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">Practice</span>
                )}
              </div>
            </div>
            <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
              {Object.entries(lesson.stageNotes).map(([key, value]) =>
                value ? (
                  <div key={key}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{key}</p>
                    <p>{value}</p>
                  </div>
                ) : null,
              )}
            </div>
            {lesson.observations && (
              <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                <span className="font-semibold text-slate-500">Observations:</span> {lesson.observations}
              </p>
            )}
            {(onEdit || onDelete) && (
              <div className="mt-4 flex gap-2">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(lesson)}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(lesson)}
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-100"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default LessonList
