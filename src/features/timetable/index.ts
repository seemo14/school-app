import { useAppStore } from '@/store'
import type { WeeklySchedule } from '@/lib/schemas'

export const useSchedules = () => useAppStore((state) => state.schedules)

export const useScheduleActions = () => {
  const saveSchedule = useAppStore((state) => state.saveSchedule)
  const deleteSchedule = useAppStore((state) => state.deleteSchedule)
  return { saveSchedule, deleteSchedule }
}

export const useScheduleForGroup = (groupId: string) => {
  const schedules = useSchedules()
  const groups = useAppStore((state) => state.groups)
  const group = groups.find((item) => item.id === groupId)
  if (!group) return undefined
  if (group.scheduleId) return schedules.find((schedule) => schedule.id === group.scheduleId)
  return schedules.find((schedule) => schedule.slots.some((slot) => slot.groupCode === group.code))
}

export type { WeeklySchedule }
