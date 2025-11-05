import { useEffect, useState } from 'react'
import { nanoid } from 'nanoid'
import type { Group, Lesson, LessonStages } from '@/lib/schemas'
import { defaultLessonTemplate } from '@/lib/schemas'
import { nowIsoDate } from '@/lib/time'

type LessonFormProps = {
  group: Group
  initial?: Partial<Lesson>
  onSave: (lesson: Lesson) => void | Promise<void>
  onCancel?: () => void
}

const emptyStages: LessonStages = {
  warmup: '',
  presentation: '',
  practice: '',
  production: '',
  homework: '',
}

const mergeStages = (value?: LessonStages) => ({ ...emptyStages, ...value })

export const LessonForm = ({ group, initial, onSave, onCancel }: LessonFormProps) => {
  const [date, setDate] = useState(initial?.date ?? nowIsoDate())
  const [start, setStart] = useState(initial?.start ?? '08:00')
  const [end, setEnd] = useState(initial?.end ?? '09:00')
  const [theme, setTheme] = useState(initial?.theme ?? '')
  const [observations, setObservations] = useState(initial?.observations ?? '')
  const [stageNotes, setStageNotes] = useState<LessonStages>(mergeStages(initial?.stageNotes))

  useEffect(() => {
    if (!initial) return
    setDate(initial.date ?? nowIsoDate())
    setStart(initial.start ?? '08:00')
    setEnd(initial.end ?? '09:00')
    setTheme(initial.theme ?? '')
    setObservations(initial.observations ?? '')
    setStageNotes(mergeStages(initial.stageNotes))
  }, [initial])

  const handleResetTemplate = () => setStageNotes(defaultLessonTemplate)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const lesson: Lesson = {
      id: initial?.id ?? nanoid(),
      groupId: group.id,
      date,
      start,
      end,
      theme: theme.trim() || undefined,
      stageNotes,
      observations: observations.trim() || undefined,
      attachments: initial?.attachments,
    }
    await onSave(lesson)
  }

  const updateStage = (key: keyof LessonStages, value: string) =>
    setStageNotes((prev) => ({ ...prev, [key]: value }))

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-600">Date</span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
            required
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-600">Start</span>
            <input
              type="time"
              value={start}
              onChange={(event) => setStart(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-600">End</span>
            <input
              type="time"
              value={end}
              onChange={(event) => setEnd(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
              required
            />
          </label>
        </div>
        <label className="sm:col-span-2 flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-600">Theme</span>
          <input
            type="text"
            value={theme}
            onChange={(event) => setTheme(event.target.value)}
            placeholder="Topic or unit focus"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </label>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-600">PPP Stages</h3>
        <button
          type="button"
          onClick={handleResetTemplate}
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Apply default template
        </button>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:grid-cols-2">
        {(
          [
            ['warmup', 'Warm-up'],
            ['presentation', 'Presentation'],
            ['practice', 'Practice'],
            ['production', 'Production'],
            ['homework', 'Homework'],
          ] as Array<[keyof LessonStages, string]>
        ).map(([key, label]) => (
          <label key={key} className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-600">{label}</span>
            <textarea
              value={stageNotes[key] ?? ''}
              onChange={(event) => updateStage(key, event.target.value)}
              placeholder={defaultLessonTemplate[key] ?? ''}
              rows={3}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </label>
        ))}
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-600">Observations</span>
        <textarea
          value={observations}
          onChange={(event) => setObservations(event.target.value)}
          rows={3}
          placeholder="Class observations, differentiation notes, follow-ups"
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
      </label>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
        >
          Save Lesson
        </button>
      </div>
    </form>
  )
}

export default LessonForm
