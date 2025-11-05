import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Tab } from '@headlessui/react'
import RosterTable from '@/components/RosterTable'
import MarksTable from '@/components/MarksTable'
import LessonForm from '@/components/LessonForm'
import LessonList from '@/components/LessonList'
import TimetableWeek from '@/components/TimetableWeek'
import RecordBookExporter from '@/components/RecordBookExporter'
import { useGroupById } from '@/features/groups'
import { useStudentsByGroup, useStudentActions } from '@/features/students'
import { useMarksMatrix, useMarkActions } from '@/features/marks'
import { useLessonsByGroup, useLessonActions } from '@/features/lessons'
import { useScheduleForGroup } from '@/features/timetable'
import { exportGradesToCsv, exportGradesToPdf } from '@/lib/export'
import type { Lesson } from '@/lib/schemas'
import { toast } from 'sonner'

const tabKeys = ['roster', 'grades', 'lessons', 'timetable', 'record-book'] as const
type TabKey = (typeof tabKeys)[number]

const tabIndexFromKey = (key: TabKey | string | null) => {
  const index = tabKeys.indexOf((key ?? 'roster') as TabKey)
  return index === -1 ? 0 : index
}

const GroupDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTabKey = (searchParams.get('tab') as TabKey | null) ?? 'roster'
  const [editingLesson, setEditingLesson] = useState<Partial<Lesson> | null>(null)

  const group = useGroupById(id)
  const students = useStudentsByGroup(id)
  const marksMatrix = useMarksMatrix(id ?? '')
  const lessons = useLessonsByGroup(id ?? '')
  const schedule = useScheduleForGroup(id ?? '')

  const { updateStudent, deleteStudent, createStudent } = useStudentActions()
  const { upsertMark } = useMarkActions()
  const { saveLesson, deleteLesson } = useLessonActions()

  const sortedStudents = useMemo(
    () =>
      [...students].sort((a, b) => Number(a.number) - Number(b.number) || a.name.localeCompare(b.name)),
    [students],
  )

  if (!group) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Group not found</h1>
        <p className="mt-2 text-sm text-slate-600">Return to the groups page and pick another group.</p>
        <Link
          to="/groups"
          className="mt-4 inline-flex items-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Go to groups
        </Link>
      </div>
    )
  }

  const handleTabChange = (index: number) => {
    const key = tabKeys[index]
    if (key) {
      searchParams.set('tab', key)
      setSearchParams(searchParams, { replace: true })
    }
  }

  const handleStudentAdd = async (input: { number: string; name: string; nationalId?: string }) => {
    await createStudent({ ...input, groupId: group.id })
    toast.success('Student added')
  }

  const handleLessonSave = async (lesson: Lesson) => {
    await saveLesson(lesson)
    setEditingLesson(null)
    toast.success('Lesson saved')
  }

  const handleLessonDelete = async (lesson: Lesson) => {
    if (!window.confirm('Delete this lesson?')) return
    await deleteLesson(lesson.id)
    toast.success('Lesson deleted')
  }

  const marksStudents = sortedStudents

  const handleExportGradesCsv = () =>
    exportGradesToCsv({ group, students: marksStudents, marks: marksMatrix }).catch(() =>
      toast.error('Failed to export CSV'),
    )

  const handleExportGradesPdf = () =>
    exportGradesToPdf({ group, students: marksStudents, marks: marksMatrix }).catch(() =>
      toast.error('Failed to export PDF'),
    )

  const lessonsForRecordBook = lessons

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{group.code}</h1>
            <p className="text-sm text-slate-600">Grade {group.grade}</p>
          </div>
          {schedule && (
            <div className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              {schedule.title}
            </div>
          )}
        </div>
      </header>

      <Tab.Group selectedIndex={tabIndexFromKey(activeTabKey)} onChange={handleTabChange}>
        <Tab.List className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 text-sm">
          {tabKeys.map((key) => (
            <Tab
              key={key}
              className={({ selected }) =>
                `rounded-xl px-4 py-2 font-medium transition ${
                  selected ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:text-brand-600'
                }`
              }
            >
              {key.replace('-', ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels className="mt-4">
          <Tab.Panel className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-slate-600">Roster for {group.code}. Edit inline or add new students.</p>
              <Link to="/import" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                Import more students
              </Link>
            </div>
            <RosterTable
              students={sortedStudents}
              onUpdate={(id, changes) => updateStudent(id, changes)}
              onDelete={(id) => {
                if (window.confirm('Remove this student? Marks will also be deleted.')) {
                  void deleteStudent(id)
                  toast.success('Student removed')
                }
              }}
              onAdd={handleStudentAdd}
            />
          </Tab.Panel>

          <Tab.Panel className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-600">
                Tap cells to edit. Use arrow keys or Enter to move. Ctrl+Z to undo last change.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleExportGradesCsv}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={handleExportGradesPdf}
                  className="rounded-xl bg-brand-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
                >
                  Export PDF
                </button>
              </div>
            </div>
            <MarksTable
              groupId={group.id}
              students={marksStudents}
              marks={marksMatrix}
              onChange={(studentId, kind, value) => upsertMark(studentId, kind, value)}
            />
          </Tab.Panel>

          <Tab.Panel className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <LessonForm
              key={editingLesson?.id ?? 'new-lesson'}
              group={group}
              initial={editingLesson ?? undefined}
              onSave={handleLessonSave}
              onCancel={() => setEditingLesson(null)}
            />
            <LessonList
              lessons={lessons}
              onEdit={(lesson) => setEditingLesson(lesson)}
              onDelete={handleLessonDelete}
            />
          </Tab.Panel>

          <Tab.Panel className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {schedule ? (
              <>
                <TimetableWeek
                  schedule={schedule}
                  onCreateLesson={(slot, date) =>
                    setEditingLesson({
                      groupId: group.id,
                      date,
                      start: slot.start,
                      end: slot.end,
                    })
                  }
                />
                <p className="text-xs text-slate-500">
                  Need edits? Re-import via <Link to="/import" className="font-semibold text-brand-600">Import</Link> or update group schedule reference.
                </p>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No timetable linked yet. Import a timetable PDF to see weekly slots.
              </div>
            )}
          </Tab.Panel>

          <Tab.Panel className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <RecordBookExporter group={group} lessons={lessonsForRecordBook} schedule={schedule} />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  )
}

export default GroupDetailPage
