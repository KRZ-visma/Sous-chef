const STORAGE_KEY = 'sous-chef:week-plan:v1'
const FIRST_DAY_STORAGE_KEY = 'sous-chef:first-day-of-week:v1'

export type WeekPlan = {
  slots: (string | null)[]
}

export function emptyPlan(): WeekPlan {
  return { slots: new Array(7).fill(null) }
}

export function loadPlan(): WeekPlan {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyPlan()
    const data: unknown = JSON.parse(raw)
    if (!data || typeof data !== 'object' || !('slots' in data)) {
      return emptyPlan()
    }
    const slotsRaw = (data as { slots: unknown }).slots
    if (!Array.isArray(slotsRaw)) return emptyPlan()
    const slots = slotsRaw.map((s: unknown) =>
      s === null || s === '' ? null : String(s),
    )
    while (slots.length < 7) slots.push(null)
    return { slots: slots.slice(0, 7) }
  } catch {
    return emptyPlan()
  }
}

export function savePlan(plan: WeekPlan): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ slots: plan.slots }))
}

export function loadFirstDayOfWeekIndex(): number {
  const raw = localStorage.getItem(FIRST_DAY_STORAGE_KEY)
  if (raw === null) {
    return 0
  }
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) {
    return 0
  }
  return ((Math.floor(parsed) % 7) + 7) % 7
}

export function saveFirstDayOfWeekIndex(dayIndex: number): void {
  const normalized = ((Math.floor(dayIndex) % 7) + 7) % 7
  localStorage.setItem(FIRST_DAY_STORAGE_KEY, String(normalized))
}
