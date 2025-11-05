import { useState } from 'react'
import { TrashIcon } from '@heroicons/react/24/outline'
import type { Student } from '@/lib/schemas'

type RosterTableProps = {
  students: Student[]
  onUpdate: (id: string, changes: Partial<Student>) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
  onAdd: (input: { number: string; name: string; nationalId?: string }) => void | Promise<void>
  disabled?: boolean
}

const cellBaseClasses =
  'w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200'

export const RosterTable = ({ students, onUpdate, onDelete, onAdd, disabled }: RosterTableProps) => {
  const [newStudent, setNewStudent] = useState({ number: '', name: '', nationalId: '' })

  const handleAdd = async () => {
    if (!newStudent.number || !newStudent.name) return
    await onAdd({
      number: newStudent.number.trim(),
      name: newStudent.name.trim(),
      nationalId: newStudent.nationalId.trim() || undefined,
    })
    setNewStudent({ number: '', name: '', nationalId: '' })
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              #
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Name
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              ID
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white text-sm">
          {students.map((student) => (
            <tr key={student.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 align-middle">
                <input
                  className={`${cellBaseClasses} w-20 text-center font-medium`}
                  defaultValue={student.number}
                  disabled={disabled}
                  onBlur={(event) =>
                    event.target.value !== student.number &&
                    onUpdate(student.id, { number: event.target.value.trim() })
                  }
                />
              </td>
              <td className="px-4 py-3 align-middle">
                <input
                  className={`${cellBaseClasses} font-medium`}
                  defaultValue={student.name}
                  disabled={disabled}
                  onBlur={(event) =>
                    event.target.value !== student.name &&
                    onUpdate(student.id, { name: event.target.value.trim() })
                  }
                />
              </td>
              <td className="px-4 py-3 align-middle">
                <input
                  className={`${cellBaseClasses} text-xs uppercase`}
                  defaultValue={student.nationalId ?? ''}
                  placeholder="Optional"
                  disabled={disabled}
                  onBlur={(event) =>
                    event.target.value !== student.nationalId &&
                    onUpdate(student.id, { nationalId: event.target.value.trim() || undefined })
                  }
                />
              </td>
              <td className="px-4 py-3 text-right align-middle">
                <button
                  type="button"
                  onClick={() => onDelete(student.id)}
                  disabled={disabled}
                  className="inline-flex items-center rounded-full border border-transparent bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Remove student"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
          <tr className="bg-slate-50">
            <td className="px-4 py-3">
              <input
                className={`${cellBaseClasses} w-20 text-center`}
                value={newStudent.number}
                onChange={(event) => setNewStudent((prev) => ({ ...prev, number: event.target.value }))}
                placeholder="#"
                disabled={disabled}
              />
            </td>
            <td className="px-4 py-3">
              <input
                className={`${cellBaseClasses}`}
                value={newStudent.name}
                onChange={(event) => setNewStudent((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Add student name"
                disabled={disabled}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void handleAdd()
                  }
                }}
              />
            </td>
            <td className="px-4 py-3">
              <input
                className={`${cellBaseClasses}`}
                value={newStudent.nationalId}
                onChange={(event) => setNewStudent((prev) => ({ ...prev, nationalId: event.target.value }))}
                placeholder="National ID (optional)"
                disabled={disabled}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void handleAdd()
                  }
                }}
              />
            </td>
            <td className="px-4 py-3 text-right">
              <button
                type="button"
                onClick={handleAdd}
                disabled={disabled || !newStudent.number || !newStudent.name}
                className="inline-flex items-center rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
              >
                Add Student
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default RosterTable
