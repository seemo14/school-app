import { type FormEvent, useState } from 'react'
import { nanoid } from 'nanoid'

import { defaultStageNotes, type Group, type Lesson, type LessonStageNotes } from '@/lib/schemas'
import { toIsoDate } from '@/lib/time'

type LessonFormProps = {
  group: Group
  initial?: Partial<Lesson>
  onSave: (lesson: Lesson) => Promise<void> | void
  onCancel?: () => void
}

export function LessonForm({ group, initial, onSave, onCancel }: LessonFormProps) {
  const [date, setDate] = useState(initial?.date ?? toIsoDate(new Date()))
  const [start, setStart] = useState(initial?.start ?? '08:00')
  const [end, setEnd] = useState(initial?.end ?? '09:00')
  const [theme, setTheme] = useState(initial?.theme ?? '')
  const [stageNotes, setStageNotes] = useState<LessonStageNotes>({
    ...defaultStageNotes,
    ...initial?.stageNotes,
  })
  const [observations, setObservations] = useState(initial?.observations ?? '')
  const [saving, setSaving] = useState(false)

  const handleStageChange = (key: keyof LessonStageNotes, value: string) => {
    setStageNotes((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    try {
      const lesson: Lesson = {
        id: initial?.id ?? nanoid(),
        groupId: group.id,
        date,
        start,
        end,
        theme: theme.trim() || undefined,
        stageNotes,
        observations: observations.trim() || undefined,
        attachments: initial?.attachments ?? [],
      }
      await onSave(lesson)
      if (!initial) {
        setTheme('')
        setStageNotes(defaultStageNotes)
        setObservations('')
      }
    } finally {
      setSaving(false)
    }
  }

  const disabled = saving

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-600" htmlFor="lesson-date">
            Date
          </label>
          <input
            id="lesson-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-sky-300 focus:outline-none focus:ring-1 focus:ring-sky-300"
            required
            disabled={disabled}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-600" htmlFor="lesson-start">
              Start
            </label>
            <input
              id="lesson-start"
              type="time"
              value={start}
              onChange={(event) => setStart(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-sky-300 focus:outline-none focus:ring-1 focus:ring-sky-300"
              required
              disabled={disabled}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-600" htmlFor="lesson-end">
              End
            </label>
            <input
              id="lesson-end"
              type="time"
              value={end}
              onChange={(event) => setEnd(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-sky-300 focus:outline-none focus:ring-1 focus:ring-sky-300"
              required
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-600" htmlFor="lesson-theme">
          Theme
        </label>
        <input
          id="lesson-theme"
          type="text"
          value={theme}
          onChange={(event) => setTheme(event.target.value)}
          placeholder="E.g., Present perfect – speaking practice"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-sky-300 focus:outline-none focus:ring-1 focus:ring-sky-300"
          disabled={disabled}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(
          [
            ['warmup', 'Warm-up'],
            ['presentation', 'Presentation'],
            ['practice', 'Practice'],
            ['production', 'Production'],
            ['homework', 'Homework'],
          ] as Array<[keyof LessonStageNotes, string]>
        ).map(([key, label]) => (
          <div key={key} className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-600" htmlFor={`lesson-${key}`}>
              {label}
            </label>
            <textarea
              id={`lesson-${key}`}
              value={stageNotes[key] ?? ''}
              onChange={(event) => handleStageChange(key, event.target.value)}
              rows={3}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-sky-300 focus:outline-none focus:ring-1 focus:ring-sky-300"
              disabled={disabled}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-600" htmlFor="lesson-observations">
          Observations
        </label>
        <textarea
          id="lesson-observations"
          value={observations}
          onChange={(event) => setObservations(event.target.value)}
          rows={4}
          placeholder="Classroom observations, progress notes, follow-ups"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-sky-300 focus:outline-none focus:ring-1 focus:ring-sky-300"
          disabled={disabled}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-400">
          PPP template is pre-filled with defaults you can customise.
        </div>
        <div className="flex gap-3">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
            >
              Cancel
            </button>
          ) : null}
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-wait disabled:opacity-70"
            disabled={disabled}
          >
            {initial ? 'Save changes' : 'Save lesson'}
          </button>
        </div>
      </div>
    </form>
  )
}
