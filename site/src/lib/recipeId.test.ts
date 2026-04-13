import { describe, expect, it } from 'vitest'
import { nextAvailableRecipeId, slugifyRecipeName } from './recipeId'

describe('slugifyRecipeName', () => {
  it('creates kebab-case ids from recipe names', () => {
    expect(slugifyRecipeName('  Spicy Chickpea Stew  ')).toBe('spicy-chickpea-stew')
  })

  it('removes punctuation and repeated separators', () => {
    expect(slugifyRecipeName('Tomato & Basil!!! Soup')).toBe('tomato-basil-soup')
  })
})

describe('nextAvailableRecipeId', () => {
  it('returns base id when no collision exists', () => {
    expect(nextAvailableRecipeId('Tomato Soup', ['lentil-soup'])).toBe('tomato-soup')
  })

  it('appends numeric suffixes to avoid collisions', () => {
    expect(
      nextAvailableRecipeId('Tomato Soup', ['tomato-soup', 'tomato-soup-2']),
    ).toBe('tomato-soup-3')
  })
})
