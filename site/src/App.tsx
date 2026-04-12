import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadRecipes } from './lib/loadRecipes'
import {
  DAY_LABELS,
  formatIngredientLine,
  mergePlanWithCatalog,
  recipeCalendarDayLabels,
  recipeOptionLabel,
} from './lib/weekPlan'
import { emptyPlan, loadPlan, savePlan, type WeekPlan } from './lib/weekPlanStorage'
import type { Recipe } from './types/recipe'
import './App.css'

function DayIngredients({
  recipe,
  dayIndex,
}: {
  recipe: Recipe | null
  dayIndex: number
}) {
  if (!recipe) {
    return null
  }
  const dayLabels = recipeCalendarDayLabels(recipe, dayIndex)
  const ings = recipe.ingredients

  return (
    <>
      {dayLabels.length > 0 && (
        <p className="recipe-covers">
          Covers: {dayLabels.join(', ')}
        </p>
      )}
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

export default function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [plan, setPlan] = useState<WeekPlan>(() => loadPlan())
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState('')
  const [statusIsError, setStatusIsError] = useState(false)

  const recipesById = useMemo(() => {
    const map: Record<string, Recipe> = {}
    for (const r of recipes) {
      map[r.id] = r
    }
    return map
  }, [recipes])

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
        savePlan(next)
        return next
      })
      setStatus('Week plan saved on this device.', false)
    },
    [setStatus],
  )

  const handleClearWeek = useCallback(() => {
    const cleared = emptyPlan()
    savePlan(cleared)
    setPlan(cleared)
    setStatus('Week cleared.', false)
  }, [setStatus])

  if (loading) {
    return (
      <main>
        <h1>Week plan</h1>
        <p className="lede">
          Pick a recipe for each day. Your plan is saved in this browser only (
          <code>localStorage</code>).
        </p>
        <p id="loading">Loading recipes…</p>
      </main>
    )
  }

  if (loadError) {
    return (
      <main>
        <h1>Week plan</h1>
        <p className="lede">
          Pick a recipe for each day. Your plan is saved in this browser only (
          <code>localStorage</code>).
        </p>
        <p className="error" role="alert">
          {loadError}
        </p>
      </main>
    )
  }

  return (
    <main>
      <h1>Week plan</h1>
      <p className="lede">
        Pick a recipe for each day. Your plan is saved in this browser only (
        <code>localStorage</code>).
      </p>

      <div id="app">
        <div className="week" role="list">
          {DAY_LABELS.map((dayLabel, dayIndex) => {
            const selectedId = plan.slots[dayIndex]
            const recipe =
              selectedId && recipesById[selectedId] ? recipesById[selectedId] : null
            return (
              <div
                key={dayLabel}
                className="day-column"
                role="listitem"
              >
                <div className="day-label">{dayLabel}</div>
                <select
                  aria-label={`${dayLabel} meal`}
                  value={selectedId ?? ''}
                  onChange={(e) =>
                    handleSlotChange(dayIndex, e.target.value)
                  }
                >
                  <option value="">— No recipe —</option>
                  {recipes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {recipeOptionLabel(r)}
                    </option>
                  ))}
                </select>
                <div className="ingredients-wrap">
                  <DayIngredients recipe={recipe} dayIndex={dayIndex} />
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
      <p
        className={`status${statusIsError ? ' error' : ''}`}
        aria-live="polite"
      >
        {statusMessage}
      </p>
    </main>
  )
}
