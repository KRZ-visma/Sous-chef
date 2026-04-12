const STORAGE_KEY = 'sous-chef:week-plan:v1'

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
