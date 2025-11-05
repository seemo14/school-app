import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useGroups, useGroupsActions } from '@/features/groups'
import type { Grade } from '@/lib/schemas'
import { toast } from 'sonner'

const gradeOptions: Grade[] = ['8th', '9th']

const GroupsPage = () => {
  const groups = useGroups()
  const { createGroup, deleteGroup } = useGroupsActions()
  const [code, setCode] = useState('')
  const [grade, setGrade] = useState<Grade>('8th')
  const [saving, setSaving] = useState(false)

  const handleCreate = async () => {
    if (!code.trim()) return
    setSaving(true)
    try {
      await createGroup({ code: code.trim().toUpperCase(), grade })
      toast.success('Group created')
      setCode('')
    } catch (error) {
      console.error(error)
      toast.error('Could not create group')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this group? Students and lessons in it will be removed.')) return
    await deleteGroup(id)
    toast.success('Group deleted')
  }

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Groups</h1>
        <p className="mt-1 text-sm text-slate-600">Manage your 8th and 9th grade groups.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[2fr,1fr,auto]">
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Group code (e.g. 2ASCG1)"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm uppercase tracking-wide shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <select
            value={grade}
            onChange={(event) => setGrade(event.target.value as Grade)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            {gradeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleCreate}
            disabled={saving || !code.trim()}
            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
          >
            Add group
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => (
          <article key={group.id} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{group.code}</h2>
              <p className="text-sm text-slate-500">Grade {group.grade}</p>
              <p className="mt-2 text-xs text-slate-400">Created {new Date(group.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Link
                to={`/groups/${group.id}`}
                className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-100"
              >
                Open details
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(group.id)}
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

export default GroupsPage
