import { z } from 'zod'

export const gradeValues = ['8th', '9th'] as const
export const assessmentKinds = [
  'Quiz1',
  'Quiz2',
  'Homework',
  'Copybook',
  'Discipline',
  'Participation',
  'Final',
] as const

export const timeStringSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/u, 'Time must be formatted as HH:MM')

export const gradeSchema = z.enum(gradeValues)

export const groupSchema = z.object({
  id: z.string(),
  code: z.string().min(1),
  grade: gradeSchema,
  scheduleId: z.string().optional(),
  createdAt: z.number(),
})

export const studentSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  number: z.string(),
  name: z.string().min(1),
  nationalId: z.string().optional(),
  createdAt: z.number(),
})

export const assessmentKindSchema = z.enum(assessmentKinds)

export const markSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  kind: assessmentKindSchema,
  value: z.number().min(0).max(20).nullable(),
  max: z.number().min(1).max(100).optional(),
  date: z.string().date().optional(),
})

export const observationSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  text: z.string().min(1),
  date: z.string().date(),
})

export const lessonStageSchema = z.object({
  warmup: z.string().optional(),
  presentation: z.string().optional(),
  practice: z.string().optional(),
  production: z.string().optional(),
  homework: z.string().optional(),
})

export const lessonSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  date: z.string().date(),
  start: timeStringSchema,
  end: timeStringSchema,
  theme: z.string().optional(),
  stageNotes: lessonStageSchema,
  observations: z.string().optional(),
  attachments: z.array(z.string()).optional(),
})

export const weeklySlotSchema = z.object({
  day: z.number().int().min(1).max(7),
  start: timeStringSchema,
  end: timeStringSchema,
  groupCode: z.string().min(1),
})

export const weeklyScheduleSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  slots: z.array(weeklySlotSchema),
  sourcePdfName: z.string().optional(),
  createdAt: z.number(),
})

export type Grade = z.infer<typeof gradeSchema>
export type AssessmentKind = z.infer<typeof assessmentKindSchema>
export type Group = z.infer<typeof groupSchema>
export type Student = z.infer<typeof studentSchema>
export type Mark = z.infer<typeof markSchema>
export type Observation = z.infer<typeof observationSchema>
export type LessonStageNotes = z.infer<typeof lessonStageSchema>
export type Lesson = z.infer<typeof lessonSchema>
export type WeeklySlot = z.infer<typeof weeklySlotSchema>
export type WeeklySchedule = z.infer<typeof weeklyScheduleSchema>

export const defaultStageNotes: LessonStageNotes = {
  warmup: 'Show an image and elicit vocabulary related to the theme.',
  presentation: 'Introduce target language and provide annotated examples.',
  practice: 'Guide controlled practice with pair or small-group activities.',
  production: 'Facilitate a freer task that encourages student output.',
  homework: 'Assign a short follow-up to reinforce the lesson focus.',
}

export const stageOrder: Array<keyof LessonStageNotes> = [
  'warmup',
  'presentation',
  'practice',
  'production',
  'homework',
]

export const assessmentMaxDefaults: Record<AssessmentKind, number> = {
  Quiz1: 10,
  Quiz2: 10,
  Homework: 10,
  Copybook: 10,
  Discipline: 10,
  Participation: 10,
  Final: 20,
}

export function assertSchema<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (!result.success) {
    throw result.error
  }
  return result.data
}
