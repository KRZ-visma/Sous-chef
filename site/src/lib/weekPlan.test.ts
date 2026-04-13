import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  DAY_LABELS,
  formatIngredientLine,
  mergePlanWithCatalog,
  recipeCalendarDayLabels,
  recipeOptionLabel,
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

  it('does not extend past Sunday', () => {
    const recipe = makeRecipe({ days: 5 })
    expect(recipeCalendarDayLabels(recipe, 5)).toEqual(['Saturday', 'Sunday'])
  })

  it('defaults invalid days to a single day', () => {
    expect(recipeCalendarDayLabels(makeRecipe({ days: 0 }), 2)).toEqual([
      'Wednesday',
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

describe('mergePlanWithCatalog', () => {
  const catalog: Record<string, Recipe> = {
    'kept-id': makeRecipe({ id: 'kept-id', name: 'Kept' }),
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
})
