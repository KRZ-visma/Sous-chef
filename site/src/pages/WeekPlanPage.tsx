import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { loadRecipes } from '../lib/loadRecipes'
import {
  DAY_LABELS,
  findContinuationStartDay,
  formatIngredientLine,
  mergePlanWithCatalog,
  normalizeCoveredSlots,
  recipeOptionLabel,
  weekdayOrder,
} from '../lib/weekPlan'
import {
  emptyPlan,
  loadFirstDayOfWeekIndex,
  loadPlan,
  savePlan,
  type WeekPlan,
} from '../lib/weekPlanStorage'
import type { Recipe } from '../types/recipe'

type ShoppingEntry = {
  key: string
  line: string
  uses: number
}

function ingredientKey(line: string): string {
  return line.trim().replace(/\s+/g, ' ').toLowerCase()
}

function DayIngredients({ recipe }: { recipe: Recipe | null }) {
  if (!recipe) {
    return null
  }
  const ings = recipe.ingredients

  return (
    <>
      {!Array.isArray(ings) || ings.length === 0 ? (
        <p className="ingredients-empty">No ingredients listed.</p>
      ) : (
        (() => {
          const lines = ings
            .map((ing) => formatIngredientLine(ing))
            .filter(Boolean)
          if (lines.length === 0) {
            return <p className="ingredients-empty">No ingredients listed.</p>
          }
          return (
            <ul className="ingredients">
              {lines.map((line, i) => (
                <li key={`${i}-${line}`}>{line}</li>
              ))}
            </ul>
          )
        })()
      )}
    </>
  )
}

export default function WeekPlanPage() {
  const location = useLocation()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [plan, setPlan] = useState<WeekPlan>(() => loadPlan())
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState('')
  const [statusIsError, setStatusIsError] = useState(false)
  const [firstDayIndex, setFirstDayIndex] = useState(() =>
    loadFirstDayOfWeekIndex(),
  )

  useEffect(() => {
    setFirstDayIndex(loadFirstDayOfWeekIndex())
  }, [location.pathname, location.key])

  const recipesById = useMemo(() => {
    const map: Record<string, Recipe> = {}
    for (const r of recipes) {
      map[r.id] = r
    }
    return map
  }, [recipes])

  const shoppingEntries = useMemo(() => {
    const byKey = new Map<string, ShoppingEntry>()
    for (let dayIndex = 0; dayIndex < DAY_LABELS.length; dayIndex++) {
      const selectedId = plan.slots[dayIndex]
      if (!selectedId) continue
      const recipe = recipesById[selectedId]
      if (!recipe) continue
      for (const ingredient of recipe.ingredients) {
        const line = formatIngredientLine(ingredient)
        if (!line) continue
        const key = ingredientKey(line)
        const existing = byKey.get(key)
        if (existing) {
          existing.uses += 1
        } else {
          byKey.set(key, { key, line, uses: 1 })
        }
      }
    }
    return Array.from(byKey.values()).sort((a, b) =>
      a.line.localeCompare(b.line),
    )
  }, [plan.slots, recipesById])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await loadRecipes()
        if (cancelled) return
        setRecipes(list)
        const map: Record<string, Recipe> = {}
        for (const r of list) {
          map[r.id] = r
        }
        setPlan(mergePlanWithCatalog(map))
        setStatusMessage('Week plan loaded. Changes save automatically.')
        setStatusIsError(false)
      } catch (err) {
        console.error(err)
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Something went wrong loading recipes.'
        setLoadError(message)
        setStatusMessage('')
        setStatusIsError(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const setStatus = useCallback((message: string, isError: boolean) => {
    setStatusMessage(message)
    setStatusIsError(isError)
  }, [])

  const handleSlotChange = useCallback(
    (dayIndex: number, recipeId: string) => {
      setPlan((prev) => {
        const next: WeekPlan = {
          slots: [...prev.slots],
        }
        next.slots[dayIndex] = recipeId || null
        const normalizedSlots = normalizeCoveredSlots(
          next.slots,
          recipesById,
        )
        const normalized: WeekPlan = {
          slots: normalizedSlots,
          shopping: prev.shopping,
        }
        savePlan(normalized)
        return normalized
      })
      setStatus('Week plan saved on this device.', false)
    },
    [setStatus, recipesById],
  )

  const handleClearWeek = useCallback(() => {
    const cleared = emptyPlan()
    savePlan(cleared)
    setPlan(cleared)
    setStatus('Week cleared.', false)
  }, [setStatus])

  const handleShoppingToggle = useCallback(
    (ingredientId: string, field: 'inStock' | 'inBasket', checked: boolean) => {
      setPlan((prev) => {
        const current = prev.shopping[ingredientId] ?? {
          inStock: false,
          inBasket: false,
        }
        const nextShopping = {
          ...prev.shopping,
          [ingredientId]: {
            ...current,
            [field]: checked,
          },
        }
        const next: WeekPlan = {
          slots: prev.slots,
          shopping: nextShopping,
        }
        savePlan(next)
        return next
      })
      setStatus('Shopping checklist saved on this device.', false)
    },
    [setStatus],
  )

  const dayOrder = useMemo(() => weekdayOrder(firstDayIndex), [firstDayIndex])

  if (loading) {
    return (
      <>
        <h1>Week plan</h1>
        <p className="lede">
          Pick a recipe for each day. Your plan is saved in this browser only (
          <code>localStorage</code>).
        </p>
        <p id="loading">Loading recipes…</p>
      </>
    )
  }

  if (loadError) {
    return (
      <>
        <h1>Week plan</h1>
        <p className="lede">
          Pick a recipe for each day. Your plan is saved in this browser only (
          <code>localStorage</code>).
        </p>
        <p className="error" role="alert">
          {loadError}
        </p>
      </>
    )
  }

  return (
    <>
      <h1>Week plan</h1>
      <p className="lede">
        Pick a recipe for each day. Your plan is saved in this browser only (
        <code>localStorage</code>).
      </p>

      <div id="app">
        <div className="week" role="list">
          {dayOrder.map((dayIndex) => {
            const dayLabel = DAY_LABELS[dayIndex]
            const selectedId = plan.slots[dayIndex]
            const recipe =
              selectedId && recipesById[selectedId] ? recipesById[selectedId] : null
            const continuationFrom = findContinuationStartDay(
              dayIndex,
              plan.slots,
              recipesById,
            )
            const isContinuation = continuationFrom !== null
            return (
              <div
                key={dayLabel}
                className={`day-column${isContinuation ? ' day-column--continuation' : ''}`}
                role="listitem"
              >
                <div className="day-label">{dayLabel}</div>
                <select
                  aria-label={`${dayLabel} meal`}
                  value={isContinuation ? '' : (selectedId ?? '')}
                  disabled={isContinuation}
                  onChange={(e) =>
                    handleSlotChange(dayIndex, e.target.value)
                  }
                >
                  <option value="">
                    {isContinuation ? 'Already planned' : '— No recipe —'}
                  </option>
                  {!isContinuation &&
                    recipes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {recipeOptionLabel(r)}
                      </option>
                    ))}
                </select>
                <div className="ingredients-wrap">
                  {isContinuation ? (
                    <p className="already-planned">
                      Already planned — continues from{' '}
                      {DAY_LABELS[continuationFrom]}.
                    </p>
                  ) : (
                    <DayIngredients recipe={recipe} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="toolbar">
        <button type="button" id="clear-plan" onClick={handleClearWeek}>
          Clear week
        </button>
      </div>

      <section className="shopping" aria-labelledby="shopping-list-heading">
        <h2 id="shopping-list-heading">Weekly shopping list</h2>
        {shoppingEntries.length === 0 ? (
          <p className="ingredients-empty">
            Pick recipes to generate your shopping overview.
          </p>
        ) : (
          <ul className="shopping-list">
            {shoppingEntries.map((entry) => {
              const state = plan.shopping[entry.key] ?? {
                inStock: false,
                inBasket: false,
              }
              return (
                <li key={entry.key} className="shopping-item">
                  <div className="shopping-item__line">
                    <span>{entry.line}</span>
                    {entry.uses > 1 ? (
                      <span className="shopping-item__uses">
                        Used {entry.uses} times
                      </span>
                    ) : null}
                  </div>
                  <label>
                    <input
                      type="checkbox"
                      checked={state.inStock}
                      onChange={(e) =>
                        handleShoppingToggle(entry.key, 'inStock', e.target.checked)
                      }
                    />{' '}
                    In stock
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={state.inBasket}
                      onChange={(e) =>
                        handleShoppingToggle(entry.key, 'inBasket', e.target.checked)
                      }
                    />{' '}
                    In basket
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <p
        className={`status${statusIsError ? ' error' : ''}`}
        aria-live="polite"
      >
        {statusMessage}
      </p>
    </>
  )
}
