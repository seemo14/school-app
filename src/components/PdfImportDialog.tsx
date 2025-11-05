import { Dialog, Transition } from '@headlessui/react'
import { Fragment, type ReactNode } from 'react'

type PdfImportDialogProps = {
  open: boolean
  kind: 'roster' | 'timetable'
  file?: File
  preview?: ReactNode
  parsing?: boolean
  error?: string
  onClose: () => void
  onConfirm: () => void
}

const titles: Record<PdfImportDialogProps['kind'], string> = {
  roster: 'Import student roster',
  timetable: 'Import timetable',
}

export function PdfImportDialog({ open, kind, file, preview, parsing, error, onClose, onConfirm }: PdfImportDialogProps) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={parsing ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/60" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center px-4 py-8 text-center sm:items-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-slate-900">{titles[kind]}</Dialog.Title>
                    <p className="mt-1 text-sm text-slate-500">
                      Confirm the extracted data before saving. Nothing leaves your device.
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  {file ? (
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <p>No file selected yet.</p>
                  )}
                </div>

                <div className="mt-4 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4">
                  {preview ?? <p className="text-sm text-slate-500">Preview will appear here after parsing.</p>}
                </div>

                {error ? <p className="mt-3 text-sm text-rose-500">{error}</p> : null}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                    disabled={parsing}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onConfirm}
                    className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-wait disabled:opacity-70"
                    disabled={!file || parsing}
                  >
                    {parsing ? 'Processing…' : 'Save to gradebook'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
