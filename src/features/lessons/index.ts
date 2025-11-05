import { useAppStore } from '@/store'
import type { Lesson } from '@/lib/schemas'

export const useLessonsByGroup = (groupId: string) =>
  useAppStore((state) => state.lessons.filter((lesson) => lesson.groupId === groupId))

export const useLessonActions = () => {
  const saveLesson = useAppStore((state) => state.saveLesson)
  const deleteLesson = useAppStore((state) => state.deleteLesson)
  return { saveLesson, deleteLesson }
}

export type { Lesson }
