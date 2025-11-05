import { type FormEvent, useState } from 'react'
import { TrashIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

import type { Student } from '@/lib/schemas'

type DraftStudent = {
  number: string
  name: string
  nationalId?: string
}

type RosterTableProps = {
  students: Student[]
  loading?: boolean
  onAddStudent: (student: DraftStudent) => Promise<void> | void
  onUpdateStudent: (id: string, patch: Partial<DraftStudent>) => Promise<void> | void
  onDeleteStudent: (id: string) => Promise<void> | void
}

const initialDraft: DraftStudent = {
  number: '',
  name: '',
  nationalId: '',
}

export function RosterTable({
  students,
  loading,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
}: RosterTableProps) {
  const [draft, setDraft] = useState<DraftStudent>(initialDraft)

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.name.trim() || !draft.number.trim()) return
    await onAddStudent({
      number: draft.number.trim(),
      name: draft.name.trim(),
      nationalId: draft.nationalId?.trim() || undefined,
    })
    setDraft(initialDraft)
  }

  const handleUpdate = async (id: string, key: keyof DraftStudent, value: string) => {
    await onUpdateStudent(id, { [key]: value.trim() })
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-500">
                #
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-500">
                Name
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-500">
                ID / National ID
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-sky-50/40">
                <td className="whitespace-nowrap px-4 py-2 font-medium text-slate-600">
                  <input
                    type="text"
                    inputMode="numeric"
                    defaultValue={student.number}
                    className="w-16 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-medium focus:border-sky-300 focus:outline-none focus:ring-1 focus:ring-sky-300"
                    onBlur={(event) => handleUpdate(student.id, 'number', event.target.value)}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    defaultValue={student.name}
                    className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-medium focus:border-sky-300 focus:outline-none focus:ring-1 focus:ring-sky-300"
                    onBlur={(event) => handleUpdate(student.id, 'name', event.target.value)}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    defaultValue={student.nationalId ?? ''}
                    className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm focus:border-sky-300 focus:outline-none focus:ring-1 focus:ring-sky-300"
                    placeholder="Optional"
                    onBlur={(event) => handleUpdate(student.id, 'nationalId', event.target.value)}
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg border border-transparent px-2 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                    onClick={() => onDeleteStudent(student.id)}
                    aria-label={`Remove ${student.name}`}
                  >
                    <TrashIcon className="h-4 w-4" /> Remove
                  </button>
                </td>
              </tr>
            ))}
            <tr className="bg-slate-50/60">
              <td colSpan={4} className="px-4 py-3">
                <form onSubmit={handleAdd} className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2">
                    <label htmlFor="new-number" className="sr-only">
                      Number
                    </label>
                    <input
                      id="new-number"
                      name="number"
                      type="text"
                      inputMode="numeric"
                      value={draft.number}
                      onChange={(event) => setDraft((prev) => ({ ...prev, number: event.target.value }))}
                      placeholder="#"
                      className="w-20 rounded-lg border border-slate-200 bg-white px-3 py-2 focus:border-sky-300 focus:outline-none focus:ring-1 focus:ring-sky-300"
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="new-name" className="sr-only">
                      Name
                    </label>
                    <input
                      id="new-name"
                      name="name"
                      type="text"
                      value={draft.name}
                      onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder="Add student name"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 focus:border-sky-300 focus:outline-none focus:ring-1 focus:ring-sky-300"
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="new-national-id" className="sr-only">
                      National ID
                    </label>
                    <input
                      id="new-national-id"
                      name="nationalId"
                      type="text"
                      value={draft.nationalId ?? ''}
                      onChange={(event) => setDraft((prev) => ({ ...prev, nationalId: event.target.value }))}
                      placeholder="ID (optional)"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 focus:border-sky-300 focus:outline-none focus:ring-1 focus:ring-sky-300"
                    />
                  </div>
                  <button
                    type="submit"
                    className={clsx(
                      'inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500',
                      loading && 'cursor-wait opacity-70',
                    )}
                    disabled={loading}
                  >
                    Add
                  </button>
                </form>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
