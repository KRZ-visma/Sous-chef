import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { loadRecipes } from '../lib/loadRecipes'
import { nextAvailableRecipeId, slugifyRecipeName } from '../lib/recipeId'
import type { Recipe, RecipeIngredient } from '../types/recipe'

type IngredientRow = {
  key: string
  item: string
  amount: string
  unit: string
}

function emptyIngredientRow(): IngredientRow {
  return {
    key: crypto.randomUUID(),
    item: '',
    amount: '',
    unit: '',
  }
}

function submitRecipeUrl(): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${base}/api/submit-recipe`
}

export default function RecipeSubmitPage() {
  const [id, setId] = useState('')
  const [name, setName] = useState('')
  const [idEditedManually, setIdEditedManually] = useState(false)
  const [existingIds, setExistingIds] = useState<Set<string>>(() => new Set())
  const [days, setDays] = useState('1')
  const [ingredients, setIngredients] = useState<IngredientRow[]>(() => [
    emptyIngredientRow(),
  ])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prUrl, setPrUrl] = useState<string | null>(null)
  const normalizedId = useMemo(() => slugifyRecipeName(id), [id])
  const idCollision = useMemo(
    () => normalizedId.length > 0 && existingIds.has(normalizedId),
    [existingIds, normalizedId],
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const recipes = await loadRecipes()
        if (cancelled) return
        setExistingIds(new Set(recipes.map((r) => r.id)))
      } catch {
        // Keep form usable even if recipes cannot be fetched right now.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (idEditedManually) return
    setId(nextAvailableRecipeId(name, existingIds))
  }, [existingIds, idEditedManually, name])

  const canSubmit = useMemo(() => {
    return (
      normalizedId.length > 0 &&
      !idCollision &&
      name.trim().length > 0 &&
      days.trim().length > 0 &&
      ingredients.some((r) => r.item.trim().length > 0)
    )
  }, [normalizedId, idCollision, name, days, ingredients])

  const addIngredient = useCallback(() => {
    setIngredients((prev) => [...prev, emptyIngredientRow()])
  }, [])

  const removeIngredient = useCallback((key: string) => {
    setIngredients((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((r) => r.key !== key)
    })
  }, [])

  const updateIngredient = useCallback(
    (key: string, patch: Partial<Omit<IngredientRow, 'key'>>) => {
      setIngredients((prev) =>
        prev.map((r) => (r.key === key ? { ...r, ...patch } : r)),
      )
    },
    [],
  )

  const buildRecipe = useCallback((): Recipe => {
    const d = Number.parseInt(days, 10)
    const rows = ingredients
      .filter((r) => r.item.trim().length > 0)
      .map((r): RecipeIngredient => {
        const ing: RecipeIngredient = { item: r.item.trim() }
        if (r.amount.trim()) ing.amount = r.amount.trim()
        if (r.unit.trim()) ing.unit = r.unit.trim()
        return ing
      })
    return {
      id: normalizedId,
      name: name.trim(),
      days: d,
      ingredients: rows,
    }
  }, [normalizedId, name, days, ingredients])

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      setError(null)
      setPrUrl(null)
      setSubmitting(true)
      try {
        const recipe = buildRecipe()
        const res = await fetch(submitRecipeUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipe }),
        })
        const data = (await res.json()) as {
          error?: string
          pullRequestUrl?: string
        }
        if (!res.ok) {
          setError(data.error ?? `Request failed (${res.status})`)
          return
        }
        if (data.pullRequestUrl) {
          setPrUrl(data.pullRequestUrl)
        } else {
          setError('Unexpected response from server.')
        }
      } catch {
        setError(
          'Could not reach the submission service. On GitHub Pages, host an API that forwards to GitHub (see project setup) or run locally with Vite and env vars configured.',
        )
      } finally {
        setSubmitting(false)
      }
    },
    [buildRecipe],
  )

  return (
    <main className="submit-page">
      <h1>Add a recipe</h1>
      <p className="lede">
        Submit a recipe as a pull request against this repository. The id must be
        unique and use kebab-case (for example <code>my-tomato-soup</code>).
      </p>

      <form className="recipe-form" onSubmit={handleSubmit}>
        <div className="field-row">
          <label htmlFor="recipe-id">Recipe id</label>
          <input
            id="recipe-id"
            name="id"
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="e.g. spicy-chickpea-stew"
            value={id}
            onChange={(e) => {
              setIdEditedManually(true)
              setId(e.target.value)
            }}
            required
          />
          {id && id !== normalizedId && (
            <p className="status">
              Will submit as <code>{normalizedId}</code>.
            </p>
          )}
          {idCollision && (
            <p className="error" role="alert">
              Recipe id collision: <code>{normalizedId}</code> already exists.
            </p>
          )}
        </div>
        <div className="field-row">
          <label htmlFor="recipe-name">Name</label>
          <input
            id="recipe-name"
            name="name"
            type="text"
            value={name}
            onChange={(e) => {
              const next = e.target.value
              setName(next)
            }}
            required
          />
        </div>
        <div className="field-row field-row--narrow">
          <label htmlFor="recipe-days">Days covered</label>
          <input
            id="recipe-days"
            name="days"
            type="number"
            min={1}
            step={1}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            required
          />
        </div>

        <fieldset className="ingredients-fieldset">
          <legend>Ingredients</legend>
          {ingredients.map((row, index) => (
            <div key={row.key} className="ingredient-row">
              <div className="ingredient-fields">
                <input
                  aria-label={`Ingredient ${index + 1} name`}
                  placeholder="Item"
                  value={row.item}
                  onChange={(e) =>
                    updateIngredient(row.key, { item: e.target.value })
                  }
                />
                <input
                  aria-label={`Ingredient ${index + 1} amount`}
                  className="ing-amount"
                  placeholder="Amount"
                  value={row.amount}
                  onChange={(e) =>
                    updateIngredient(row.key, { amount: e.target.value })
                  }
                />
                <input
                  aria-label={`Ingredient ${index + 1} unit`}
                  className="ing-unit"
                  placeholder="Unit"
                  value={row.unit}
                  onChange={(e) =>
                    updateIngredient(row.key, { unit: e.target.value })
                  }
                />
              </div>
              <button
                type="button"
                className="btn-remove-ing"
                onClick={() => removeIngredient(row.key)}
                disabled={ingredients.length <= 1}
                aria-label={`Remove ingredient ${index + 1}`}
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" className="btn-secondary" onClick={addIngredient}>
            Add ingredient
          </button>
        </fieldset>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {prUrl && (
          <p className="success" role="status">
            Pull request opened:{' '}
            <a href={prUrl} rel="noreferrer">
              {prUrl}
            </a>
          </p>
        )}

        <div className="toolbar">
          <button type="submit" disabled={submitting || !canSubmit}>
            {submitting ? 'Creating pull request…' : 'Create pull request'}
          </button>
        </div>
      </form>
    </main>
  )
}
