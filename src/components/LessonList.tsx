import { format, parseISO } from 'date-fns'
import { CalendarIcon, ClockIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'

import type { Lesson } from '@/lib/schemas'
import { DAY_LABELS, formatTimeRange } from '@/lib/time'

type LessonListProps = {
  lessons: Lesson[]
  onEdit?: (lesson: Lesson) => void
  onDelete?: (lessonId: string) => void
}

export function LessonList({ lessons, onEdit, onDelete }: LessonListProps) {
  if (!lessons.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-10 text-center text-sm text-slate-500">
        No lessons logged yet. Use the form to document your next session.
      </div>
    )
  }

  return (
    <ul className="space-y-4">
      {lessons.map((lesson) => {
        const date = parseISO(lesson.date)
        const dayLabel = DAY_LABELS[((date.getDay() + 6) % 7) + 1 as 1 | 2 | 3 | 4 | 5 | 6 | 7]
        return (
          <li
            key={lesson.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-200 hover:shadow-card"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{dayLabel}</p>
                <h3 className="text-lg font-semibold text-slate-900">{lesson.theme ?? 'Untitled lesson'}</h3>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                  <CalendarIcon className="h-4 w-4" />
                  {format(date, 'MMM d, yyyy')}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                  <ClockIcon className="h-4 w-4" />
                  {formatTimeRange(lesson.start, lesson.end)}
                </span>
              </div>
            </div>

            <dl className="mt-4 grid gap-3 md:grid-cols-2">
              {(['warmup', 'presentation', 'practice', 'production', 'homework'] as const).map((key) => (
                <div key={key} className="rounded-xl bg-slate-50/70 p-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{key}</dt>
                  <dd className="mt-1 text-sm text-slate-600">{lesson.stageNotes?.[key] ?? '—'}</dd>
                </div>
              ))}
            </dl>

            {lesson.observations ? (
              <div className="mt-4 rounded-xl bg-sky-50/60 p-3 text-sm text-slate-600">
                <span className="font-semibold text-sky-600">Observations:</span> {lesson.observations}
              </div>
            ) : null}

            {(onEdit || onDelete) && (
              <div className="mt-4 flex gap-3">
                {onEdit ? (
                  <button
                    type="button"
                    onClick={() => onEdit(lesson)}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                  >
                    <PencilSquareIcon className="h-4 w-4" /> Edit lesson
                  </button>
                ) : null}
                {onDelete ? (
                  <button
                    type="button"
                    onClick={() => onDelete(lesson.id)}
                    className="inline-flex items-center gap-1 rounded-xl border border-transparent bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
                  >
                    <TrashIcon className="h-4 w-4" /> Delete
                  </button>
                ) : null}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
