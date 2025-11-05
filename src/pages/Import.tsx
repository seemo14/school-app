import { type ChangeEvent, useMemo, useRef, useState } from 'react'

import { GroupPicker } from '@/components/GroupPicker'
import { PdfImportDialog } from '@/components/PdfImportDialog'
import { parseRosterPdf, parseTimetablePdf, type RosterEntry } from '@/lib/pdf'
import { toast } from '@/lib/toast'
import { useAppStore } from '@/store'

type TimetablePreviewMeta = {
  slots: ReturnType<typeof parseTimetablePdf> extends Promise<infer R> ? R : never
  unmatchedCodes: string[]
}

export default function ImportPage() {
  const fileInputRoster = useRef<HTMLInputElement | null>(null)
  const fileInputTimetable = useRef<HTMLInputElement | null>(null)
  const fileInputCsv = useRef<HTMLInputElement | null>(null)

  const {
    groupList,
    upsertStudents,
    saveSchedule,
    updateGroup,
    setActiveSchedule,
  } = useAppStore((state) => ({
    groupList: state.groupIds.map((id) => state.groups[id]).filter(Boolean),
    upsertStudents: state.upsertStudents,
    saveSchedule: state.saveSchedule,
    updateGroup: state.updateGroup,
    setActiveSchedule: state.setActiveSchedule,
  }))

  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(groupList[0]?.id)
  const [dialogKind, setDialogKind] = useState<'roster' | 'timetable'>('roster')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [dragActive, setDragActive] = useState(false)
  const [csvStatus, setCsvStatus] = useState<string>('')
  const [rosterPreview, setRosterPreview] = useState<RosterEntry[]>([])
  const [timetablePreview, setTimetablePreview] = useState<TimetablePreviewMeta | null>(null)

  const groupCodes = useMemo(() => new Set(groupList.map((group) => group.code)), [groupList])

  const resetDialogState = () => {
    setSelectedFile(undefined)
    setRosterPreview([])
    setTimetablePreview(null)
    setError(undefined)
    setParsing(false)
  }

  const handleFileChange = (kind: 'roster' | 'timetable') => async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setDialogKind(kind)
    setSelectedFile(file)
    setDialogOpen(true)
    setError(undefined)
    setParsing(true)

    try {
      if (kind === 'roster') {
        const entries = await parseRosterPdf(file)
        setRosterPreview(entries)
      } else {
        const slots = await parseTimetablePdf(file)
        const unmatched = Array.from(new Set(slots.map((slot) => slot.groupCode))).filter((code) => !groupCodes.has(code))
        setTimetablePreview({ slots, unmatchedCodes: unmatched })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to parse PDF.'
      setError(message)
    } finally {
      setParsing(false)
      event.target.value = ''
    }
  }

  const handleDialogConfirm = async () => {
    if (!selectedFile) return
    setParsing(true)
    setError(undefined)

    try {
      if (dialogKind === 'roster') {
        if (!selectedGroupId) throw new Error('Select a target group before importing a roster.')
        if (rosterPreview.length === 0) throw new Error('No roster entries detected to import.')
        await upsertStudents(
          selectedGroupId,
          rosterPreview.map((entry) => ({ number: entry.number, name: entry.name, nationalId: entry.nationalId })),
        )
        const groupCode = groupList.find((g) => g.id === selectedGroupId)?.code ?? 'group'
        toast.success(`Imported ${rosterPreview.length} students into ${groupCode}.`)
      } else if (timetablePreview) {
        const schedule = await saveSchedule({
          id: undefined,
          title: selectedFile.name.replace(/\.pdf$/i, ''),
          slots: timetablePreview.slots,
        })
        await Promise.all(
          timetablePreview.slots.map(async (slot) => {
            const group = groupList.find((g) => g.code === slot.groupCode)
            if (group && group.scheduleId !== schedule.id) {
              await updateGroup(group.id, { scheduleId: schedule.id })
            }
          }),
        )
        setActiveSchedule(schedule.id)
        toast.success(`Timetable imported with ${timetablePreview.slots.length} slots.`)
        if (timetablePreview.unmatchedCodes.length) {
          toast.info(`Groups not found for codes: ${timetablePreview.unmatchedCodes.join(', ')}`)
        }
      }

      setDialogOpen(false)
      resetDialogState()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed. Try again.')
      toast.error(err instanceof Error ? err.message : 'Import failed. Try again.')
    } finally {
      setParsing(false)
    }
  }

  const handleCsvChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!selectedGroupId) {
      setCsvStatus('Select a target group before importing CSV.')
      return
    }
    try {
      const papa = await import('papaparse')
      const data: Array<Record<string, string | undefined>> = await new Promise((resolve, reject) => {
        papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => resolve(result.data as Array<Record<string, string | undefined>>),
          error: reject,
        })
      })

      const entries = data.reduce<Array<{ number: string; name: string; nationalId?: string }>>((acc, row) => {
        const number = row.number?.trim()
        const name = row.name?.trim()
        if (!number || !name) return acc
        const nationalId = row.nationalId?.trim()
        acc.push({ number, name, nationalId: nationalId || undefined })
        return acc
      }, [])

      if (!entries.length) {
        setCsvStatus('No valid rows found in CSV.')
          toast.error('No valid rows found in CSV.')
        return
      }

      await upsertStudents(selectedGroupId, entries)
      setCsvStatus(`Imported ${entries.length} students from CSV.`)
        toast.success(`Imported ${entries.length} students from CSV.`)
    } catch (err) {
      setCsvStatus(err instanceof Error ? err.message : 'Unable to parse CSV file.')
        toast.error(err instanceof Error ? err.message : 'Unable to parse CSV file.')
    } finally {
      event.target.value = ''
    }
  }

  const rosterPreviewContent = rosterPreview.length ? (
    <table className="min-w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200">
          <th className="px-2 py-1">#</th>
          <th className="px-2 py-1">Name</th>
          <th className="px-2 py-1">ID</th>
        </tr>
      </thead>
      <tbody>
        {rosterPreview.slice(0, 12).map((entry) => (
          <tr key={`${entry.number}-${entry.name}`} className="border-b border-slate-50">
            <td className="px-2 py-1 font-semibold">{entry.number}</td>
            <td className="px-2 py-1">{entry.name}</td>
            <td className="px-2 py-1 text-slate-500">{entry.nationalId ?? ''}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <p className="text-sm text-slate-500">No entries detected yet.</p>
  )

  const timetablePreviewContent = timetablePreview?.slots.length ? (
    <div className="space-y-3">
      {timetablePreview.unmatchedCodes.length ? (
        <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-600">
          Unmatched group codes: {timetablePreview.unmatchedCodes.join(', ')}. Create the groups first so they can be linked.
        </p>
      ) : null}
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="px-2 py-1">Day</th>
            <th className="px-2 py-1">Time</th>
            <th className="px-2 py-1">Group</th>
          </tr>
        </thead>
        <tbody>
          {timetablePreview.slots.slice(0, 12).map((slot, index) => (
            <tr key={`${slot.groupCode}-${slot.start}-${index}`} className="border-b border-slate-50">
              <td className="px-2 py-1">{slot.day}</td>
              <td className="px-2 py-1">{slot.start} – {slot.end}</td>
              <td className="px-2 py-1 font-semibold">{slot.groupCode}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <p className="text-sm text-slate-500">No timetable slots detected yet.</p>
  )

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Import Center</h1>
          <p className="mt-1 text-sm text-slate-500">
            Parse rosters, timetables, or CSVs into structured data. All processing happens locally.
          </p>
        </div>
        <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          Phase 1 · Offline Only
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Student roster PDF</h2>
          <p className="mt-2 text-sm text-slate-500">
            Detect seat numbers and student names, then merge into the selected group.
          </p>
          <div className="mt-4 space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Target group</label>
            <GroupPicker groups={groupList} value={selectedGroupId} onChange={setSelectedGroupId} placeholder="Select group" allowEmpty={false} />
          </div>
          <button
            type="button"
            onClick={() => fileInputRoster.current?.click()}
            className="mt-6 w-full rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            Choose roster PDF
          </button>
          <input ref={fileInputRoster} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange('roster')} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Timetable PDF</h2>
          <p className="mt-2 text-sm text-slate-500">Extract weekly slots to link with your groups automatically.</p>
          <button
            type="button"
            onClick={() => fileInputTimetable.current?.click()}
            className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            Choose timetable PDF
          </button>
          <input ref={fileInputTimetable} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange('timetable')} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">CSV fallback</h2>
          <p className="mt-2 text-sm text-slate-500">Upload a CSV with columns: number, name, nationalId (optional).</p>
          <button
            type="button"
            onClick={() => fileInputCsv.current?.click()}
            className="mt-6 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-sky-200 hover:text-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            Upload CSV
          </button>
          <input ref={fileInputCsv} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvChange} />
          {csvStatus ? <p className="mt-2 text-xs text-slate-500">{csvStatus}</p> : null}
        </div>
      </section>

      <div
        className={
          'flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition ' +
          (dragActive ? 'border-sky-300 bg-sky-50/50' : 'border-slate-300 bg-white')
        }
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
      >
        <p className="text-sm font-semibold text-slate-700">Drag & drop PDFs/CSVs here</p>
        <p className="mt-1 text-xs text-slate-500">We&apos;ll detect the type automatically and show a preview before saving.</p>
      </div>

      <PdfImportDialog
        open={dialogOpen}
        kind={dialogKind}
        file={selectedFile}
        onClose={() => {
          if (!parsing) setDialogOpen(false)
        }}
        onConfirm={handleDialogConfirm}
        parsing={parsing}
        error={error}
        preview={dialogKind === 'roster' ? rosterPreviewContent : timetablePreviewContent}
      />
    </div>
  )
}
