import { addDays, isAfter, parseISO, startOfDay } from 'date-fns'
import { Link } from 'react-router-dom'

import { useAppStore } from '@/store'
import { createDemoData } from '@/lib/sample'
import { toIsoDate } from '@/lib/time'

const quickActions = [
  { title: 'Import PDFs', to: '/import', description: 'Parse rosters and timetables' },
  { title: 'Manage Groups', to: '/groups', description: 'View and edit your classes' },
  { title: 'Record Lesson', to: '/groups', description: 'Log PPP lessons quickly' },
  { title: 'Export Records', to: '/groups', description: 'Download CSV/PDF summaries' },
]

export default function Dashboard() {
  const {
    groupIds,
    groupsMap,
    studentsByGroup,
    lessons,
    activeSchedule,
    initialize,
  } = useAppStore((state) => ({
    groupIds: state.groupIds,
    groupsMap: state.groups,
    studentsByGroup: state.studentsByGroup,
    lessons: Object.values(state.lessons),
    activeSchedule: state.activeScheduleId ? state.schedules[state.activeScheduleId] : undefined,
    initialize: state.initialize,
  }))

  const today = startOfDay(new Date())
  const upcomingLessons = lessons
    .filter((lesson) => isAfter(parseISO(lesson.date), addDays(today, -7)))
    .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))
    .slice(0, 3)

  const groupIdByCode = groupIds.reduce<Record<string, string>>((acc, id) => {
    const group = groupsMap[id]
    if (group) acc[group.code] = id
    return acc
  }, {})

  const upcomingSlots = (() => {
    if (!activeSchedule) return []
    return activeSchedule.slots
      .map((slot) => {
        const [hour, minute] = slot.start.split(':').map((part) => Number.parseInt(part, 10))
        const date = new Date()
        const dayOffset = ((slot.day + 6) % 7) - ((date.getDay() + 6) % 7)
        const slotDate = addDays(startOfDay(date), dayOffset >= 0 ? dayOffset : dayOffset + 7)
        slotDate.setHours(hour, minute, 0, 0)
        return { slot, date: slotDate, groupId: groupIdByCode[slot.groupCode] }
      })
      .filter(({ date }) => isAfter(date, new Date()))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 4)
  })()

  const lastLesson = lessons
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.start.localeCompare(a.start))[0]

  const totalStudents = Object.values(studentsByGroup).reduce((acc, ids) => acc + ids.length, 0)

  const handleSeed = async () => {
    await createDemoData({ force: true, includeLessons: true })
    await initialize()
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Today</h1>
          <p className="mt-1 text-sm text-slate-500">
            Overview of your upcoming lessons, recent groups, and quick actions.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSeed}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-sky-200 hover:text-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
        >
          Create Demo Data
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((item) => (
          <Link
            key={item.title}
            to={item.to}
            className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-sky-200 hover:shadow-card"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">{item.title}</h2>
              <span className="text-sm text-slate-400 transition group-hover:text-sky-500">→</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{item.description}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">Upcoming timetable slots</h2>
          {upcomingSlots.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Import a timetable to preview the week at a glance.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {upcomingSlots.map(({ slot, date, groupId }) => (
                <div key={`${slot.groupCode}-${slot.start}`} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{slot.groupCode}</p>
                    <p className="text-xs text-slate-500">
                      {toIsoDate(date)} · {slot.start} – {slot.end}
                    </p>
                  </div>
                  {groupId ? (
                    <Link
                      to={`/groups/${groupId}`}
                      className="text-xs font-semibold text-sky-600 hover:underline"
                    >
                      Open group
                    </Link>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">Unlinked group</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Classroom snapshot</h2>
          <dl className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <dt>Total groups</dt>
              <dd className="font-semibold text-slate-900">{groupIds.length}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Total students</dt>
              <dd className="font-semibold text-slate-900">{totalStudents}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Lessons logged</dt>
              <dd className="font-semibold text-slate-900">{lessons.length}</dd>
            </div>
          </dl>
          {lastLesson ? (
            <div className="mt-6 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last lesson</p>
              <p className="text-sm font-semibold text-slate-900">
                {lastLesson.theme ?? 'Untitled'} · {lastLesson.date}
              </p>
              <p className="text-xs text-slate-500">
                {lastLesson.start} – {lastLesson.end}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-xs text-slate-400">Log your first lesson to populate the record book.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Recent activity</h2>
        {upcomingLessons.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No recent lessons. Start by creating one from a timetable slot.</p>
        ) : (
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {upcomingLessons.map((lesson) => (
              <li key={lesson.id} className="rounded-xl border border-slate-100 p-4">
                <p className="font-semibold text-slate-900">{lesson.theme ?? 'Untitled lesson'}</p>
                <p className="text-xs text-slate-500">
                  {lesson.date} · {lesson.start} – {lesson.end}
                </p>
                {lesson.observations ? <p className="mt-2 text-sm text-slate-600">{lesson.observations}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
