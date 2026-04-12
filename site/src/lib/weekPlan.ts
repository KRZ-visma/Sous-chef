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

export function recipeCalendarDayLabels(
  recipe: Recipe | null,
  startDayIndex: number,
): string[] {
  if (!recipe) return []
  const raw = recipe.days
  const span =
    typeof raw === 'number' && raw >= 1 ? Math.floor(raw) : 1
  const labels: string[] = []
  for (let o = 0; o < span && startDayIndex + o < 7; o++) {
    labels.push(DAY_LABELS[startDayIndex + o])
  }
  return labels
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
  if (changed) savePlan(next)
  return next
}
