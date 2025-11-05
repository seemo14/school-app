import { useMemo } from 'react'
import { useAppStore } from '@/store'
import type { Group } from '@/lib/schemas'

export const useGroups = () => useAppStore((state) => state.groups)

export const useGroupById = (id?: string) =>
  useAppStore((state) => state.groups.find((group) => group.id === id))

export const useGroupsActions = () => {
  const createGroup = useAppStore((state) => state.createGroup)
  const updateGroup = useAppStore((state) => state.updateGroup)
  const deleteGroup = useAppStore((state) => state.deleteGroup)
  const selectGroup = useAppStore((state) => state.selectGroup)
  return { createGroup, updateGroup, deleteGroup, selectGroup }
}

export const useGroupOptions = () => {
  const groups = useGroups()
  return useMemo(
    () =>
      groups.map((group) => ({
        value: group.id,
        label: `${group.code} (${group.grade})`,
      })),
    [groups],
  )
}

export type { Group }
