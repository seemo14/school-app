import { nanoid } from 'nanoid'

import { db } from '@/lib/db'
import {
  defaultStageNotes,
  groupSchema,
  lessonSchema,
  studentSchema,
  weeklyScheduleSchema,
  type Grade,
  type Group,
  type Lesson,
  type Student,
  type WeeklySchedule,
} from '@/lib/schemas'

type SeedOptions = {
  force?: boolean
  includeLessons?: boolean
}

type SeedResult = {
  groups: Group[]
  students: Student[]
  lessons: Lesson[]
  schedules: WeeklySchedule[]
}

const demoGroups: Record<Grade, string[]> = {
  '8th': ['2ASCG1', '2ASCG2', '2ASCG3', '2ASCG4', '2ASCG5'],
  '9th': ['3ASCG1', '3ASCG2', '3ASCG3', '3ASCG4'],
}

function buildStudents(group: Group, count = 10): Student[] {
  return Array.from({ length: count }, (_, index) => {
    const number = String(index + 1).padStart(2, '0')
    return studentSchema.parse({
      id: nanoid(),
      groupId: group.id,
      number,
      name: `${group.code} Student ${number}`,
      createdAt: Date.now(),
    })
  })
}

function buildLessons(group: Group, students: Student[]): Lesson[] {
  const today = new Date()
  const isoDate = today.toISOString().slice(0, 10)
  return [
    lessonSchema.parse({
      id: nanoid(),
      groupId: group.id,
      date: isoDate,
      start: '09:00',
      end: '10:00',
      theme: 'Introductory PPP Lesson',
      stageNotes: defaultStageNotes,
      observations: `Reviewed expectations with ${students.length} learners.`,
    }),
  ]
}

function buildSchedule(): WeeklySchedule {
  const createdAt = Date.now()
  const slots = [
    { day: 1, start: '09:00', end: '10:00', groupCode: '2ASCG1' },
    { day: 1, start: '10:15', end: '11:15', groupCode: '2ASCG2' },
    { day: 2, start: '09:00', end: '10:00', groupCode: '3ASCG1' },
    { day: 3, start: '11:30', end: '12:30', groupCode: '2ASCG3' },
    { day: 4, start: '13:30', end: '14:30', groupCode: '3ASCG3' },
  ]

  return weeklyScheduleSchema.parse({
    id: nanoid(),
    title: 'Demo Timetable',
    slots,
    createdAt,
  })
}

export async function createDemoData(options: SeedOptions = {}): Promise<SeedResult | null> {
  const { force = false, includeLessons = true } = options
  const existingGroups = await db.groups.count()
  if (existingGroups > 0 && !force) {
    return null
  }

  if (force) {
    await db.transaction(
      'rw',
      [db.groups, db.students, db.marks, db.observations, db.lessons, db.schedules],
      async () => {
        await Promise.all([
          db.groups.clear(),
          db.students.clear(),
          db.marks.clear(),
          db.observations.clear(),
          db.lessons.clear(),
          db.schedules.clear(),
        ])
      },
    )
  }

  const now = Date.now()
  const groups: Group[] = []
  const students: Student[] = []
  const lessons: Lesson[] = []

  for (const [grade, codes] of Object.entries(demoGroups) as Array<[Grade, string[]]>) {
    codes.forEach((code: string) => {
      const group = groupSchema.parse({
        id: nanoid(),
        code,
        grade,
        createdAt: now,
      })
      groups.push(group)

      const groupStudents = buildStudents(group)
      students.push(...groupStudents)

      if (includeLessons) {
        lessons.push(...buildLessons(group, groupStudents))
      }
    })
  }

  const schedules: WeeklySchedule[] = [buildSchedule()]

  await db.transaction('rw', [db.groups, db.students, db.lessons, db.schedules], async () => {
    await Promise.all([
      ...groups.map((group) => db.groups.put(group)),
      ...students.map((student) => db.students.put(student)),
      ...lessons.map((lesson) => db.lessons.put(lesson)),
      ...schedules.map((schedule) => db.schedules.put(schedule)),
    ])
  })

  return { groups, students, lessons, schedules }
}
