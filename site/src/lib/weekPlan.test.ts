import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  DAY_LABELS,
  findContinuationStartDay,
  formatIngredientLine,
  mergePlanWithCatalog,
  normalizeCoveredSlots,
  recipeCalendarDayLabels,
  recipeOptionLabel,
  weekdayOrder,
} from './weekPlan'
import type { Recipe } from '../types/recipe'
import * as weekPlanStorage from './weekPlanStorage'

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'test-recipe',
    name: 'Test',
    days: 1,
    ingredients: [],
    ...overrides,
  }
}

describe('recipeOptionLabel', () => {
  it('includes day suffix when days is a positive number', () => {
    expect(recipeOptionLabel(makeRecipe({ name: 'Soup', days: 3 }))).toBe(
      'Soup — 3 days',
    )
  })

  it('uses singular day for one day', () => {
    expect(recipeOptionLabel(makeRecipe({ name: 'Soup', days: 1 }))).toBe(
      'Soup — 1 day',
    )
  })

  it('omits suffix when days is not positive', () => {
    expect(recipeOptionLabel(makeRecipe({ name: 'Soup', days: 0 }))).toBe(
      'Soup',
    )
  })
})

describe('formatIngredientLine', () => {
  it('returns empty string when item is missing', () => {
    expect(formatIngredientLine({ amount: '1', unit: 'cup' })).toBe('')
  })

  it('formats amount, unit, and item', () => {
    expect(
      formatIngredientLine({ item: 'flour', amount: '2', unit: 'cups' }),
    ).toBe('2 cups flour')
  })

  it('formats item only when no amount or unit', () => {
    expect(formatIngredientLine({ item: 'salt' })).toBe('salt')
  })
})

describe('recipeCalendarDayLabels', () => {
  it('returns empty array for null recipe', () => {
    expect(recipeCalendarDayLabels(null, 0)).toEqual([])
  })

  it('covers multiple days from start index', () => {
    const recipe = makeRecipe({ days: 3 })
    expect(recipeCalendarDayLabels(recipe, 0)).toEqual([
      'Monday',
      'Tuesday',
      'Wednesday',
    ])
  })

  it('wraps from Sunday into Monday', () => {
    const recipe = makeRecipe({ days: 5 })
    expect(recipeCalendarDayLabels(recipe, 5)).toEqual([
      'Saturday',
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
    ])
  })

  it('defaults invalid days to a single day', () => {
    expect(recipeCalendarDayLabels(makeRecipe({ days: 0 }), 2)).toEqual([
      'Wednesday',
    ])
  })
})

describe('findContinuationStartDay', () => {
  it('returns the start day index for continuation rows', () => {
    const recipesById: Record<string, Recipe> = {
      curry: makeRecipe({ id: 'curry', days: 3 }),
    }
    const slots = ['curry', null, null, null, null, null, null]
    expect(findContinuationStartDay(1, slots, recipesById)).toBe(0)
    expect(findContinuationStartDay(2, slots, recipesById)).toBe(0)
    expect(findContinuationStartDay(0, slots, recipesById)).toBeNull()
  })

  it('supports Sunday to Monday continuation', () => {
    const recipesById: Record<string, Recipe> = {
      roast: makeRecipe({ id: 'roast', days: 2 }),
    }
    const slots = [null, null, null, null, null, null, 'roast']
    expect(findContinuationStartDay(0, slots, recipesById)).toBe(6)
  })
})

describe('normalizeCoveredSlots', () => {
  it('clears slots that are covered by earlier multi-day recipes', () => {
    const recipesById: Record<string, Recipe> = {
      stew: makeRecipe({ id: 'stew', days: 3 }),
      salad: makeRecipe({ id: 'salad', days: 1 }),
    }
    const slots = ['stew', 'salad', 'salad', null, null, null, null]
    expect(normalizeCoveredSlots(slots, recipesById)).toEqual([
      'stew',
      null,
      null,
      null,
      null,
      null,
      null,
    ])
  })

  it('clears Monday when covered by a Sunday multi-day recipe', () => {
    const recipesById: Record<string, Recipe> = {
      soup: makeRecipe({ id: 'soup', days: 2 }),
      omelette: makeRecipe({ id: 'omelette', days: 1 }),
    }
    const slots = ['omelette', null, null, null, null, null, 'soup']
    expect(normalizeCoveredSlots(slots, recipesById)).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
      'soup',
    ])
  })
})

describe('DAY_LABELS', () => {
  it('has seven weekday labels starting Monday', () => {
    expect(DAY_LABELS).toEqual([
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ])
  })
})

describe('weekdayOrder', () => {
  it('returns Monday-first order for index 0', () => {
    expect(weekdayOrder(0)).toEqual([0, 1, 2, 3, 4, 5, 6])
  })

  it('returns Tuesday-first order for index 1', () => {
    expect(weekdayOrder(1)).toEqual([1, 2, 3, 4, 5, 6, 0])
  })

  it('normalizes out-of-range indexes', () => {
    expect(weekdayOrder(8)).toEqual([1, 2, 3, 4, 5, 6, 0])
  })
})

describe('mergePlanWithCatalog', () => {
  const catalog: Record<string, Recipe> = {
    'kept-id': makeRecipe({ id: 'kept-id', name: 'Kept', days: 2 }),
  }

  beforeEach(() => {
    vi.spyOn(weekPlanStorage, 'loadPlan').mockReturnValue({
      slots: ['kept-id', 'missing-id', null, null, null, null, null],
    })
    vi.spyOn(weekPlanStorage, 'savePlan').mockImplementation(() => {})
    vi.spyOn(weekPlanStorage, 'emptyPlan').mockReturnValue({
      slots: [null, null, null, null, null, null, null],
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('keeps ids that exist in the catalog', () => {
    const plan = mergePlanWithCatalog(catalog)
    expect(plan.slots[0]).toBe('kept-id')
  })

  it('clears unknown ids and persists when changed', () => {
    mergePlanWithCatalog(catalog)
    expect(weekPlanStorage.savePlan).toHaveBeenCalledWith(
      expect.objectContaining({
        slots: ['kept-id', null, null, null, null, null, null],
      }),
    )
  })

  it('clears continuation slots and persists normalized plan', () => {
    vi.mocked(weekPlanStorage.loadPlan).mockReturnValue({
      slots: ['kept-id', 'kept-id', null, null, null, null, null],
    })
    mergePlanWithCatalog(catalog)
    expect(weekPlanStorage.savePlan).toHaveBeenCalledWith(
      expect.objectContaining({
        slots: ['kept-id', null, null, null, null, null, null],
      }),
    )
  })
})
