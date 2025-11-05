import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'
import { Fragment, useMemo } from 'react'

import type { Group } from '@/lib/schemas'

type GroupPickerProps = {
  groups: Group[]
  value?: string
  onChange: (id: string | undefined) => void
  placeholder?: string
  allowEmpty?: boolean
  className?: string
}

const gradeLabels: Record<Group['grade'], string> = {
  '8th': '8th Grade',
  '9th': '9th Grade',
}

export function GroupPicker({
  groups,
  value,
  onChange,
  placeholder = 'Select a group',
  allowEmpty = false,
  className,
}: GroupPickerProps) {
  const grouped = useMemo(() => {
    const sorted = [...groups].sort((a, b) => {
      if (a.grade !== b.grade) return a.grade.localeCompare(b.grade)
      return a.code.localeCompare(b.code)
    })
    return sorted.reduce<Record<Group['grade'], Group[]>>(
      (acc, group) => {
        acc[group.grade] = acc[group.grade] ? [...acc[group.grade]!, group] : [group]
        return acc
      },
      { '8th': [], '9th': [] },
    )
  }, [groups])

  const selected = groups.find((group) => group.id === value)

  return (
    <Listbox value={selected?.id} onChange={(id) => onChange(id ?? undefined)}>
      {({ open }) => (
        <div className={clsx('relative', className)}>
          <Listbox.Button className="relative w-full cursor-default rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-10 text-left text-sm shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
            <span className="block truncate font-medium text-slate-700">
              {selected ? `${selected.code} · ${gradeLabels[selected.grade]}` : placeholder}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronUpDownIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            show={open}
            leave="transition ease-in duration-75"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-2 text-sm shadow-lg focus:outline-none">
              {allowEmpty ? (
                <Listbox.Option
                  key="__none"
                  value={undefined}
                  className={({ active }) =>
                    clsx('cursor-default select-none px-4 py-2 text-slate-500', {
                      'bg-sky-50 text-sky-600': active,
                    })
                  }
                >
                  None
                </Listbox.Option>
              ) : null}
              {Object.entries(grouped).map(([grade, items]) => (
                <div key={grade} className="px-3 py-2">
                  <p className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {gradeLabels[grade as Group['grade']]}
                  </p>
                  {items.length === 0 ? (
                    <p className="px-1 py-1 text-xs text-slate-300">No groups yet</p>
                  ) : (
                    items.map((group) => (
                      <Listbox.Option
                        key={group.id}
                        value={group.id}
                        className={({ active }) =>
                          clsx(
                            'relative mt-1 flex cursor-default select-none items-center justify-between rounded-lg px-3 py-2',
                            active ? 'bg-sky-50 text-sky-600' : 'text-slate-600',
                          )
                        }
                      >
                        {({ selected: isSelected }) => (
                          <>
                            <span className={clsx('truncate text-sm font-medium', isSelected ? 'text-sky-700' : 'text-slate-700')}>
                              {group.code}
                            </span>
                            {isSelected ? <CheckIcon className="h-4 w-4 text-sky-600" /> : null}
                          </>
                        )}
                      </Listbox.Option>
                    ))
                  )}
                </div>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      )}
    </Listbox>
  )
}
