import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import RecipeSubmitPage from './RecipeSubmitPage'

describe('RecipeSubmitPage', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
        const url = String(input)
        if (url.includes('/data/story-recipes/_index.json')) {
          return new Response(JSON.stringify({ recipes: ['existing-recipe'] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        if (url.includes('/data/story-recipes/existing-recipe.json')) {
          return new Response(
            JSON.stringify({
              id: 'existing-recipe',
              name: 'Existing Recipe',
              days: 1,
              ingredients: [{ item: 'salt' }],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }
        if (url.includes('/api/submit-recipe')) {
          if (!init) {
            return new Response(JSON.stringify({ error: 'missing request body' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            })
          }
          return new Response(
            JSON.stringify({
              pullRequestUrl: 'https://github.com/acme/sous-chef/pull/77',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }
        return new Response('Not found', { status: 404 })
      }) as typeof fetch,
    )
  })

  afterEach(() => {
    cleanup()
    vi.stubGlobal('fetch', originalFetch)
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('submits a recipe and renders PR link', async () => {
    render(<RecipeSubmitPage />)

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Tomato soup' },
    })
    await waitFor(() =>
      expect(screen.getByLabelText('Recipe id')).toHaveValue('tomato-soup'),
    )
    fireEvent.change(screen.getByLabelText('Days covered'), {
      target: { value: '2' },
    })
    fireEvent.change(screen.getByLabelText('Ingredient 1 name'), {
      target: { value: 'tomatoes' },
    })
    fireEvent.change(screen.getByLabelText('Ingredient 1 amount'), {
      target: { value: '6' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Create pull request' }))

    await waitFor(() => {
      expect(vi.mocked(globalThis.fetch).mock.calls.length).toBeGreaterThanOrEqual(3)
    })

    const submitCall = vi
      .mocked(globalThis.fetch)
      .mock.calls.find((c) => String(c[0]).includes('/api/submit-recipe'))
    expect(submitCall).toBeTruthy()
    const [url, init] = submitCall as [RequestInfo | URL, RequestInit]
    expect(String(url)).toContain('/api/submit-recipe')
    expect(init).toEqual(
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const payload = JSON.parse(String((init as RequestInit).body))
    expect(payload).toEqual({
      recipe: {
        id: 'tomato-soup',
        name: 'Tomato soup',
        days: 2,
        ingredients: [{ item: 'tomatoes', amount: '6' }],
      },
    })

    expect(
      await screen.findByRole('link', {
        name: 'https://github.com/acme/sous-chef/pull/77',
      }),
    ).toBeVisible()
  })

  it('shows API errors from failed responses', async () => {
    vi.mocked(globalThis.fetch).mockImplementation(
      async (input: string | URL | Request) => {
        const url = String(input)
        if (url.includes('/data/story-recipes/_index.json')) {
          return new Response(JSON.stringify({ recipes: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        if (url.includes('/api/submit-recipe')) {
          return new Response(JSON.stringify({ error: 'duplicate id' }), {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return new Response('Not found', { status: 404 })
      },
    )

    render(<RecipeSubmitPage />)
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Tomato soup' },
    })
    fireEvent.change(screen.getByLabelText('Ingredient 1 name'), {
      target: { value: 'tomatoes' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Create pull request' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('duplicate id')
  })

  it('shows collision warning when generated id already exists', async () => {
    vi.mocked(globalThis.fetch).mockImplementation(
      async (input: string | URL | Request) => {
        const url = String(input)
        if (url.includes('/data/story-recipes/_index.json')) {
          return new Response(JSON.stringify({ recipes: ['tomato-soup'] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        if (url.includes('/data/story-recipes/tomato-soup.json')) {
          return new Response(
            JSON.stringify({
              id: 'tomato-soup',
              name: 'Tomato soup',
              days: 1,
              ingredients: [{ item: 'salt' }],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }
        return new Response('Not found', { status: 404 })
      },
    )

    render(<RecipeSubmitPage />)
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Tomato soup' },
    })

    await waitFor(() =>
      expect(screen.getByLabelText('Recipe id')).toHaveValue('tomato-soup-2'),
    )
  })
})
