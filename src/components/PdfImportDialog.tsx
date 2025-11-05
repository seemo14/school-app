import { Fragment, useRef, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { InboxArrowDownIcon } from '@heroicons/react/24/outline'
import { parseRosterPdf, parseTimetablePdf } from '@/lib/pdf'
import type { ParsedRoster, ParsedSchedule, RosterRow, WeeklySlot } from '@/lib/schemas'

type PdfImportDialogProps = {
  open: boolean
  mode: 'roster' | 'timetable'
  onClose: () => void
  onSubmit: (result: ParsedRoster | ParsedSchedule) => void | Promise<void>
  contextLabel?: string
}

export const PdfImportDialog = ({ open, mode, onClose, onSubmit, contextLabel }: PdfImportDialogProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rosterRows, setRosterRows] = useState<RosterRow[]>([])
  const [schedule, setSchedule] = useState<ParsedSchedule | null>(null)

  const resetState = () => {
    setRosterRows([])
    setSchedule(null)
    setError(null)
  }

  const handleFile = async (file: File) => {
    setLoading(true)
    setError(null)
    try {
      if (mode === 'roster') {
        const result = await parseRosterPdf(file)
        setRosterRows(result.rows)
      } else {
        const result = await parseTimetablePdf(file)
        setSchedule(result)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse PDF. Please try another file.')
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) await handleFile(file)
  }

  const handleConfirm = async () => {
    if (mode === 'roster') {
      await onSubmit({ rows: rosterRows })
    } else if (schedule) {
      await onSubmit(schedule)
    }
    onClose()
    resetState()
  }

  const renderRosterPreview = () => (
    <div className="mt-4 max-h-72 overflow-y-auto rounded-xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2 text-left">#</th>
            <th className="px-3 py-2 text-left">Name</th>
            <th className="px-3 py-2 text-left">ID</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rosterRows.map((row, index) => (
            <tr key={`${row.number}-${index}`} className="bg-white">
              <td className="px-3 py-2">
                <input
                  className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                  value={row.number}
                  onChange={(event) =>
                    setRosterRows((current) =>
                      current.map((item, idx) =>
                        idx === index ? { ...item, number: event.target.value } : item,
                      ),
                    )
                  }
                />
              </td>
              <td className="px-3 py-2">
                <input
                  className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                  value={row.name}
                  onChange={(event) =>
                    setRosterRows((current) =>
                      current.map((item, idx) =>
                        idx === index ? { ...item, name: event.target.value } : item,
                      ),
                    )
                  }
                />
              </td>
              <td className="px-3 py-2">
                <input
                  className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                  value={row.nationalId ?? ''}
                  placeholder="Optional"
                  onChange={(event) =>
                    setRosterRows((current) =>
                      current.map((item, idx) =>
                        idx === index ? { ...item, nationalId: event.target.value } : item,
                      ),
                    )
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const renderTimetablePreview = () => (
    <div className="mt-4 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2 text-left">Day</th>
            <th className="px-3 py-2 text-left">Start</th>
            <th className="px-3 py-2 text-left">End</th>
            <th className="px-3 py-2 text-left">Group</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {schedule?.slots.map((slot: WeeklySlot, index) => (
            <tr key={`${slot.day}-${slot.start}-${slot.groupCode}-${index}`}>
              <td className="px-3 py-2 text-slate-600">{slot.day}</td>
              <td className="px-3 py-2 text-slate-600">{slot.start}</td>
              <td className="px-3 py-2 text-slate-600">{slot.end}</td>
              <td className="px-3 py-2 text-slate-700">{slot.groupCode}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const hasPreview = mode === 'roster' ? rosterRows.length > 0 : Boolean(schedule)

  return (
    <Transition appear show={open} as={Fragment} afterLeave={resetState}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center px-4 py-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-3xl bg-white p-6 shadow-xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-slate-800">
                  Import {mode === 'roster' ? 'Student Roster' : 'Timetable'}
                </Dialog.Title>
                {contextLabel && <p className="mt-1 text-sm text-slate-500">{contextLabel}</p>}

                <div
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleDrop}
                  className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <InboxArrowDownIcon className="h-10 w-10 text-brand-500" />
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    {loading ? 'Parsing PDF…' : `Drag & drop or click to choose a ${mode} PDF`}
                  </p>
                  <p className="text-xs text-slate-500">We keep everything on this device.</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) void handleFile(file)
                    }}
                  />
                </div>

                {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

                {mode === 'roster' ? renderRosterPreview() : renderTimetablePreview()}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      resetState()
                    }}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={!hasPreview || loading}
                    className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
                  >
                    Confirm Import
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default PdfImportDialog
