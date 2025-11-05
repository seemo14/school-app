import { type KeyboardEvent, useEffect, useMemo, useState } from 'react'

import {
  assessmentMaxDefaults,
  assessmentKinds,
  type AssessmentKind,
  type Student,
} from '@/lib/schemas'

type MarksTableProps = {
  groupId: string
  students: Student[]
  marks: Record<string, Partial<Record<AssessmentKind, number | null>>>
  onChange: (studentId: string, kind: AssessmentKind, value: number | null) => void
}

type DraftMap = Record<string, Partial<Record<AssessmentKind, string>>>

function buildDrafts(marks: MarksTableProps['marks'], students: Student[]): DraftMap {
  const drafts: DraftMap = {}
  students.forEach((student) => {
    drafts[student.id] = {}
    assessmentKinds.forEach((kind) => {
      const value = marks[student.id]?.[kind]
      drafts[student.id]![kind] = typeof value === 'number' ? String(value) : ''
    })
  })
  return drafts
}

export function MarksTable({ groupId, students, marks, onChange }: MarksTableProps) {
  const [drafts, setDrafts] = useState<DraftMap>(() => buildDrafts(marks, students))

  useEffect(() => {
    setDrafts(buildDrafts(marks, students))
  }, [groupId, marks, students])

  const totals = useMemo(() => {
    return students.map((student) => {
      const record = marks[student.id] ?? {}
      const values = assessmentKinds.map((kind) => record[kind]).filter((value): value is number => value !== null && value !== undefined)
      if (!values.length) return null
      const sum = values.reduce((acc, value) => acc + value, 0)
      return Number.isFinite(sum) ? sum : null
    })
  }, [students, marks])

  const commitValue = (studentId: string, kind: AssessmentKind) => {
    const raw = drafts[studentId]?.[kind] ?? ''
    const trimmed = raw.trim()
    if (!trimmed) {
      onChange(studentId, kind, null)
      return
    }
    const numeric = Number.parseFloat(trimmed.replace(',', '.'))
    if (Number.isNaN(numeric)) {
      setDrafts((prev) => ({
        ...prev,
        [studentId]: { ...prev[studentId], [kind]: '' },
      }))
      onChange(studentId, kind, null)
      return
    }
    const max = assessmentMaxDefaults[kind] ?? 20
    const bounded = Math.min(Math.max(numeric, 0), max)
    onChange(studentId, kind, bounded)
    setDrafts((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [kind]: String(bounded) },
    }))
  }

  const handleInputChange = (studentId: string, kind: AssessmentKind, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [kind]: value },
    }))
  }

  const moveFocus = (input: HTMLInputElement, deltaRow: number, deltaCol: number) => {
    const row = Number.parseInt(input.dataset.row ?? '0', 10)
    const col = Number.parseInt(input.dataset.col ?? '0', 10)
    const selector = `input[data-row="${row + deltaRow}"][data-col="${col + deltaCol}"]`
    const table = input.closest('table')
    const next = table?.querySelector<HTMLInputElement>(selector)
    if (next) {
      next.focus()
      next.select()
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>, studentId: string, kind: AssessmentKind) => {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        moveFocus(event.currentTarget, 0, 1)
        break
      case 'ArrowLeft':
        event.preventDefault()
        moveFocus(event.currentTarget, 0, -1)
        break
      case 'ArrowUp':
        event.preventDefault()
        moveFocus(event.currentTarget, -1, 0)
        break
      case 'ArrowDown':
        event.preventDefault()
        moveFocus(event.currentTarget, 1, 0)
        break
      case 'Enter':
        event.preventDefault()
        commitValue(studentId, kind)
        moveFocus(event.currentTarget, 1, 0)
        break
      case 'Escape':
        event.preventDefault()
        const original = marks[studentId]?.[kind]
        setDrafts((prev) => ({
          ...prev,
          [studentId]: {
            ...prev[studentId],
            [kind]: typeof original === 'number' ? String(original) : '',
          },
        }))
        break
      default:
        break
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-500">Student</th>
              {assessmentKinds.map((kind) => (
                <th key={kind} scope="col" className="px-4 py-3 text-center font-semibold text-slate-500">
                  <div className="flex flex-col items-center gap-1">
                    <span>{kind}</span>
                    <span className="text-xs font-normal text-slate-400">/ {assessmentMaxDefaults[kind]}</span>
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-right font-semibold text-slate-500">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((student, rowIndex) => (
              <tr key={student.id} className="hover:bg-sky-50/40">
                <th
                  scope="row"
                  className="sticky left-0 z-10 w-48 bg-white px-4 py-2 text-left font-semibold text-slate-700 shadow-[1px_0_0_0_rgba(148,163,184,0.2)]"
                >
                  <div className="flex flex-col">
                    <span>{student.name}</span>
                    <span className="text-xs font-medium text-slate-400">#{student.number}</span>
                  </div>
                </th>
                {assessmentKinds.map((kind, colIndex) => (
                  <td key={kind} className="px-4 py-2 text-center">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={drafts[student.id]?.[kind] ?? ''}
                      onChange={(event) => handleInputChange(student.id, kind, event.target.value)}
                      onBlur={() => commitValue(student.id, kind)}
                      onKeyDown={(event) => handleKeyDown(event, student.id, kind)}
                      data-row={rowIndex}
                      data-col={colIndex}
                      className="w-20 rounded-lg border border-slate-200 bg-white px-3 py-2 text-center font-semibold text-slate-700 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-1 focus:ring-sky-300"
                    />
                  </td>
                ))}
                <td className="px-4 py-2 text-right font-semibold text-slate-600">
                  {totals[rowIndex] !== null ? totals[rowIndex]?.toFixed(1) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
