import { z } from 'zod'

export const gradeEnum = z.enum(['8th', '9th'])

export const Grades = gradeEnum.options
export type Grade = z.infer<typeof gradeEnum>

export const assessmentKinds = [
  'Quiz1',
  'Quiz2',
  'Homework',
  'Copybook',
  'Discipline',
  'Participation',
  'Final',
] as const

export const assessmentKindEnum = z.enum(assessmentKinds)
export type AssessmentKind = z.infer<typeof assessmentKindEnum>

export const isoDateSchema = z.string().regex(/\d{4}-\d{2}-\d{2}/, {
  message: 'Date must be YYYY-MM-DD',
})

export const timeSchema = z.string().regex(/^([01]?\d|2[0-3]):[0-5]\d$/, {
  message: 'Time must be HH:mm',
})

export const groupSchema = z.object({
  id: z.string(),
  code: z
    .string()
    .min(2)
    .max(12)
    .regex(/^[0-9A-Z]+$/, 'Use uppercase letters or numbers'),
  grade: gradeEnum,
  scheduleId: z.string().optional(),
  createdAt: z.number(),
})

export type Group = z.infer<typeof groupSchema>

export const studentSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  number: z.string().min(1),
  name: z.string().min(1),
  nationalId: z.string().optional(),
  createdAt: z.number(),
})

export type Student = z.infer<typeof studentSchema>

export const markSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  kind: assessmentKindEnum,
  value: z.number().nullable(),
  max: z.number().positive().optional(),
  date: isoDateSchema.optional(),
})

export type Mark = z.infer<typeof markSchema>

export const observationSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  text: z.string().min(1),
  date: isoDateSchema,
})

export type Observation = z.infer<typeof observationSchema>

export const lessonStagesSchema = z.object({
  warmup: z.string().optional(),
  presentation: z.string().optional(),
  practice: z.string().optional(),
  production: z.string().optional(),
  homework: z.string().optional(),
})

export type LessonStages = z.infer<typeof lessonStagesSchema>

export const lessonSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  date: isoDateSchema,
  start: timeSchema,
  end: timeSchema,
  theme: z.string().optional(),
  stageNotes: lessonStagesSchema,
  observations: z.string().optional(),
  attachments: z.array(z.string()).optional(),
})

export type Lesson = z.infer<typeof lessonSchema>

export const weeklySlotSchema = z.object({
  day: z.number().int().min(1).max(7),
  start: timeSchema,
  end: timeSchema,
  groupCode: z.string().min(2),
})

export type WeeklySlot = z.infer<typeof weeklySlotSchema>

export const weeklyScheduleSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  slots: z.array(weeklySlotSchema),
  sourcePdfName: z.string().optional(),
  createdAt: z.number(),
})

export type WeeklySchedule = z.infer<typeof weeklyScheduleSchema>

export const rosterRowSchema = z.object({
  number: z.string(),
  name: z.string(),
  nationalId: z.string().optional(),
})

export type RosterRow = z.infer<typeof rosterRowSchema>

export type ParsedRoster = {
  rows: RosterRow[]
  metadata?: Record<string, unknown>
}

export type ParsedSchedule = {
  title: string
  slots: WeeklySlot[]
  sourcePdfName?: string
}

export const defaultLessonTemplate: LessonStages = {
  warmup: 'Show an engaging prompt, elicit target vocabulary',
  presentation: 'Introduce target language, provide model sentences',
  practice: 'Controlled practice with feedback',
  production: 'Pair or group task with freer practice',
  homework: 'Assign concise follow-up task',
}

export const recordBookEntrySchema = z.object({
  lesson: lessonSchema,
  group: groupSchema,
})

export type RecordBookEntry = z.infer<typeof recordBookEntrySchema>
