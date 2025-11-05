import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { devtools } from 'zustand/middleware'
import { db } from '@/lib/db'
import {
  defaultLessonTemplate,
  groupSchema,
  lessonSchema,
  markSchema,
  observationSchema,
  studentSchema,
  weeklyScheduleSchema,
  type AssessmentKind,
  type Group,
  type Lesson,
  type Mark,
  type Observation,
  type RosterRow,
  type Student,
  type WeeklySchedule,
} from '@/lib/schemas'
import { nowIsoDate } from '@/lib/time'

type AppState = {
  hydrated: boolean
  loading: boolean
  groups: Group[]
  students: Student[]
  marks: Mark[]
  observations: Observation[]
  lessons: Lesson[]
  schedules: WeeklySchedule[]
  selectedGroupId?: string
  init: () => Promise<void>
  selectGroup: (id?: string) => void
  createGroup: (input: Pick<Group, 'code' | 'grade'>) => Promise<Group>
  updateGroup: (id: string, changes: Partial<Group>) => Promise<void>
  deleteGroup: (id: string) => Promise<void>
  createStudent: (input: Pick<Student, 'groupId' | 'number' | 'name' | 'nationalId'>) => Promise<Student>
  updateStudent: (id: string, changes: Partial<Student>) => Promise<void>
  deleteStudent: (id: string) => Promise<void>
  mergeRoster: (groupId: string, rows: RosterRow[]) => Promise<{ added: number; updated: number }>
  upsertMark: (studentId: string, kind: AssessmentKind, value: number | null, max?: number) => Promise<void>
  bulkUpsertMarks: (
    studentId: string,
    payload: Partial<Record<AssessmentKind, number | null>>,
  ) => Promise<void>
  removeMarksForStudents: (studentIds: string[]) => Promise<void>
  addObservation: (input: Omit<Observation, 'id'>) => Promise<Observation>
  removeObservation: (id: string) => Promise<void>
  saveLesson: (input: Omit<Lesson, 'id'> & { id?: string }) => Promise<Lesson>
  deleteLesson: (id: string) => Promise<void>
  saveSchedule: (input: Omit<WeeklySchedule, 'id'> & { id?: string }) => Promise<WeeklySchedule>
  deleteSchedule: (id: string) => Promise<void>
  getGroupStudents: (groupId: string) => Student[]
  getStudentMarks: (studentId: string) => Partial<Record<AssessmentKind, Mark>>
  getGroupLessons: (groupId: string) => Lesson[]
  getScheduleById: (id?: string) => WeeklySchedule | undefined
  getGroupSchedule: (group: Group) => WeeklySchedule | undefined
}

const sortGroups = (groups: Group[]) => [...groups].sort((a, b) => a.code.localeCompare(b.code))
const sortStudents = (students: Student[]) =>
  [...students].sort((a, b) => Number(a.number) - Number(b.number) || a.name.localeCompare(b.name))
const sortLessons = (lessons: Lesson[]) => [...lessons].sort((a, b) => a.date.localeCompare(b.date))

const withValidation = <T>(schema: { parse: (input: unknown) => T }, value: unknown): T => schema.parse(value)

export const useAppStore = create<AppState>()(
  devtools((set, get) => ({
    hydrated: false,
    loading: false,
    groups: [],
    students: [],
    marks: [],
    observations: [],
    lessons: [],
    schedules: [],
    selectedGroupId: undefined,

    init: async () => {
      if (get().hydrated) return
      set({ loading: true })
      try {
        await db.open()
        const [groups, students, marks, observations, lessons, schedules] = await Promise.all([
          db.groups.toArray(),
          db.students.toArray(),
          db.marks.toArray(),
          db.observations.toArray(),
          db.lessons.toArray(),
          db.schedules.toArray(),
        ])

        set({
          groups: sortGroups(groups),
          students: sortStudents(students),
          marks,
          observations,
          lessons: sortLessons(lessons),
          schedules,
          hydrated: true,
          loading: false,
          selectedGroupId: groups[0]?.id,
        })
      } catch (error) {
        console.error('Failed to initialise store', error)
        set({ loading: false })
      }
    },

    selectGroup: (id?: string) => set({ selectedGroupId: id }),

    createGroup: async (input) => {
      const now = Date.now()
      const group = withValidation(groupSchema, {
        id: nanoid(),
        code: input.code,
        grade: input.grade,
        createdAt: now,
      })

      await db.groups.add(group)
      set((state) => ({
        groups: sortGroups([...state.groups, group]),
      }))
      return group
    },

    updateGroup: async (id, changes) => {
      const { groups } = get()
      const current = groups.find((group) => group.id === id)
      if (!current) return

      const updated = { ...current, ...changes }
      const valid = withValidation(groupSchema, updated)
      await db.groups.put(valid)
      set((state) => ({
        groups: sortGroups(state.groups.map((group) => (group.id === id ? valid : group))),
      }))
    },

    deleteGroup: async (id) => {
      const studentIdsForGroup = get()
        .students.filter((student) => student.groupId === id)
        .map((student) => student.id)

      await db.transaction('rw', [db.groups, db.students, db.marks, db.lessons, db.observations], async () => {
        await db.groups.delete(id)
        if (studentIdsForGroup.length) {
          await db.students.where('groupId').equals(id).delete()
          await db.marks.where('studentId').anyOf(studentIdsForGroup).delete()
          await db.observations.where('studentId').anyOf(studentIdsForGroup).delete()
        }
        await db.lessons.where('groupId').equals(id).delete()
      })

      set((state) => {
        const remainingGroups = sortGroups(state.groups.filter((group) => group.id !== id))
        const remainingStudents = state.students.filter((student) => student.groupId !== id)
        const remainingMarks = state.marks.filter((mark) => !studentIdsForGroup.includes(mark.studentId))
        const remainingLessons = state.lessons.filter((lesson) => lesson.groupId !== id)
        const remainingObservations = state.observations.filter(
          (observation) => !studentIdsForGroup.includes(observation.studentId),
        )
        const selectedGroupId = state.selectedGroupId === id ? remainingGroups[0]?.id : state.selectedGroupId
        return {
          groups: remainingGroups,
          students: remainingStudents,
          marks: remainingMarks,
          lessons: remainingLessons,
          observations: remainingObservations,
          selectedGroupId,
        }
      })
    },

    createStudent: async (input) => {
      const now = Date.now()
      const student = withValidation(studentSchema, {
        id: nanoid(),
        createdAt: now,
        ...input,
      })
      await db.students.add(student)
      set((state) => ({
        students: sortStudents([...state.students, student]),
      }))
      return student
    },

    updateStudent: async (id, changes) => {
      const { students } = get()
      const current = students.find((student) => student.id === id)
      if (!current) return
      const updated = withValidation(studentSchema, { ...current, ...changes })
      await db.students.put(updated)
      set((state) => ({
        students: sortStudents(state.students.map((student) => (student.id === id ? updated : student))),
      }))
    },

    deleteStudent: async (id) => {
      await db.transaction('rw', db.students, db.marks, db.observations, async () => {
        await db.students.delete(id)
        await db.marks.where('studentId').equals(id).delete()
        await db.observations.where('studentId').equals(id).delete()
      })

      set((state) => ({
        students: state.students.filter((student) => student.id !== id),
        marks: state.marks.filter((mark) => mark.studentId !== id),
        observations: state.observations.filter((observation) => observation.studentId !== id),
      }))
    },

    mergeRoster: async (groupId, rows) => {
      const existing = get().students.filter((student) => student.groupId === groupId)
      const byNumber = new Map(existing.map((student) => [student.number, student]))
      const updates: Student[] = []
      const additions: Student[] = []

      rows.forEach((row) => {
        const normalizedNumber = row.number.trim()
        const normalizedName = row.name.trim()
        const found = byNumber.get(normalizedNumber)
        if (found) {
          const merged = { ...found, name: normalizedName, nationalId: row.nationalId ?? found.nationalId }
          updates.push(withValidation(studentSchema, merged))
        } else {
          additions.push(
            withValidation(studentSchema, {
              id: nanoid(),
              groupId,
              number: normalizedNumber,
              name: normalizedName,
              nationalId: row.nationalId,
              createdAt: Date.now(),
            }),
          )
        }
      })

      await db.transaction('rw', db.students, async () => {
        if (updates.length) await db.students.bulkPut(updates)
        if (additions.length) await db.students.bulkAdd(additions)
      })

      set((state) => ({
        students: sortStudents([
          ...state.students.filter((student) => student.groupId !== groupId),
          ...existing.map((student) => updates.find((item) => item.id === student.id) ?? student),
          ...additions,
        ]),
      }))

      return { added: additions.length, updated: updates.length }
    },

    upsertMark: async (studentId, kind, value, max = 10) => {
      const { marks } = get()
      const existing = marks.find((mark) => mark.studentId === studentId && mark.kind === kind)

      if (existing) {
        const updated = withValidation(markSchema, { ...existing, value, max })
        await db.marks.put(updated)
        set((state) => ({
          marks: state.marks.map((mark) => (mark.id === existing.id ? updated : mark)),
        }))
        return
      }

      const created = withValidation(markSchema, {
        id: nanoid(),
        studentId,
        kind,
        value,
        max,
        date: nowIsoDate(),
      })
      await db.marks.add(created)
      set((state) => ({ marks: [...state.marks, created] }))
    },

    bulkUpsertMarks: async (studentId, payload) => {
      await Promise.all(
        Object.entries(payload).map(([kind, value]) =>
          get().upsertMark(studentId, kind as AssessmentKind, value ?? null, 10),
        ),
      )
    },

    removeMarksForStudents: async (studentIds) => {
      if (!studentIds.length) return
      await db.marks.where('studentId').anyOf(studentIds).delete()
      set((state) => ({
        marks: state.marks.filter((mark) => !studentIds.includes(mark.studentId)),
      }))
    },

    addObservation: async (input) => {
      const observation = withValidation(observationSchema, {
        id: nanoid(),
        ...input,
      })
      await db.observations.add(observation)
      set((state) => ({ observations: [...state.observations, observation] }))
      return observation
    },

    removeObservation: async (id) => {
      await db.observations.delete(id)
      set((state) => ({
        observations: state.observations.filter((observation) => observation.id !== id),
      }))
    },

    saveLesson: async (input) => {
      const stageNotes = { ...defaultLessonTemplate, ...input.stageNotes }
      const candidate = input.id
        ? { ...input, stageNotes }
        : { ...input, id: nanoid(), stageNotes }

      const valid = withValidation(lessonSchema, candidate)
      await db.lessons.put(valid)
      set((state) => ({
        lessons: sortLessons([...state.lessons.filter((lesson) => lesson.id !== valid.id), valid]),
      }))
      return valid
    },

    deleteLesson: async (id) => {
      await db.lessons.delete(id)
      set((state) => ({ lessons: state.lessons.filter((lesson) => lesson.id !== id) }))
    },

    saveSchedule: async (input) => {
      const existing = input.id ? get().schedules.find((schedule) => schedule.id === input.id) : undefined
      const candidate: WeeklySchedule = withValidation(weeklyScheduleSchema, {
        ...existing,
        ...input,
        id: input.id ?? nanoid(),
        createdAt: existing?.createdAt ?? input.createdAt ?? Date.now(),
      })

      await db.schedules.put(candidate)
      set((state) => ({
        schedules: state.schedules.some((schedule) => schedule.id === candidate.id)
          ? state.schedules.map((schedule) => (schedule.id === candidate.id ? candidate : schedule))
          : [...state.schedules, candidate],
      }))
      return candidate
    },

    deleteSchedule: async (id) => {
      await db.schedules.delete(id)
      set((state) => ({ schedules: state.schedules.filter((schedule) => schedule.id !== id) }))
    },

    getGroupStudents: (groupId) =>
      sortStudents(get().students.filter((student) => student.groupId === groupId)),

    getStudentMarks: (studentId) => {
      const results: Partial<Record<AssessmentKind, Mark>> = {}
      get()
        .marks.filter((mark) => mark.studentId === studentId)
        .forEach((mark) => {
          results[mark.kind] = mark
        })
      return results
    },

    getGroupLessons: (groupId) => sortLessons(get().lessons.filter((lesson) => lesson.groupId === groupId)),

    getScheduleById: (id) => get().schedules.find((schedule) => schedule.id === id),

    getGroupSchedule: (group) => {
      if (!group.scheduleId) {
        const byCode = get().schedules.find((schedule) =>
          schedule.slots.some((slot) => slot.groupCode === group.code),
        )
        return byCode
      }
      return get().schedules.find((schedule) => schedule.id === group.scheduleId)
    },
  })),
)
