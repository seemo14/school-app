import { nanoid } from 'nanoid'
import { db } from './db'
import {
  assessmentKinds,
  defaultLessonTemplate,
  type Group,
  type Lesson,
  type Student,
} from './schemas'
import { nowIsoDate, toISODate } from './time'

const eighthGradeCodes = ['2ASCG1', '2ASCG2', '2ASCG3', '2ASCG4', '2ASCG5']
const ninthGradeCodes = ['3ASCG1', '3ASCG2', '3ASCG3', '3ASCG4']

const studentNames = [
  'Alice Martin',
  'Brahim El Khoury',
  'Chloe Bernard',
  'Diego Fernández',
  'Emma Laurent',
  'Farah Mansour',
  'Gabriel Ito',
  'Hala Othman',
  'Ismail Samir',
  'Jade Rousseau',
  'Kaori Sato',
  'Leo Dupont',
  'Maya Haddad',
  'Nadia Benali',
  'Omar Ziani',
  'Pia Schmidt',
  'Rami Tarek',
  'Sara López',
  'Tariq Alaoui',
  'Yara Bensalem',
]

const buildGroups = (): Group[] => {
  const now = Date.now()
  return [
    ...eighthGradeCodes.map((code) => ({
      id: nanoid(),
      code,
      grade: '8th' as const,
      createdAt: now,
    })),
    ...ninthGradeCodes.map((code) => ({
      id: nanoid(),
      code,
      grade: '9th' as const,
      createdAt: now,
    })),
  ]
}

const buildStudentsForGroup = (group: Group): Student[] => {
  const now = Date.now()
  return Array.from({ length: 10 }).map((_, index) => ({
    id: nanoid(),
    groupId: group.id,
    number: `${index + 1}`,
    name: studentNames[(index * 3) % studentNames.length],
    createdAt: now,
  }))
}

const buildLessonsForGroup = (group: Group): Lesson[] =>
  [0, 7, 14].map((offset) => {
    const date = new Date()
    date.setDate(date.getDate() - offset)
    return {
      id: nanoid(),
      groupId: group.id,
      date: toISODate(date),
      start: '09:00',
      end: '10:00',
      theme: `Unit ${offset / 7 + 1}: Communicative skills`,
      stageNotes: defaultLessonTemplate,
      observations: 'Students engaged and responsive.',
    }
  })

export const createDemoData = async () => {
  const groups = buildGroups()
  const students = groups.flatMap(buildStudentsForGroup)
  const lessons = groups.flatMap(buildLessonsForGroup)

  await db.transaction('rw', db.groups, db.students, db.lessons, db.marks, async () => {
    await db.groups.bulkAdd(groups)
    await db.students.bulkAdd(students)
    await db.lessons.bulkAdd(lessons)

    const marks = students.flatMap((student) =>
      assessmentKinds.map((kind) => ({
        id: nanoid(),
        studentId: student.id,
        kind,
        value: Math.round(Math.random() * 4 + 6),
        max: 10,
        date: nowIsoDate(),
      })),
    )

    await db.marks.bulkAdd(marks)
  })
}
