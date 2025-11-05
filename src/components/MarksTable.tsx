import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { assessmentKinds, type AssessmentKind, type Student } from '@/lib/schemas'
import type { MarksByStudent } from '@/lib/export'

export type MarksTableProps = {
  groupId: string
  students: Student[]
  marks: MarksByStudent
  onChange: (studentId: string, kind: AssessmentKind, value: number | null) => void
}

type HistoryEntry = {
  studentId: string
  kind: AssessmentKind
  previous: number | null
}

const clampMark = (value: number | null) => {
  if (value === null) return null
  if (Number.isNaN(value)) return null
  return Math.min(Math.max(value, 0), 20)
}

const cellClass =
  'w-full rounded-lg border border-transparent bg-transparent px-2 py-2 text-center text-sm transition focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200'

const buildDraftKey = (studentId: string, kind: AssessmentKind) => `${studentId}-${kind}`

export const MarksTable = ({ students, marks, onChange }: MarksTableProps) => {
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const historyRef = useRef<HistoryEntry[]>([])
  const isUndoRef = useRef(false)

  useEffect(() => {
    const nextDrafts: Record<string, string> = {}
    students.forEach((student) => {
      assessmentKinds.forEach((kind) => {
        const value = marks[student.id]?.[kind] ?? null
        nextDrafts[buildDraftKey(student.id, kind)] = value === null || value === undefined ? '' : `${value}`
      })
    })
    setDrafts(nextDrafts)
  }, [students, marks])

  const commitValue = (studentId: string, kind: AssessmentKind, rawValue: string) => {
    const trimmed = rawValue.trim()
    const previous = marks[studentId]?.[kind] ?? null

    const parsed = trimmed === '' ? null : clampMark(Number(trimmed))
    const normalizedDraft = parsed === null ? '' : `${parsed}`
    setDrafts((current) => ({
      ...current,
      [buildDraftKey(studentId, kind)]: normalizedDraft,
    }))

    if (parsed === previous || (Number.isNaN(parsed as number) && Number.isNaN(previous as number))) return

    if (!isUndoRef.current) {
      historyRef.current.push({ studentId, kind, previous })
    }

    isUndoRef.current = false
    onChange(studentId, kind, parsed)
  }

  const focusCell = (rowIndex: number, colIndex: number) => {
    const input = document.querySelector<HTMLInputElement>(
      `input[data-position="${rowIndex}-${colIndex}"]`,
    )
    if (input) {
      input.focus()
      input.select()
    }
  }

  const handleUndo = () => {
    const entry = historyRef.current.pop()
    if (!entry) return
    isUndoRef.current = true
    commitValue(entry.studentId, entry.kind, entry.previous === null ? '' : `${entry.previous}`)
  }

  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    studentIndex: number,
    kindIndex: number,
    studentId: string,
    kind: AssessmentKind,
  ) => {
    if (event.ctrlKey && (event.key === 'z' || event.key === 'Z')) {
      event.preventDefault()
      handleUndo()
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      commitValue(studentId, kind, drafts[buildDraftKey(studentId, kind)] ?? '')
      const nextRow = Math.min(studentIndex + 1, students.length - 1)
      focusCell(nextRow, kindIndex)
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      const previous = marks[studentId]?.[kind] ?? null
      setDrafts((current) => ({
        ...current,
        [buildDraftKey(studentId, kind)]: previous === null ? '' : `${previous}`,
      }))
      return
    }

    const navigate = (deltaRow: number, deltaCol: number) => {
      event.preventDefault()
      const nextRow = Math.min(Math.max(studentIndex + deltaRow, 0), students.length - 1)
      const nextCol = Math.min(Math.max(kindIndex + deltaCol, 0), assessmentKinds.length - 1)
      focusCell(nextRow, nextCol)
    }

    switch (event.key) {
      case 'ArrowRight':
        navigate(0, 1)
        break
      case 'ArrowLeft':
        navigate(0, -1)
        break
      case 'ArrowDown':
        navigate(1, 0)
        break
      case 'ArrowUp':
        navigate(-1, 0)
        break
      default:
        break
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Student
            </th>
            {assessmentKinds.map((kind) => (
              <th
                key={kind}
                scope="col"
                className="min-w-[100px] px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                {kind}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((student, studentIndex) => (
            <tr key={student.id} className="border-b border-slate-100 bg-white odd:bg-slate-50">
              <th
                scope="row"
                className="sticky left-0 z-10 bg-inherit px-4 py-2 text-left text-sm font-medium text-slate-900"
              >
                <div className="flex flex-col">
                  <span>{student.name}</span>
                  <span className="text-xs text-slate-500">#{student.number}</span>
                </div>
              </th>
              {assessmentKinds.map((kind, kindIndex) => {
                const key = buildDraftKey(student.id, kind)
                return (
                  <td key={kind} className="px-3 py-2 text-center">
                    <input
                      data-position={`${studentIndex}-${kindIndex}`}
                      className={cellClass}
                      inputMode="decimal"
                      value={drafts[key] ?? ''}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [key]: event.target.value,
                        }))
                      }
                      onBlur={(event) => commitValue(student.id, kind, event.target.value)}
                      onKeyDown={(event) => handleKeyDown(event, studentIndex, kindIndex, student.id, kind)}
                      aria-label={`${student.name} ${kind}`}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default MarksTable
