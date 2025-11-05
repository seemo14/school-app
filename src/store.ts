import { nanoid } from 'nanoid'
import { create } from 'zustand'

import { db } from '@/lib/db'
import {
  type AssessmentKind,
  type Grade,
  type Group,
  type Lesson,
  type LessonStageNotes,
  type Mark,
  type Observation,
  type Student,
  type WeeklySchedule,
  assessmentMaxDefaults,
  defaultStageNotes,
  groupSchema,
  lessonSchema,
  markSchema,
  observationSchema,
  studentSchema,
  weeklyScheduleSchema,
} from '@/lib/schemas'

type EntityMap<T extends { id: string }> = Record<string, T>

type GroupInput = {
  code: string
  grade: Grade
  scheduleId?: string
}

type StudentInput = {
  id?: string
  number: string
  name: string
  nationalId?: string
}

type LessonInput = Omit<Lesson, 'id'> & { id?: string }

type ScheduleInput = Omit<WeeklySchedule, 'id' | 'createdAt'> & { id?: string }

type ObservationInput = Omit<Observation, 'id'> & { id?: string }

type AppError = string | null

type AppState = {
  ready: boolean
  initializing: boolean
  error: AppError

  groups: EntityMap<Group>
  groupIds: string[]

  students: EntityMap<Student>
  studentsByGroup: Record<string, string[]>

  marks: EntityMap<Mark>
  marksByStudent: Record<string, string[]>

  observations: EntityMap<Observation>
  observationsByStudent: Record<string, string[]>

  lessons: EntityMap<Lesson>
  lessonsByGroup: Record<string, string[]>

  schedules: EntityMap<WeeklySchedule>
  scheduleIds: string[]
  activeScheduleId?: string

  initialize: () => Promise<void>
  reset: () => Promise<void>

  createGroup: (input: GroupInput) => Promise<Group>
  updateGroup: (id: string, patch: Partial<Omit<Group, 'id' | 'createdAt'>>) => Promise<Group>
  deleteGroup: (id: string) => Promise<void>

  upsertStudents: (groupId: string, inputs: StudentInput[], mergeByNumber?: boolean) => Promise<Student[]>
  updateStudent: (id: string, patch: Partial<Omit<Student, 'id' | 'groupId' | 'createdAt'>>) => Promise<Student>
  deleteStudent: (id: string) => Promise<void>

  setMark: (
    studentId: string,
    kind: AssessmentKind,
    value: number | null,
    options?: { max?: number; date?: string },
  ) => Promise<Mark>
  bulkSetMarks: (
    updates: Array<{ studentId: string; kind: AssessmentKind; value: number | null; max?: number; date?: string }>,
  ) => Promise<void>
  deleteMark: (id: string) => Promise<void>

  addObservation: (input: ObservationInput) => Promise<Observation>
  deleteObservation: (id: string) => Promise<void>

  addLesson: (input: LessonInput) => Promise<Lesson>
  updateLesson: (id: string, patch: Partial<Omit<Lesson, 'id' | 'groupId'>>) => Promise<Lesson>
  deleteLesson: (id: string) => Promise<void>

  saveSchedule: (input: ScheduleInput) => Promise<WeeklySchedule>
  deleteSchedule: (id: string) => Promise<void>
  setActiveSchedule: (id?: string) => void
}

const emptyState = (): Omit<AppState, keyof Pick<AppState, 'initialize' | 'reset' | 'createGroup' | 'updateGroup' | 'deleteGroup' | 'upsertStudents' | 'updateStudent' | 'deleteStudent' | 'setMark' | 'bulkSetMarks' | 'deleteMark' | 'addObservation' | 'deleteObservation' | 'addLesson' | 'updateLesson' | 'deleteLesson' | 'saveSchedule' | 'deleteSchedule' | 'setActiveSchedule'>> => ({
  ready: false,
  initializing: false,
  error: null,
  groups: {},
  groupIds: [],
  students: {},
  studentsByGroup: {},
  marks: {},
  marksByStudent: {},
  observations: {},
  observationsByStudent: {},
  lessons: {},
  lessonsByGroup: {},
  schedules: {},
  scheduleIds: [],
  activeScheduleId: undefined,
})

function toEntityMap<T extends { id: string }>(items: T[]): EntityMap<T> {
  return items.reduce<EntityMap<T>>((acc, item) => {
    acc[item.id] = item
    return acc
  }, {})
}

function groupIdsBy<T extends { id: string } & Record<K, string>, K extends keyof T>(
  items: T[],
  key: K,
): Record<string, string[]> {
  return items.reduce<Record<string, string[]>>((acc, item) => {
    const bucket = item[key]
    if (!acc[bucket]) {
      acc[bucket] = []
    }
    acc[bucket]!.push(item.id)
    return acc
  }, {})
}

function withSortedUnique(list: string[], addId: string) {
  if (list.includes(addId)) return [...list]
  return [...list, addId]
}

function withoutId(list: string[], removeId: string) {
  return list.filter((id) => id !== removeId)
}

function sortGroupIds(groups: EntityMap<Group>, ids: string[]) {
  return [...ids].sort((a, b) => {
    const ga = groups[a]
    const gb = groups[b]
    if (!ga || !gb) return 0
    if (ga.grade !== gb.grade) return ga.grade.localeCompare(gb.grade)
    return ga.code.localeCompare(gb.code)
  })
}

function sortStudentIds(students: EntityMap<Student>, ids: string[]) {
  return [...ids].sort((a, b) => {
    const sa = students[a]
    const sb = students[b]
    if (!sa || !sb) return 0
    const nA = parseInt(sa.number, 10)
    const nB = parseInt(sb.number, 10)
    if (!Number.isNaN(nA) && !Number.isNaN(nB)) {
      return nA - nB
    }
    return sa.number.localeCompare(sb.number)
  })
}

function ensureStageNotes(notes?: Partial<LessonStageNotes>): LessonStageNotes {
  return {
    ...defaultStageNotes,
    ...notes,
  }
}

export const useAppStore = create<AppState>()((set, get) => ({
  ...emptyState(),
  ready: false,
  initializing: false,
  error: null,

  async initialize() {
    const state = get()
    if (state.initializing || state.ready) return

    set({ initializing: true, error: null })

    try {
      const [groups, students, marks, observations, lessons, schedules] = await Promise.all([
        db.groups.toArray(),
        db.students.toArray(),
        db.marks.toArray(),
        db.observations.toArray(),
        db.lessons.toArray(),
        db.schedules.toArray(),
      ])

      const groupMap = toEntityMap(groups)
      const studentMap = toEntityMap(students)
      const markMap = toEntityMap(marks)
      const observationMap = toEntityMap(observations)
      const lessonMap = toEntityMap(lessons)
      const scheduleMap = toEntityMap(schedules)

      const studentsByGroup = Object.entries(groupIdsBy(students, 'groupId')).reduce<Record<string, string[]>>(
        (acc, [groupId, ids]) => {
          acc[groupId] = sortStudentIds(studentMap, ids)
          return acc
        },
        {},
      )

      const marksByStudent = groupIdsBy(marks, 'studentId')
      const observationsByStudent = groupIdsBy(observations, 'studentId')
      const lessonsByGroup = groupIdsBy(lessons, 'groupId')

      const sortedGroupIds = sortGroupIds(groupMap, groups.map((g) => g.id))

      set({
        ready: true,
        initializing: false,
        error: null,
        groups: groupMap,
        groupIds: sortedGroupIds,
        students: studentMap,
        studentsByGroup,
        marks: markMap,
        marksByStudent,
        observations: observationMap,
        observationsByStudent,
        lessons: lessonMap,
        lessonsByGroup,
        schedules: scheduleMap,
        scheduleIds: schedules.map((s) => s.id),
        activeScheduleId: schedules[0]?.id,
      })
    } catch (error) {
      console.error('Failed to initialize store', error)
      set({ initializing: false, error: error instanceof Error ? error.message : 'Unknown error' })
    }
  },

  async reset() {
    await db.transaction('rw', [db.groups, db.students, db.marks, db.observations, db.lessons, db.schedules], async () => {
      await Promise.all([
        db.groups.clear(),
        db.students.clear(),
        db.marks.clear(),
        db.observations.clear(),
        db.lessons.clear(),
        db.schedules.clear(),
      ])
    })

    set({
      ...emptyState(),
      ready: true,
    })
  },

  async createGroup(input) {
    const data: Group = groupSchema.parse({
      id: nanoid(),
      code: input.code.trim(),
      grade: input.grade,
      scheduleId: input.scheduleId,
      createdAt: Date.now(),
    })

    await db.groups.put(data)

    set((state) => {
      const groups = { ...state.groups, [data.id]: data }
      return {
        groups,
        groupIds: sortGroupIds(groups, withSortedUnique(state.groupIds, data.id)),
      }
    })

    return data
  },

  async updateGroup(id, patch) {
    const current = get().groups[id]
    if (!current) throw new Error('Group not found')

    const next: Group = groupSchema.parse({ ...current, ...patch })
    await db.groups.put(next)

    set((state) => {
      const groups = { ...state.groups, [id]: next }
      return {
        groups,
        groupIds: sortGroupIds(groups, state.groupIds),
      }
    })

    return next
  },

  async deleteGroup(id) {
    const { studentsByGroup, marksByStudent, lessonsByGroup, observationsByStudent } = get()

    const studentIds = studentsByGroup[id] ?? []
    const markIds = studentIds.flatMap((studentId) => marksByStudent[studentId] ?? [])
    const observationIds = studentIds.flatMap((studentId) => observationsByStudent[studentId] ?? [])
    const lessonIds = lessonsByGroup[id] ?? []

    await db.transaction(
      'rw',
      [db.groups, db.students, db.marks, db.observations, db.lessons],
      async () => {
        await Promise.all([
          db.groups.delete(id),
          ...studentIds.map((studentId) => db.students.delete(studentId)),
          ...markIds.map((markId) => db.marks.delete(markId)),
          ...observationIds.map((obsId) => db.observations.delete(obsId)),
          ...lessonIds.map((lessonId) => db.lessons.delete(lessonId)),
        ])
      },
    )

    set((state) => {
      const { groups, students, marks, observations, lessons } = state
      const nextGroups = { ...groups }
      delete nextGroups[id]

      const nextGroupIds = state.groupIds.filter((groupId) => groupId !== id)

      const nextStudents = { ...students }
      const nextStudentsByGroup = { ...state.studentsByGroup }
      studentIds.forEach((studentId) => {
        delete nextStudents[studentId]
      })
      delete nextStudentsByGroup[id]

      const nextMarks = { ...marks }
      const nextMarksByStudent = { ...state.marksByStudent }
      markIds.forEach((markId) => {
        const mark = marks[markId]
        if (!mark) return
        const list = nextMarksByStudent[mark.studentId] ?? []
        nextMarksByStudent[mark.studentId] = withoutId(list, markId)
        delete nextMarks[markId]
      })

      const nextObs = { ...observations }
      const nextObsByStudent = { ...state.observationsByStudent }
      observationIds.forEach((obsId) => {
        const obs = observations[obsId]
        if (!obs) return
        const list = nextObsByStudent[obs.studentId] ?? []
        nextObsByStudent[obs.studentId] = withoutId(list, obsId)
        delete nextObs[obsId]
      })

      const nextLessons = { ...lessons }
      const nextLessonsByGroup = { ...state.lessonsByGroup }
      lessonIds.forEach((lessonId) => {
        delete nextLessons[lessonId]
      })
      delete nextLessonsByGroup[id]

      return {
        groups: nextGroups,
        groupIds: nextGroupIds,
        students: nextStudents,
        studentsByGroup: nextStudentsByGroup,
        marks: nextMarks,
        marksByStudent: nextMarksByStudent,
        observations: nextObs,
        observationsByStudent: nextObsByStudent,
        lessons: nextLessons,
        lessonsByGroup: nextLessonsByGroup,
      }
    })
  },

  async upsertStudents(groupId, inputs, mergeByNumber = true) {
    const now = Date.now()
    const currentStudents = get().students
    const existingByNumber: Record<string, Student> = {}
    Object.values(currentStudents)
      .filter((student) => student.groupId === groupId)
      .forEach((student) => {
        existingByNumber[student.number.trim().toLowerCase()] = student
      })

    const normalized = inputs.map((input) => ({
      id: input.id ?? nanoid(),
      number: input.number.trim(),
      name: input.name.trim(),
      nationalId: input.nationalId?.trim() || undefined,
    }))

    const parsed = normalized.map((candidate) => {
      const numberKey = candidate.number.trim().toLowerCase()
      const matchByNumber = mergeByNumber ? existingByNumber[numberKey] : undefined
      const matchById = currentStudents[candidate.id]
      const base = matchByNumber ?? matchById
      const id = base?.id ?? candidate.id
      const createdAt = base?.createdAt ?? now

      return studentSchema.parse({
        ...base,
        ...candidate,
        id,
        groupId,
        createdAt,
      })
    })

    await db.transaction('rw', db.students, async () => {
      await Promise.all(parsed.map((student) => db.students.put(student)))
    })

    set((state) => {
      const students = { ...state.students }
      parsed.forEach((student) => {
        students[student.id] = student
      })

      const prevIds = state.studentsByGroup[groupId] ?? []
      const combinedIds = sortStudentIds(students, Array.from(new Set([...prevIds, ...parsed.map((s) => s.id)])))

      return {
        students,
        studentsByGroup: {
          ...state.studentsByGroup,
          [groupId]: combinedIds,
        },
      }
    })

    return parsed
  },

  async updateStudent(id, patch) {
    const current = get().students[id]
    if (!current) throw new Error('Student not found')

    const next = studentSchema.parse({ ...current, ...patch })
    await db.students.put(next)

    set((state) => {
      const students = { ...state.students, [id]: next }
      const groupId = next.groupId
      const studentIds = sortStudentIds(
        students,
        state.studentsByGroup[groupId] ?? [],
      )

      return {
        students,
        studentsByGroup: {
          ...state.studentsByGroup,
          [groupId]: studentIds,
        },
      }
    })

    return next
  },

  async deleteStudent(id) {
    const state = get()
    const student = state.students[id]
    if (!student) return

    const markIds = state.marksByStudent[id] ?? []
    const obsIds = state.observationsByStudent[id] ?? []

    await db.transaction('rw', [db.students, db.marks, db.observations], async () => {
      await Promise.all([
        db.students.delete(id),
        ...markIds.map((markId) => db.marks.delete(markId)),
        ...obsIds.map((obsId) => db.observations.delete(obsId)),
      ])
    })

    set((prev) => {
      const students = { ...prev.students }
      delete students[id]

      const studentsByGroup = { ...prev.studentsByGroup }
      studentsByGroup[student.groupId] = withoutId(studentsByGroup[student.groupId] ?? [], id)

      const marks = { ...prev.marks }
      const marksByStudent = { ...prev.marksByStudent }
      markIds.forEach((markId) => {
        delete marks[markId]
      })
      delete marksByStudent[id]

      const observations = { ...prev.observations }
      const observationsByStudent = { ...prev.observationsByStudent }
      obsIds.forEach((obsId) => {
        delete observations[obsId]
      })
      delete observationsByStudent[id]

      return {
        students,
        studentsByGroup,
        marks,
        marksByStudent,
        observations,
        observationsByStudent,
      }
    })
  },

  async setMark(studentId, kind, value, options) {
    const state = get()
    const existingIds = state.marksByStudent[studentId] ?? []
    const existingMark = existingIds
      .map((id) => state.marks[id])
      .find((mark) => mark?.kind === kind)

    const mark: Mark = markSchema.parse({
      id: existingMark?.id ?? nanoid(),
      studentId,
      kind,
      value,
      max: options?.max ?? existingMark?.max ?? assessmentMaxDefaults[kind],
      date: options?.date ?? existingMark?.date,
    })

    await db.marks.put(mark)

    set((prev) => {
      const marks = { ...prev.marks, [mark.id]: mark }
      const markIds = withSortedUnique(prev.marksByStudent[studentId] ?? [], mark.id)

      return {
        marks,
        marksByStudent: {
          ...prev.marksByStudent,
          [studentId]: markIds,
        },
      }
    })

    return mark
  },

  async bulkSetMarks(updates) {
    if (!updates.length) return
    for (const update of updates) {
      await get().setMark(update.studentId, update.kind, update.value, {
        max: update.max,
        date: update.date,
      })
    }
  },

  async deleteMark(id) {
    const mark = get().marks[id]
    if (!mark) return
    await db.marks.delete(id)

    set((state) => {
      const marks = { ...state.marks }
      delete marks[id]

      const markIds = withoutId(state.marksByStudent[mark.studentId] ?? [], id)

      return {
        marks,
        marksByStudent: {
          ...state.marksByStudent,
          [mark.studentId]: markIds,
        },
      }
    })
  },

  async addObservation(input) {
    const observation = observationSchema.parse({
      id: input.id ?? nanoid(),
      ...input,
    })

    await db.observations.put(observation)

    set((state) => {
      const observations = { ...state.observations, [observation.id]: observation }
      const list = withSortedUnique(state.observationsByStudent[observation.studentId] ?? [], observation.id)
      return {
        observations,
        observationsByStudent: {
          ...state.observationsByStudent,
          [observation.studentId]: list,
        },
      }
    })

    return observation
  },

  async deleteObservation(id) {
    const observation = get().observations[id]
    if (!observation) return
    await db.observations.delete(id)

    set((state) => {
      const observations = { ...state.observations }
      delete observations[id]
      return {
        observations,
        observationsByStudent: {
          ...state.observationsByStudent,
          [observation.studentId]: withoutId(
            state.observationsByStudent[observation.studentId] ?? [],
            id,
          ),
        },
      }
    })
  },

  async addLesson(input) {
    const lesson = lessonSchema.parse({
      id: input.id ?? nanoid(),
      ...input,
      stageNotes: ensureStageNotes(input.stageNotes),
    })

    await db.lessons.put(lesson)

    set((state) => {
      const lessons = { ...state.lessons, [lesson.id]: lesson }
      const lessonIds = withSortedUnique(state.lessonsByGroup[lesson.groupId] ?? [], lesson.id)
      return {
        lessons,
        lessonsByGroup: {
          ...state.lessonsByGroup,
          [lesson.groupId]: lessonIds,
        },
      }
    })

    return lesson
  },

  async updateLesson(id, patch) {
    const current = get().lessons[id]
    if (!current) throw new Error('Lesson not found')

    const next = lessonSchema.parse({
      ...current,
      ...patch,
      stageNotes: ensureStageNotes({ ...current.stageNotes, ...patch.stageNotes }),
    })

    await db.lessons.put(next)

    set((state) => ({
      lessons: { ...state.lessons, [id]: next },
    }))

    return next
  },

  async deleteLesson(id) {
    const lesson = get().lessons[id]
    if (!lesson) return

    await db.lessons.delete(id)

    set((state) => {
      const lessons = { ...state.lessons }
      delete lessons[id]
      return {
        lessons,
        lessonsByGroup: {
          ...state.lessonsByGroup,
          [lesson.groupId]: withoutId(state.lessonsByGroup[lesson.groupId] ?? [], id),
        },
      }
    })
  },

  async saveSchedule(input) {
    const existing = input.id ? get().schedules[input.id] : undefined
    const schedule = weeklyScheduleSchema.parse({
      ...existing,
      ...input,
      id: input.id ?? nanoid(),
      createdAt: existing?.createdAt ?? Date.now(),
    })

    await db.schedules.put(schedule)

    set((state) => {
      const schedules = { ...state.schedules, [schedule.id]: schedule }
      const scheduleIds = withSortedUnique(state.scheduleIds, schedule.id)
      return {
        schedules,
        scheduleIds,
        activeScheduleId: state.activeScheduleId ?? schedule.id,
      }
    })

    return schedule
  },

  async deleteSchedule(id) {
    await db.schedules.delete(id)

    set((state) => {
      const schedules = { ...state.schedules }
      delete schedules[id]
      const scheduleIds = withoutId(state.scheduleIds, id)
      const activeScheduleId = state.activeScheduleId === id ? scheduleIds[0] : state.activeScheduleId
      return {
        schedules,
        scheduleIds,
        activeScheduleId,
      }
    })
  },

  setActiveSchedule(id) {
    if (!id) {
      set({ activeScheduleId: undefined })
      return
    }
    if (!get().schedules[id]) throw new Error('Schedule not found')
    set({ activeScheduleId: id })
  },
}))
