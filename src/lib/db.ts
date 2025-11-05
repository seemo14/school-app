import Dexie, { type Table } from 'dexie'
import type {
  Group,
  Lesson,
  Mark,
  Observation,
  Student,
  WeeklySchedule,
} from './schemas'

export class GradebookDB extends Dexie {
  groups!: Table<Group>
  students!: Table<Student>
  marks!: Table<Mark>
  observations!: Table<Observation>
  lessons!: Table<Lesson>
  schedules!: Table<WeeklySchedule>

  constructor() {
    super('skylark-gradebook')
    this.version(1).stores({
      groups: 'id, code, grade',
      students: 'id, groupId, number, name',
      marks: 'id, studentId, kind, date',
      observations: 'id, studentId, date',
      lessons: 'id, groupId, date',
      schedules: 'id, title',
    })
  }
}

export const db = new GradebookDB()

export const resetDatabase = async () => {
  await db.delete()
  await db.open()
}
