import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import RecipeSubmitPage from './RecipeSubmitPage'

describe('RecipeSubmitPage', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    cleanup()
    vi.stubGlobal('fetch', originalFetch)
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('submits a recipe and renders PR link', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ pullRequestUrl: 'https://github.com/acme/sous-chef/pull/77' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    render(<RecipeSubmitPage />)

    fireEvent.change(screen.getByLabelText('Recipe id'), {
      target: { value: 'tomato-soup' },
    })
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Tomato soup' },
    })
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
      expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    })

    const [url, init] = vi.mocked(globalThis.fetch).mock.calls[0]
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
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: 'duplicate id' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    render(<RecipeSubmitPage />)
    fireEvent.change(screen.getByLabelText('Recipe id'), {
      target: { value: 'tomato-soup' },
    })
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Tomato soup' },
    })
    fireEvent.change(screen.getByLabelText('Ingredient 1 name'), {
      target: { value: 'tomatoes' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Create pull request' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('duplicate id')
  })
})
