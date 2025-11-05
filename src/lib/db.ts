import Dexie, { type Table } from 'dexie'

import type {
  Group,
  Lesson,
  Mark,
  Observation,
  Student,
  WeeklySchedule,
} from '@/lib/schemas'

export class AppDatabase extends Dexie {
  groups!: Table<Group, string>
  students!: Table<Student, string>
  marks!: Table<Mark, string>
  observations!: Table<Observation, string>
  lessons!: Table<Lesson, string>
  schedules!: Table<WeeklySchedule, string>

  constructor() {
    super('gradebook-db')

    this.version(1).stores({
      groups: 'id, code, grade',
      students: 'id, groupId, number, name, [groupId+number]',
      marks: 'id, studentId, kind, date, [studentId+kind]',
      observations: 'id, studentId, date',
      lessons: 'id, groupId, date, [groupId+date]',
      schedules: 'id, title',
    })
  }
}

export const db = new AppDatabase()
