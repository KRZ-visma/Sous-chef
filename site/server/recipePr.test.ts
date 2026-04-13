import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  resolveGithubRepo,
  resolveGithubToken,
  validateRecipeForSubmit,
} from './recipePr'

describe('validateRecipeForSubmit', () => {
  it('accepts valid payload and trims fields', () => {
    const recipe = validateRecipeForSubmit({
      id: 'chickpea-stew',
      name: '  Chickpea stew  ',
      days: 2,
      ingredients: [
        { item: ' onion ' },
        { item: 'chickpeas', amount: '2', unit: 'cans' },
      ],
    })

    expect(recipe).toEqual({
      id: 'chickpea-stew',
      name: 'Chickpea stew',
      days: 2,
      ingredients: [
        { item: 'onion' },
        { item: 'chickpeas', amount: '2', unit: 'cans' },
      ],
    })
  })

  it('rejects non-kebab ids', () => {
    expect(() =>
      validateRecipeForSubmit({
        id: 'Bad Id',
        name: 'Soup',
        days: 1,
        ingredients: [{ item: 'salt' }],
      }),
    ).toThrow('Recipe id must be kebab-case')
  })

  it('rejects unknown top-level fields', () => {
    expect(() =>
      validateRecipeForSubmit({
        id: 'ok-id',
        name: 'Soup',
        days: 1,
        ingredients: [{ item: 'salt' }],
        notes: 'extra',
      }),
    ).toThrow('Unknown fields on recipe')
  })

  it('rejects extra ingredient fields', () => {
    expect(() =>
      validateRecipeForSubmit({
        id: 'ok-id',
        name: 'Soup',
        days: 1,
        ingredients: [{ item: 'salt', x: 'extra' }],
      }),
    ).toThrow('Ingredients may only include item, amount, and unit.')
  })
})

describe('GitHub env resolution', () => {
  const oldRepo = process.env.RECIPE_SUBMIT_REPO
  const oldGithubRepo = process.env.GITHUB_REPOSITORY
  const oldSubmitToken = process.env.RECIPE_SUBMIT_TOKEN
  const oldGithubToken = process.env.GITHUB_TOKEN
  const oldGhToken = process.env.GH_TOKEN

  beforeEach(() => {
    vi.unstubAllEnvs()
    delete process.env.RECIPE_SUBMIT_REPO
    delete process.env.GITHUB_REPOSITORY
    delete process.env.RECIPE_SUBMIT_TOKEN
    delete process.env.GITHUB_TOKEN
    delete process.env.GH_TOKEN
  })

  afterEach(() => {
    process.env.RECIPE_SUBMIT_REPO = oldRepo
    process.env.GITHUB_REPOSITORY = oldGithubRepo
    process.env.RECIPE_SUBMIT_TOKEN = oldSubmitToken
    process.env.GITHUB_TOKEN = oldGithubToken
    process.env.GH_TOKEN = oldGhToken
    vi.unstubAllEnvs()
  })

  it('prefers RECIPE_SUBMIT_REPO over GITHUB_REPOSITORY', () => {
    process.env.RECIPE_SUBMIT_REPO = 'acme/recipes'
    process.env.GITHUB_REPOSITORY = 'other/repo'
    expect(resolveGithubRepo()).toEqual({ owner: 'acme', repo: 'recipes' })
  })

  it('returns null for malformed repo env', () => {
    process.env.RECIPE_SUBMIT_REPO = 'invalid-repo'
    expect(resolveGithubRepo()).toBeNull()
  })

  it('resolves token using fallback order', () => {
    process.env.GH_TOKEN = 'gh-token'
    expect(resolveGithubToken()).toBe('gh-token')

    process.env.GITHUB_TOKEN = 'github-token'
    expect(resolveGithubToken()).toBe('github-token')

    process.env.RECIPE_SUBMIT_TOKEN = 'submit-token'
    expect(resolveGithubToken()).toBe('submit-token')
  })
})
