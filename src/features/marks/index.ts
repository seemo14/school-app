import { useMemo } from 'react'
import { useAppStore } from '@/store'
import type { AssessmentKind, Mark } from '@/lib/schemas'

export const useMarksByGroup = (groupId: string) =>
  useAppStore((state) =>
    state.marks.filter((mark) =>
      state.students.some((student) => student.id === mark.studentId && student.groupId === groupId),
    ),
  )

export const useMarksMatrix = (groupId: string) => {
  const marks = useMarksByGroup(groupId)
  return useMemo(() => {
    const map: Record<string, Partial<Record<AssessmentKind, number | null>>> = {}
    marks.forEach((mark) => {
      if (!map[mark.studentId]) map[mark.studentId] = {}
      map[mark.studentId][mark.kind] = mark.value
    })
    return map
  }, [marks])
}

export const useMarkActions = () => {
  const upsertMark = useAppStore((state) => state.upsertMark)
  const bulkUpsertMarks = useAppStore((state) => state.bulkUpsertMarks)
  const removeMarksForStudents = useAppStore((state) => state.removeMarksForStudents)
  return { upsertMark, bulkUpsertMarks, removeMarksForStudents }
}

export type { Mark }
