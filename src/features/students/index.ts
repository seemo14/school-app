import { useMemo } from 'react'
import { useAppStore } from '@/store'
import type { Student } from '@/lib/schemas'

export const useStudentsByGroup = (groupId?: string) =>
  useAppStore((state) =>
    groupId ? state.students.filter((student) => student.groupId === groupId) : state.students,
  )

export const useStudentActions = () => {
  const createStudent = useAppStore((state) => state.createStudent)
  const updateStudent = useAppStore((state) => state.updateStudent)
  const deleteStudent = useAppStore((state) => state.deleteStudent)
  const mergeRoster = useAppStore((state) => state.mergeRoster)
  return { createStudent, updateStudent, deleteStudent, mergeRoster }
}

export const useStudentMap = (groupId: string) => {
  const students = useStudentsByGroup(groupId)
  return useMemo(() => new Map(students.map((student) => [student.id, student])), [students])
}

export type { Student }
