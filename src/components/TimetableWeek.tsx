import type { WeeklySchedule, WeeklySlot } from '@/lib/schemas'
import { formatTime, nextOccurrenceOf, nowIsoDate, weekdayFromIndex } from '@/lib/time'

type TimetableWeekProps = {
  schedule: WeeklySchedule
  onCreateLesson: (slot: WeeklySlot, date: string) => void
}

const days = [1, 2, 3, 4, 5, 6, 7] as const

export const TimetableWeek = ({ schedule, onCreateLesson }: TimetableWeekProps) => {
  const today = nowIsoDate()

  const slotsByDay = days.map((day) => ({
    day,
    slots: schedule.slots
      .filter((slot) => slot.day === day)
      .sort((a, b) => a.start.localeCompare(b.start)),
  }))

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {slotsByDay.map(({ day, slots }) => (
        <section key={day} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <header className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">{weekdayFromIndex(day)}</h3>
            <span className="text-xs text-slate-500">{slots.length} slot{slots.length === 1 ? '' : 's'}</span>
          </header>
          <ul className="space-y-2">
            {slots.length === 0 && (
              <li className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                No sessions scheduled.
              </li>
            )}
            {slots.map((slot) => {
              const suggestedDate = nextOccurrenceOf(today, slot.day)
              return (
                <li key={`${slot.day}-${slot.start}-${slot.end}-${slot.groupCode}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-slate-700">
                      {formatTime(slot.start)} – {formatTime(slot.end)}
                    </p>
                    <p className="text-xs uppercase tracking-wide text-slate-500">{slot.groupCode}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onCreateLesson(slot, suggestedDate)}
                    className="mt-3 w-full rounded-xl bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600"
                  >
                    Create lesson for {suggestedDate}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

export default TimetableWeek
