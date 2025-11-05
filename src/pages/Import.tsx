import { useEffect, useMemo, useState } from 'react'
import Papa, { type ParseResult } from 'papaparse'
import { toast } from 'sonner'
import GroupPicker from '@/components/GroupPicker'
import PdfImportDialog from '@/components/PdfImportDialog'
import { useGroups, useGroupsActions } from '@/features/groups'
import { useScheduleActions } from '@/features/timetable'
import { useStudentActions } from '@/features/students'
import type { ParsedRoster, ParsedSchedule } from '@/lib/schemas'

type CsvMapping = {
  number: string
  name: string
  nationalId?: string
}

type CsvPreview = {
  headers: string[]
  rows: Record<string, string>[]
}

const ImportPage = () => {
  const groups = useGroups()
  const { mergeRoster } = useStudentActions()
  const { saveSchedule } = useScheduleActions()
  const { updateGroup } = useGroupsActions()

  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(groups[0]?.id)
  const [rosterDialogOpen, setRosterDialogOpen] = useState(false)
  const [timetableDialogOpen, setTimetableDialogOpen] = useState(false)
  const [csvPreview, setCsvPreview] = useState<CsvPreview | null>(null)
  const [csvMapping, setCsvMapping] = useState<CsvMapping>({ number: '', name: '' })
  const [importingCsv, setImportingCsv] = useState(false)

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId),
    [groups, selectedGroupId],
  )

  useEffect(() => {
    if (!selectedGroupId && groups[0]) {
      setSelectedGroupId(groups[0].id)
    }
  }, [groups, selectedGroupId])

  const handleRosterImported = async (result: ParsedRoster) => {
    if (!selectedGroup) {
      toast.error('Select a group before importing a roster.')
      return
    }
    const { added, updated } = await mergeRoster(selectedGroup.id, result.rows)
    toast.success(`Roster imported. ${added} added, ${updated} updated.`)
  }

  const handleScheduleImported = async (result: ParsedSchedule) => {
    const schedule = await saveSchedule({ ...result, createdAt: Date.now() })
    toast.success('Weekly timetable imported.')
    groups
      .filter((group) => result.slots.some((slot) => slot.groupCode === group.code))
      .forEach((group) => {
        void updateGroup(group.id, { scheduleId: schedule.id })
      })
  }

  const handleCsvFile = (file: File) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: ParseResult<Record<string, string>>) => {
        if (results.errors.length) {
          toast.error('Could not parse CSV. Please check formatting.')
          return
        }
        const headers = results.meta.fields ?? []
        setCsvPreview({ headers, rows: results.data.slice(0, 20) })
        setCsvMapping({
          number: headers[0] ?? '',
          name: headers[1] ?? '',
          nationalId: headers[2],
        })
        toast.success('CSV parsed. Review mappings below.')
      },
      error: () => toast.error('Could not read CSV file'),
    })
  }

  const handleCsvImport = async () => {
    if (!selectedGroup || !csvPreview) {
      toast.error('Select a group and upload a CSV first.')
      return
    }
    const { number, name, nationalId } = csvMapping
    if (!number || !name) {
      toast.error('Map columns for roster number and name.')
      return
    }

    setImportingCsv(true)
    try {
      const rows = csvPreview.rows
        .map((row) => ({
          number: row[number]?.trim() ?? '',
          name: row[name]?.trim() ?? '',
          nationalId: nationalId ? row[nationalId]?.trim() : undefined,
        }))
        .filter((row) => row.number && row.name)

      const { added, updated } = await mergeRoster(selectedGroup.id, rows)
      toast.success(`CSV merged. ${added} added, ${updated} updated.`)
      setCsvPreview(null)
    } catch (error) {
      console.error(error)
      toast.error('Failed to import CSV roster.')
    } finally {
      setImportingCsv(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Imports</h1>
        <p className="mt-1 text-sm text-slate-600">
          Bring in student rosters and weekly timetables. Everything stays on-device until you export.
        </p>
        <div className="mt-4 max-w-xl">
          <GroupPicker
            groups={groups}
            value={selectedGroupId}
            onChange={setSelectedGroupId}
            placeholder="Choose a group for roster imports"
          />
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800">Roster PDF</h2>
          <p className="mt-1 text-sm text-slate-600">
            Parse a roster PDF. Matching numbers update existing students, new numbers are added.
          </p>
          <button
            type="button"
            onClick={() => setRosterDialogOpen(true)}
            className="mt-4 w-full rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
          >
            Import roster PDF
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800">Timetable PDF</h2>
          <p className="mt-1 text-sm text-slate-600">
            Detect weekly slots from coloured grids or text. After import, slots attach to matching group codes.
          </p>
          <button
            type="button"
            onClick={() => setTimetableDialogOpen(true)}
            className="mt-4 w-full rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
          >
            Import timetable PDF
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800">CSV roster fallback</h2>
        <p className="mt-1 text-sm text-slate-600">Drag a CSV with headers for number, name and optional ID.</p>
        <div
          className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            const file = event.dataTransfer.files?.[0]
            if (file) handleCsvFile(file)
          }}
        >
          <p className="text-sm font-semibold text-slate-700">Drop CSV here or click to browse</p>
          <input
            type="file"
            accept="text/csv"
            className="mt-3 text-sm"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) handleCsvFile(file)
            }}
          />
        </div>

        {csvPreview && (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <label className="text-slate-600">Number column</label>
                <select
                  value={csvMapping.number}
                  onChange={(event) => setCsvMapping((current) => ({ ...current, number: event.target.value }))}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                >
                  {csvPreview.headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <label className="text-slate-600">Name column</label>
                <select
                  value={csvMapping.name}
                  onChange={(event) => setCsvMapping((current) => ({ ...current, name: event.target.value }))}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                >
                  {csvPreview.headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <label className="text-slate-600">ID column</label>
                <select
                  value={csvMapping.nationalId ?? ''}
                  onChange={(event) =>
                    setCsvMapping((current) => ({
                      ...current,
                      nationalId: event.target.value || undefined,
                    }))
                  }
                  className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                >
                  <option value="">None</option>
                  {csvPreview.headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {csvPreview.headers.map((header) => (
                      <th key={header} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {csvPreview.rows.map((row, index) => (
                    <tr key={index}>
                      {csvPreview.headers.map((header) => (
                        <td key={header} className="px-3 py-2 text-xs text-slate-600">
                          {row[header]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={handleCsvImport}
              disabled={importingCsv}
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
            >
              {importingCsv ? 'Importing…' : 'Merge CSV into roster'}
            </button>
          </div>
        )}
      </section>

      <PdfImportDialog
        open={rosterDialogOpen}
        mode="roster"
        onClose={() => setRosterDialogOpen(false)}
        onSubmit={(result) => {
          if ('rows' in result) {
            return handleRosterImported(result)
          }
          return undefined
        }}
        contextLabel={selectedGroup ? `Importing into ${selectedGroup.code}` : 'Select a group first'}
      />
      <PdfImportDialog
        open={timetableDialogOpen}
        mode="timetable"
        onClose={() => setTimetableDialogOpen(false)}
        onSubmit={(result) => {
          if ('slots' in result) {
            return handleScheduleImported(result)
          }
          return undefined
        }}
        contextLabel="Slots will be matched by group code"
      />
    </div>
  )
}

export default ImportPage
