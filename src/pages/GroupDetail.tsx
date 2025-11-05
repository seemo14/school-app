import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { LessonForm } from '@/components/LessonForm'
import { LessonList } from '@/components/LessonList'
import { MarksTable } from '@/components/MarksTable'
import { RecordBookExporter } from '@/components/RecordBookExporter'
import { RosterTable } from '@/components/RosterTable'
import { TimetableWeek } from '@/components/TimetableWeek'
import {
  type AssessmentKind,
  type Lesson,
  type Student,
  type WeeklySlot,
} from '@/lib/schemas'
import { exportGradesToCsv, exportGradesToPdf } from '@/lib/export'
import { toast } from '@/lib/toast'
import { useAppStore } from '@/store'

const tabs = [
  { name: 'Roster', key: 'roster' as const },
  { name: 'Grades', key: 'grades' as const },
  { name: 'Lessons', key: 'lessons' as const },
  { name: 'Timetable', key: 'timetable' as const },
  { name: 'Record Book', key: 'record-book' as const },
]

type TabKey = (typeof tabs)[number]['key']

export default function GroupDetailPage() {
  const params = useParams<{ id: string; tab?: string }>()
  const navigate = useNavigate()
  const groupId = params.id ?? ''
  const tabParam = params.tab as TabKey | undefined
  const activeTab: TabKey = tabs.some((tab) => tab.key === tabParam) ? (tabParam as TabKey) : 'roster'

  const {
    group,
    students,
    marksMap,
    lessons,
    schedule,
    addLesson,
    updateLesson,
    deleteLesson,
    upsertStudents,
    updateStudent,
    deleteStudent,
    setMark,
    activeSchedule,
  } = useAppStore((state) => {
    const group = state.groups[groupId]
    const studentIds = state.studentsByGroup[groupId] ?? []
    const students: Student[] = studentIds.map((studentId) => state.students[studentId]).filter((s): s is Student => Boolean(s))
    const marksMap = studentIds.reduce<Record<string, Partial<Record<AssessmentKind, number | null>>>>((acc, studentId) => {
      const markIds = state.marksByStudent[studentId] ?? []
      acc[studentId] = markIds.reduce((record, markId) => {
        const mark = state.marks[markId]
        if (mark) record[mark.kind] = mark.value
        return record
      }, {} as Partial<Record<AssessmentKind, number | null>>)
      return acc
    }, {})
    const lessonIds = state.lessonsByGroup[groupId] ?? []
    const lessons = lessonIds
      .map((lessonId) => state.lessons[lessonId])
      .filter((lesson): lesson is Lesson => Boolean(lesson))
      .sort((a, b) => b.date.localeCompare(a.date) || b.start.localeCompare(a.start))
    const schedule = group?.scheduleId ? state.schedules[group.scheduleId] : undefined
    return {
      group,
      students,
      marksMap,
      lessons,
      schedule,
      addLesson: state.addLesson,
      updateLesson: state.updateLesson,
      deleteLesson: state.deleteLesson,
      upsertStudents: state.upsertStudents,
      updateStudent: state.updateStudent,
      deleteStudent: state.deleteStudent,
      setMark: state.setMark,
      activeSchedule: state.activeScheduleId ? state.schedules[state.activeScheduleId] : undefined,
    }
  })

  const [rosterSaving, setRosterSaving] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [prefillLesson, setPrefillLesson] = useState<{ slot: WeeklySlot; date: string } | null>(null)

  if (!group) {
    return (
      <div className="space-y-4">
        <Link to="/groups" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to groups
        </Link>
        <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50 p-10 text-center">
          <h1 className="text-xl font-semibold text-rose-600">Group not found</h1>
          <p className="mt-2 text-sm text-rose-500">This class might have been removed or not created yet.</p>
        </div>
      </div>
    )
  }

  const handleTabChange = (key: TabKey) => {
    if (key === 'roster') {
      navigate(`/groups/${groupId}`)
    } else {
      navigate(`/groups/${groupId}/${key}`)
    }
  }

  const handleAddStudent = async (student: { number: string; name: string; nationalId?: string }) => {
    setRosterSaving(true)
    try {
      await upsertStudents(group.id, [student])
    } finally {
      setRosterSaving(false)
    }
  }

  const handleUpdateStudent = async (studentId: string, patch: Partial<{ number: string; name: string; nationalId?: string }>) => {
    await updateStudent(studentId, patch)
  }

  const handleDeleteStudent = async (studentId: string) => {
    await deleteStudent(studentId)
  }

  const handleLessonSave = async (lesson: Lesson) => {
    if (lessons.some((existing) => existing.id === lesson.id)) {
      const { id: _id, groupId: _groupId, ...patch } = lesson
      await updateLesson(lesson.id, patch)
    } else {
      await addLesson(lesson)
    }
    setEditingLesson(null)
    setPrefillLesson(null)
  }

  const handleCreateFromSlot = (slot: WeeklySlot, date: string) => {
    setPrefillLesson({ slot, date })
    handleTabChange('lessons')
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'roster':
        return (
          <RosterTable
            students={students}
            loading={rosterSaving}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
          />
        )
        case 'grades':
        return (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Marks grid</h2>
                  <p className="text-xs text-slate-500">Use keyboard arrows to move across cells. Data saves instantly.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await exportGradesToCsv(group, students, marksMap)
                      toast.success('Grades CSV saved to your device.')
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-sky-200 hover:text-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                  >
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await exportGradesToPdf(group, students, marksMap)
                      toast.success('Grades PDF saved to your device.')
                    }}
                    className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
                  >
                    Export PDF
                  </button>
                </div>
              </div>
            <MarksTable
              groupId={group.id}
              students={students}
              marks={marksMap}
              onChange={(studentId, kind, value) => setMark(studentId, kind, value)}
            />
          </div>
        )
        case 'lessons': {
        const initialLesson = editingLesson ?? (prefillLesson
          ? {
              id: undefined,
              groupId: group.id,
              date: prefillLesson.date,
              start: prefillLesson.slot.start,
              end: prefillLesson.slot.end,
              theme: `${group.code} – ${prefillLesson.slot.start}`,
              stageNotes: undefined,
              observations: '',
            }
          : undefined)

        return (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <LessonForm
                group={group}
                initial={initialLesson ?? undefined}
                onSave={handleLessonSave}
                onCancel={() => {
                  setEditingLesson(null)
                  setPrefillLesson(null)
                }}
              />
            </div>
            <div>
              <LessonList
                lessons={lessons}
                onEdit={(lesson) => {
                  setEditingLesson(lesson)
                  setPrefillLesson(null)
                }}
                onDelete={(lessonId) => deleteLesson(lessonId)}
              />
            </div>
          </div>
        )
      }
        case 'timetable': {
          const active = schedule ?? activeSchedule
          if (!active) {
            return (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center text-sm text-slate-500">
                No weekly schedule yet. Import a timetable PDF or create one manually.
              </div>
            )
          }
          return <TimetableWeek schedule={active} onCreateLesson={handleCreateFromSlot} />
        }
        case 'record-book':
          return (
            <div className="space-y-4">
              <RecordBookExporter group={group} lessons={lessons} students={students} marks={marksMap} />
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Recent lessons</h2>
                <div className="grid gap-3">
                  {lessons.slice(0, 5).map((lesson) => (
                    <div key={lesson.id} className="rounded-xl border border-slate-200 p-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {lesson.date} · {lesson.theme ?? 'Untitled'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {lesson.start} – {lesson.end}
                      </p>
                      {lesson.observations ? (
                        <p className="mt-2 text-sm text-slate-600">{lesson.observations}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <Link to="/groups" className="font-medium text-slate-500 hover:text-slate-700">
              Groups
            </Link>
            <span>/</span>
            <span className="uppercase tracking-wide text-slate-500">{group.code}</span>
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">{group.code}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {group.grade} · Manage roster, marks, lessons, timetable, and exports.
          </p>
        </div>
        <div className="hidden rounded-full bg-slate-900 px-4 py-2 text-xs font-medium uppercase tracking-wide text-white lg:block">
          {students.length} students
        </div>
      </div>

      <div className="overflow-x-auto">
        <nav className="flex gap-2 rounded-2xl border border-slate-200 bg-white/80 p-1 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={[
                'flex-1 whitespace-nowrap rounded-xl px-4 py-2 text-center text-sm font-medium transition',
                activeTab === tab.key ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100',
              ].join(' ')}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {renderContent()}
    </div>
  )
}
