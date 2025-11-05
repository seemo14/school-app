import { Link } from 'react-router-dom'
import { ArrowRightIcon, CalendarIcon, ClipboardDocumentIcon, InboxStackIcon } from '@heroicons/react/24/outline'
import { useEffect, useMemo } from 'react'
import { useAppStore } from '@/store'
import { formatDateForDisplay, nextOccurrenceOf, nowIsoDate } from '@/lib/time'

const quickActions = [
  {
    title: 'Import PDF or CSV',
    description: 'Pull in new student rosters or timetable updates',
    href: '/import',
    icon: InboxStackIcon,
  },
  {
    title: 'Manage Groups',
    description: 'Create, edit or archive class groups',
    href: '/groups',
    icon: ClipboardDocumentIcon,
  },
]

const dayName = (weekday: number) => new Date(2024, 0, weekday).toLocaleDateString(undefined, { weekday: 'long' })

const DashboardPage = () => {
  const init = useAppStore((state) => state.init)
  const hydrated = useAppStore((state) => state.hydrated)
  const groups = useAppStore((state) => state.groups)
  const schedules = useAppStore((state) => state.schedules)
  const lessons = useAppStore((state) => state.lessons)

  useEffect(() => {
    if (!hydrated) void init()
  }, [hydrated, init])

  const events = useMemo(() => {
    const today = nowIsoDate()
    return schedules.flatMap((schedule) =>
      schedule.slots.map((slot) => {
        const matchingGroup = groups.find((group) => group.code === slot.groupCode)
        const startDate = nextOccurrenceOf(today, slot.day)
        const startTime = `${startDate}T${slot.start}:00`
        return {
          id: `${schedule.id}-${slot.day}-${slot.start}-${slot.groupCode}`,
          group: matchingGroup,
          slot,
          start: new Date(startTime),
          scheduleTitle: schedule.title,
        }
      }),
    )
      .filter((event) => Boolean(event.group))
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, 6)
  }, [schedules, groups])

  const lastLesson = useMemo(() => {
    if (!lessons.length) return null
    return [...lessons].sort((a, b) => b.date.localeCompare(a.date))[0]
  }, [lessons])

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-gradient-to-br from-brand-50 via-white to-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Skylark Gradebook</h1>
          <p className="mt-1 text-sm text-slate-600">
            Keep grades, lessons, and rosters in sync. Everything stays on this device until you export.
          </p>
        </div>
        <Link
          to="/groups"
          className="inline-flex items-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
        >
          Go to groups
          <ArrowRightIcon className="ml-2 h-4 w-4" />
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">Upcoming slots</h2>
            <Link to="/import" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
              Update timetable
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {events.length === 0 && (
              <li className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                No timetable slots yet. Import your weekly timetable PDF to see upcoming lessons.
              </li>
            )}
            {events.map((event) => (
              <li key={event.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-slate-800">
                    {dayName(event.slot.day)} • {event.slot.start} – {event.slot.end}
                  </p>
                  <p className="text-sm text-slate-500">{event.group?.code} · {event.scheduleTitle}</p>
                </div>
                <Link
                  to={`/groups/${event.group?.id}?tab=lessons`}
                  className="rounded-full border border-brand-200 px-3 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50"
                >
                  Start lesson
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <aside className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800">Last lesson</h3>
            {lastLesson ? (
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p className="font-medium text-slate-700">
                  {formatDateForDisplay(lastLesson.date)} • {lastLesson.start} – {lastLesson.end}
                </p>
                <p>{lastLesson.theme ?? 'No theme recorded'}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No lessons logged yet.</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800">Quick actions</h3>
            <ul className="mt-4 space-y-3">
              {quickActions.map((action) => (
                <li key={action.title}>
                  <Link
                    to={action.href}
                    className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                  >
                    <action.icon className="mt-0.5 h-5 w-5" />
                    <div>
                      <p className="font-semibold">{action.title}</p>
                      <p className="text-xs text-slate-500">{action.description}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800">Need data quickly?</h2>
        <p className="mt-2 text-sm text-slate-600">
          Use the import screen to pull PDF rosters or schedules, or import CSV fallback files. Export marks anytime from each group detail view.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/import"
            className="inline-flex items-center rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100"
          >
            <InboxStackIcon className="mr-2 h-4 w-4" /> Import data
          </Link>
          <Link
            to="/groups"
            className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <CalendarIcon className="mr-2 h-4 w-4" /> Browse groups
          </Link>
        </div>
      </section>
    </div>
  )
}

export default DashboardPage
