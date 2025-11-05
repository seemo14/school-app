import { type FormEvent, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { GroupPicker } from '@/components/GroupPicker'
import { useAppStore } from '@/store'

export default function GroupsPage() {
  const navigate = useNavigate()
  const {
    groupIds,
    groups,
    studentsByGroup,
    createGroup,
  } = useAppStore((state) => ({
    groupIds: state.groupIds,
    groups: state.groups,
    studentsByGroup: state.studentsByGroup,
    createGroup: state.createGroup,
  }))

  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(groupIds[0])
  const [code, setCode] = useState('')
  const [grade, setGrade] = useState<'8th' | '9th'>('8th')
  const [saving, setSaving] = useState(false)

  const allGroups = useMemo(() => groupIds.map((id) => groups[id]).filter(Boolean), [groupIds, groups])

  const handleCreateGroup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!code.trim()) return
    setSaving(true)
    try {
      const created = await createGroup({ code: code.trim().toUpperCase(), grade })
      setCode('')
      setSelectedGroupId(created.id)
      navigate(`/groups/${created.id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Groups</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your 8th and 9th grade cohorts. Import rosters or create groups manually.
          </p>
        </div>
        <div className="w-full max-w-xs">
          <GroupPicker
            groups={allGroups}
            value={selectedGroupId}
            onChange={(id) => {
              setSelectedGroupId(id)
              if (id) navigate(`/groups/${id}`)
            }}
            placeholder="Jump to group"
            allowEmpty
          />
        </div>
      </header>

      <form
        onSubmit={handleCreateGroup}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-slate-900">Create a group</h2>
        <p className="mt-1 text-sm text-slate-500">
          Codes usually follow the pattern <code className="rounded bg-slate-100 px-1 py-0.5">2ASCG1</code>.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label htmlFor="group-code" className="block text-sm font-medium text-slate-600">
              Group code
            </label>
            <input
              id="group-code"
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="e.g., 2ASCG1"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm uppercase tracking-wide focus:border-sky-300 focus:outline-none focus:ring-1 focus:ring-sky-300"
              required
            />
          </div>
          <div>
            <label htmlFor="group-grade" className="block text-sm font-medium text-slate-600">
              Grade
            </label>
            <select
              id="group-grade"
              value={grade}
              onChange={(event) => setGrade(event.target.value as '8th' | '9th')}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-sky-300 focus:outline-none focus:ring-1 focus:ring-sky-300"
            >
              <option value="8th">8th Grade</option>
              <option value="9th">9th Grade</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-wait disabled:opacity-70"
            disabled={saving}
          >
            Create Group
          </button>
        </div>
      </form>

      {allGroups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-700">No groups yet</h2>
          <p className="mt-2 text-sm text-slate-500">
            Import a roster PDF or CSV to get started. You can also seed demo data from the dashboard later.
          </p>
          <Link
            to="/import"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Go to Import Center
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {allGroups.map((group) => {
            const studentCount = studentsByGroup[group.id]?.length ?? 0
            return (
              <Link
                key={group.id}
                to={`/groups/${group.id}`}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-200 hover:shadow-card"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{group.grade}</p>
                    <h3 className="text-lg font-semibold text-slate-900">{group.code}</h3>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                    {studentCount} student{studentCount === 1 ? '' : 's'}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  Created {new Date(group.createdAt).toLocaleDateString()}
                </p>
                <p className="mt-1 text-sm font-medium text-sky-600 opacity-0 transition group-hover:opacity-100">
                  View details →
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
