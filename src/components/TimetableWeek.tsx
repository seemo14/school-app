import { addDays, format, startOfWeek } from 'date-fns'
import { PlusIcon } from '@heroicons/react/24/outline'

import type { WeeklySchedule, WeeklySlot } from '@/lib/schemas'
import { DAY_LABELS, toIsoDate } from '@/lib/time'

type TimetableWeekProps = {
  schedule: WeeklySchedule
  onCreateLesson: (slot: WeeklySlot, date: string) => void
}

const DAYS: Array<WeeklySlot['day']> = [1, 2, 3, 4, 5, 6, 7]

export function TimetableWeek({ schedule, onCreateLesson }: TimetableWeekProps) {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {DAYS.map((day) => {
        const slots = schedule.slots
          .filter((slot) => slot.day === day)
          .sort((a, b) => a.start.localeCompare(b.start))
        const date = addDays(weekStart, day - 1)
        const isoDate = toIsoDate(date)
        return (
          <section key={day} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <header className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{DAY_LABELS[day]}</h3>
                <p className="text-xs text-slate-400">{format(date, 'MMM d, yyyy')}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                {slots.length} slot{slots.length === 1 ? '' : 's'}
              </span>
            </header>

            {slots.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                No scheduled classes.
              </p>
            ) : (
              <ul className="space-y-3">
                {slots.map((slot) => (
                  <li key={`${slot.groupCode}-${slot.start}`} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{slot.groupCode}</p>
                        <p className="text-xs text-slate-500">
                          {slot.start} – {slot.end}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onCreateLesson(slot, isoDate)}
                        className="inline-flex items-center gap-1 rounded-lg bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700 hover:bg-sky-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                      >
                        <PlusIcon className="h-4 w-4" /> Create lesson
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
