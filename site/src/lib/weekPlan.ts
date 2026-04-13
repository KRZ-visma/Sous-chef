import type { Recipe } from '../types/recipe'
import { emptyPlan, loadPlan, savePlan, type WeekPlan } from './weekPlanStorage'

const DAY_LABELS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const

export { DAY_LABELS }

export function recipeOptionLabel(recipe: Recipe): string {
  const d = recipe.days
  const suffix =
    typeof d === 'number' && d > 0
      ? ` — ${d}${d === 1 ? ' day' : ' days'}`
      : ''
  return recipe.name + suffix
}

export function formatIngredientLine(ing: {
  item?: string
  amount?: string
  unit?: string
}): string {
  if (!ing?.item) return ''
  const bits: string[] = []
  if (ing.amount) bits.push(String(ing.amount))
  if (ing.unit) bits.push(ing.unit)
  const prefix = bits.length ? `${bits.join(' ')} ` : ''
  return prefix + ing.item
}

/** Calendar days one recipe instance covers when placed on startDayIndex (wraps week). */
export function recipeCalendarDayLabels(
  recipe: Recipe | null,
  startDayIndex: number,
): string[] {
  if (!recipe) return []
  const raw = recipe.days
  const span =
    typeof raw === 'number' && raw >= 1 ? Math.floor(raw) : 1
  const labels: string[] = []
  for (let o = 0; o < span; o++) {
    labels.push(DAY_LABELS[(startDayIndex + o) % 7])
  }
  return labels
}

export function recipeSpanDays(recipe: Recipe | null): number {
  if (!recipe) return 0
  const raw = recipe.days
  return typeof raw === 'number' && raw >= 1 ? Math.floor(raw) : 1
}

/**
 * If this day is covered by a multi-day recipe that started on an earlier day
 * in the same week (including wrap: Sunday → Monday), returns that start day index.
 */
export function findContinuationStartDay(
  dayIndex: number,
  slots: (string | null)[],
  recipesById: Record<string, Recipe>,
): number | null {
  for (let s = 0; s < 7; s++) {
    const id = slots[s]
    if (!id) continue
    const recipe = recipesById[id]
    if (!recipe) continue
    const span = recipeSpanDays(recipe)
    for (let o = 1; o < span; o++) {
      if ((s + o) % 7 === dayIndex) {
        return s
      }
    }
  }
  return null
}

/** Clear slots that are continuation days so each multi-day recipe only appears on its start day. */
export function normalizeCoveredSlots(
  slots: (string | null)[],
  recipesById: Record<string, Recipe>,
): (string | null)[] {
  const next = [...slots]
  for (let d = 0; d < 7; d++) {
    if (findContinuationStartDay(d, next, recipesById) !== null) {
      next[d] = null
    }
  }
  return next
}

/** Normalize saved slots so unknown recipe ids are cleared (removed recipes). */
export function mergePlanWithCatalog(
  recipesById: Record<string, Recipe>,
): WeekPlan {
  const saved = loadPlan()
  const next = emptyPlan()
  let changed = false
  for (let i = 0; i < 7; i++) {
    const id = saved.slots[i]
    const valid = id && recipesById[id] ? id : null
    next.slots[i] = valid
    if (valid !== id) changed = true
  }
  const normalized = normalizeCoveredSlots(next.slots, recipesById)
  for (let i = 0; i < 7; i++) {
    if (normalized[i] !== next.slots[i]) {
      changed = true
      next.slots[i] = normalized[i]
    }
  }
  if (changed) savePlan(next)
  return next
}
