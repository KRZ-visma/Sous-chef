const LOCAL_STORAGE_KEY = 'sous-chef:week-plan:v1'

export type WeekPlan = {
  slots: (string | null)[]
}

function weekPlanStorageKey(googleUserSub?: string): string {
  if (googleUserSub) {
    return `sous-chef:week-plan:v1:google:${googleUserSub}`
  }
  return LOCAL_STORAGE_KEY
}

export function emptyPlan(): WeekPlan {
  return { slots: new Array(7).fill(null) }
}

export function parseWeekPlanJson(raw: string): WeekPlan | null {
  try {
    const data: unknown = JSON.parse(raw)
    if (!data || typeof data !== 'object' || !('slots' in data)) {
      return null
    }
    const slotsRaw = (data as { slots: unknown }).slots
    if (!Array.isArray(slotsRaw)) return null
    const slots = slotsRaw.map((s: unknown) =>
      s === null || s === '' ? null : String(s),
    )
    while (slots.length < 7) slots.push(null)
    return { slots: slots.slice(0, 7) }
  } catch {
    return null
  }
}

export function loadPlan(googleUserSub?: string): WeekPlan {
  try {
    const raw = localStorage.getItem(weekPlanStorageKey(googleUserSub))
    if (!raw) return emptyPlan()
    return parseWeekPlanJson(raw) ?? emptyPlan()
  } catch {
    return emptyPlan()
  }
}

export function savePlan(plan: WeekPlan, googleUserSub?: string): void {
  localStorage.setItem(
    weekPlanStorageKey(googleUserSub),
    JSON.stringify({ slots: plan.slots }),
  )
}
