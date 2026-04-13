import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { loadBundledRecipes } from './loadRecipes'

function requestUrl(input: string | URL | Request): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.href
  return input.url
}

describe('loadBundledRecipes', () => {
  const originalFetch = globalThis.fetch
  const originalBase = import.meta.env.BASE_URL

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        const url = requestUrl(input)
        if (url.endsWith('/data/recipes/_index.json')) {
          return new Response(JSON.stringify({ recipes: ['b-id', 'a-id'] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        if (url.includes('/data/recipes/a-id.json')) {
          return new Response(
            JSON.stringify({
              id: 'a-id',
              name: 'Alpha',
              days: 1,
              ingredients: [],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }
        if (url.includes('/data/recipes/b-id.json')) {
          return new Response(
            JSON.stringify({
              id: 'b-id',
              name: 'Bravo',
              days: 2,
              ingredients: [],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }
        return new Response('Not found', { status: 404 })
      }) as typeof fetch,
    )
  })

  afterEach(() => {
    vi.stubGlobal('fetch', originalFetch)
    import.meta.env.BASE_URL = originalBase
    vi.unstubAllGlobals()
  })

  it('loads recipes from the index and sorts by name', async () => {
    import.meta.env.BASE_URL = '/'
    const recipes = await loadBundledRecipes()
    expect(recipes.map((r) => r.id)).toEqual(['a-id', 'b-id'])
  })

  it('prefixes requests with BASE_URL', async () => {
    import.meta.env.BASE_URL = '/my-repo/'
    await loadBundledRecipes()
    const fetchMock = vi.mocked(globalThis.fetch)
    const urls = fetchMock.mock.calls.map((c) => String(c[0]))
    expect(urls.some((u) => u.includes('/my-repo/data/recipes/_index.json'))).toBe(
      true,
    )
  })

  it('throws when the index request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('err', { status: 500 })) as typeof fetch,
    )
    await expect(loadBundledRecipes()).rejects.toThrow(
      'Could not load recipe list.',
    )
  })

  it('throws when the index has no recipes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        const url = requestUrl(input)
        if (url.includes('_index.json')) {
          return new Response(JSON.stringify({ recipes: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return new Response('Not found', { status: 404 })
      }) as typeof fetch,
    )
    await expect(loadBundledRecipes()).rejects.toThrow('Recipe list is empty.')
  })

  it('throws when a recipe file is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        const url = requestUrl(input)
        if (url.includes('_index.json')) {
          return new Response(JSON.stringify({ recipes: ['only'] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return new Response('Not found', { status: 404 })
      }) as typeof fetch,
    )
    await expect(loadBundledRecipes()).rejects.toThrow(
      'Missing recipe file for "only".',
    )
  })

  it('throws when recipe id does not match file', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        const url = requestUrl(input)
        if (url.includes('_index.json')) {
          return new Response(JSON.stringify({ recipes: ['x'] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        if (url.includes('x.json')) {
          return new Response(
            JSON.stringify({
              id: 'wrong',
              name: 'X',
              days: 1,
              ingredients: [],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }
        return new Response('Not found', { status: 404 })
      }) as typeof fetch,
    )
    await expect(loadBundledRecipes()).rejects.toThrow(
      'Recipe id mismatch for "x".',
    )
  })
})
