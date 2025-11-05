import { Fragment } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { ChevronUpDownIcon, PlusIcon } from '@heroicons/react/24/outline'
import type { Group } from '@/lib/schemas'

type GroupPickerProps = {
  groups: Group[]
  value?: string
  onChange: (id: string) => void
  onCreate?: () => void
  placeholder?: string
}

const gradeLabels: Record<Group['grade'], string> = {
  '8th': '8th grade',
  '9th': '9th grade',
}

export const GroupPicker = ({ groups, value, onChange, onCreate, placeholder }: GroupPickerProps) => {
  const selected = groups.find((group) => group.id === value)

  return (
    <div className="flex w-full gap-3">
      <Listbox value={value} onChange={onChange}>
        <div className="relative flex-1">
          <Listbox.Button className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-left text-sm font-medium shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
            <span className="block truncate">
              {selected ? `${selected.code} • ${gradeLabels[selected.grade]}` : placeholder ?? 'Select a group'}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
              <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-2 text-sm shadow-lg focus:outline-none">
              {groups.length === 0 && (
                <p className="px-4 py-2 text-slate-500">No groups yet</p>
              )}
              {groups.map((group) => (
                <Listbox.Option
                  key={group.id}
                  className={({ active }) =>
                    `relative cursor-pointer select-none px-4 py-2 ${
                      active ? 'bg-brand-50 text-brand-700' : 'text-slate-700'
                    }`
                  }
                  value={group.id}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{group.code}</span>
                    <span className="text-xs text-slate-500">{gradeLabels[group.grade]}</span>
                  </div>
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
      {onCreate && (
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center justify-center rounded-xl border border-transparent bg-brand-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <PlusIcon className="mr-1 h-4 w-4" />
          New
        </button>
      )}
    </div>
  )
}

export default GroupPicker
