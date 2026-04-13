import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isGoogleDriveConfigured } from './lib/googleDriveConfig'
import {
  loadGoogleIdentityScript,
  parseUserFromCredential,
  requestDriveAccess,
} from './lib/googleDrive'
import { loadBundledRecipes, loadRecipesFromDrive } from './lib/loadRecipes'
import {
  DAY_LABELS,
  findContinuationStartDay,
  formatIngredientLine,
  mergePlanWithCatalog,
  normalizeCoveredSlots,
  recipeOptionLabel,
} from './lib/weekPlan'
import {
  emptyPlan,
  loadPlan,
  savePlan,
  type WeekPlan,
} from './lib/weekPlanStorage'
import { loadWeekPlanFromDrive, saveWeekPlanToDrive } from './lib/weekPlanDrive'
import {
  clearGoogleSession,
  readGoogleSession,
  saveGoogleAccess,
  saveGoogleCredential,
} from './lib/googleSession'
import type { Recipe } from './types/recipe'
import './App.css'

const RECIPE_SOURCE_KEY = 'sous-chef:recipe-source'

type RecipeSource = 'bundled' | 'google'

function getRecipeSource(): RecipeSource | null {
  try {
    const v = sessionStorage.getItem(RECIPE_SOURCE_KEY)
    if (v === 'bundled' || v === 'google') return v
    return null
  } catch {
    return null
  }
}

function setRecipeSource(source: RecipeSource): void {
  sessionStorage.setItem(RECIPE_SOURCE_KEY, source)
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

export default function App() {
  const driveConfigured = isGoogleDriveConfigured()
  const needAuthChoice =
    driveConfigured && getRecipeSource() === null
  const [gateResolved, setGateResolved] = useState(() => !needAuthChoice)
  const [showGoogleButton, setShowGoogleButton] = useState(false)
  const googleButtonRef = useRef<HTMLDivElement>(null)

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [plan, setPlan] = useState<WeekPlan>(() => emptyPlan())
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(() => !needAuthChoice)
  const [statusMessage, setStatusMessage] = useState('')
  const [statusIsError, setStatusIsError] = useState(false)

  const [googleUserSub, setGoogleUserSub] = useState<string | undefined>()
  const [driveWeekPlanFileId, setDriveWeekPlanFileId] = useState<string | null>(
    null,
  )

  const recipesById = useMemo(() => {
    const map: Record<string, Recipe> = {}
    for (const r of recipes) {
      map[r.id] = r
    }
    return map
  }, [recipes])

  const setStatus = useCallback((message: string, isError: boolean) => {
    setStatusMessage(message)
    setStatusIsError(isError)
  }, [])

  const finishBundledLoad = useCallback(() => {
    setRecipeSource('bundled')
    setGateResolved(true)
    ;(async () => {
      try {
        const list = await loadBundledRecipes()
        const map: Record<string, Recipe> = {}
        for (const r of list) {
          map[r.id] = r
        }
        setRecipes(list)
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
        setLoading(false)
      }
    })()
  }, [])

  const finishGoogleLoad = useCallback(
    async (credential: string) => {
      const user = saveGoogleCredential(credential)
      if (!user) {
        setLoadError('Sign-in response was not valid.')
        setLoading(false)
        return
      }
      setGoogleUserSub(user.sub)
      try {
        let access = readGoogleSession()?.access
        if (!access) {
          const a = await requestDriveAccess()
          saveGoogleAccess(a)
          access = a
        }
        const list = await loadRecipesFromDrive(access.accessToken)
        const map: Record<string, Recipe> = {}
        for (const r of list) {
          map[r.id] = r
        }
        const { plan: drivePlan, fileId } = await loadWeekPlanFromDrive(
          access.accessToken,
        )
        setDriveWeekPlanFileId(fileId)
        setRecipes(list)
        setPlan(mergePlanWithCatalog(map, user.sub, drivePlan))
        setRecipeSource('google')
        setGateResolved(true)
        setStatusMessage(
          'Signed in. Your week plan syncs to Google Drive when you change it.',
        )
        setStatusIsError(false)
      } catch (err) {
        console.error(err)
        clearGoogleSession()
        setGoogleUserSub(undefined)
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Something went wrong loading from Google Drive.'
        setLoadError(message)
        setStatusMessage('')
        setStatusIsError(false)
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const resumeGoogleSession = useCallback(async () => {
    const session = readGoogleSession()
    if (!session?.credential) return false
    const user = parseUserFromCredential(session.credential)
    if (!user) {
      clearGoogleSession()
      return false
    }
    setLoading(true)
    setLoadError(null)
    setGoogleUserSub(user.sub)
    try {
      let access = session.access
      if (!access) {
        const a = await requestDriveAccess()
        saveGoogleAccess(a)
        access = a
      }
      const list = await loadRecipesFromDrive(access.accessToken)
      const map: Record<string, Recipe> = {}
      for (const r of list) {
        map[r.id] = r
      }
      const { plan: drivePlan, fileId } = await loadWeekPlanFromDrive(
        access.accessToken,
      )
      setDriveWeekPlanFileId(fileId)
      setRecipes(list)
      setPlan(mergePlanWithCatalog(map, user.sub, drivePlan))
      setGateResolved(true)
      setStatusMessage(
        'Signed in. Your week plan syncs to Google Drive when you change it.',
      )
      setStatusIsError(false)
      return true
    } catch (err) {
      console.error(err)
      clearGoogleSession()
      setGoogleUserSub(undefined)
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Something went wrong loading from Google Drive.'
      setLoadError(message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!driveConfigured) {
      finishBundledLoad()
      return
    }
    const src = getRecipeSource()
    if (src === 'bundled') {
      finishBundledLoad()
      return
    }
    if (src === 'google') {
      void resumeGoogleSession().then((ok) => {
        if (!ok) {
          setGateResolved(false)
          setLoading(false)
        }
      })
      return
    }
    setLoading(false)
  }, [driveConfigured, finishBundledLoad, resumeGoogleSession])

  useEffect(() => {
    if (!showGoogleButton || !googleButtonRef.current) return
    const el = googleButtonRef.current
    const clientId = import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID?.trim()
    if (!clientId) return
    let cancelled = false
    void loadGoogleIdentityScript().then(() => {
      if (cancelled || !el.isConnected) return
      const g = window.google
      if (!g?.accounts?.id) return
      el.replaceChildren()
      g.accounts.id.initialize({
        client_id: clientId,
        callback: (resp) => {
          if (!resp.credential) return
          setLoading(true)
          setLoadError(null)
          void finishGoogleLoad(resp.credential)
        },
        auto_select: false,
      })
      g.accounts.id.renderButton(el, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
      })
    })
    return () => {
      cancelled = true
    }
  }, [showGoogleButton, finishGoogleLoad])

  const persistPlan = useCallback(
    (normalized: WeekPlan) => {
      savePlan(normalized, googleUserSub)
      if (!googleUserSub || getRecipeSource() !== 'google') return
      const session = readGoogleSession()
      const access = session?.access
      if (!access) {
        setStatus(
          'Drive access expired. Use “Sign out of Google” and sign in again.',
          true,
        )
        return
      }
      void saveWeekPlanToDrive(access.accessToken, driveWeekPlanFileId, normalized)
        .then(({ fileId }) => {
          setDriveWeekPlanFileId(fileId)
        })
        .catch((err: unknown) => {
          const msg =
            err instanceof Error && err.message
              ? err.message
              : 'Could not save week plan to Drive.'
          setStatus(msg, true)
        })
    },
    [googleUserSub, driveWeekPlanFileId, setStatus],
  )

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
        const normalized: WeekPlan = { slots: normalizedSlots }
        persistPlan(normalized)
        return normalized
      })
      setStatus('Week plan saved.', false)
    },
    [setStatus, recipesById, persistPlan],
  )

  const handleClearWeek = useCallback(() => {
    const cleared = emptyPlan()
    savePlan(cleared, googleUserSub)
    setPlan(cleared)
    if (googleUserSub && getRecipeSource() === 'google') {
      const session = readGoogleSession()
      const access = session?.access
      if (access) {
        void saveWeekPlanToDrive(access.accessToken, driveWeekPlanFileId, cleared)
          .then(({ fileId }) => setDriveWeekPlanFileId(fileId))
          .catch((err: unknown) => {
            const msg =
              err instanceof Error && err.message
                ? err.message
                : 'Could not clear week on Drive.'
            setStatus(msg, true)
          })
      }
    }
    setStatus('Week cleared.', false)
  }, [googleUserSub, driveWeekPlanFileId, setStatus])

  const handleSignOutGoogle = useCallback(() => {
    clearGoogleSession()
    setGoogleUserSub(undefined)
    setDriveWeekPlanFileId(null)
    sessionStorage.removeItem(RECIPE_SOURCE_KEY)
    setRecipes([])
    setPlan(loadPlan())
    setGateResolved(false)
    setShowGoogleButton(false)
    setLoadError(null)
    setStatusMessage('')
    setLoading(false)
  }, [])

  if (!gateResolved && driveConfigured) {
    return (
      <main>
        <h1>Week plan</h1>
        <p className="lede">
          Recipe data can load from your Google Drive folder (same layout as the
          built-in sample files) or you can use the sample recipes bundled with
          this app.
        </p>
        <div className="auth-gate">
          {!showGoogleButton ? (
            <button
              type="button"
              className="auth-gate__primary"
              onClick={() => setShowGoogleButton(true)}
            >
              Sign in with Google
            </button>
          ) : (
            <div className="auth-gate__google">
              <div ref={googleButtonRef} className="auth-gate__google-btn" />
              <p className="auth-gate__hint">
                You will be asked to allow Google Drive access so the app can
                load your recipe JSON and save your week plan to the folder.
              </p>
            </div>
          )}
          <button
            type="button"
            className="auth-gate__secondary"
            onClick={() => {
              setLoading(true)
              setLoadError(null)
              finishBundledLoad()
            }}
          >
            Use sample recipes (offline)
          </button>
        </div>
        {loadError ? (
          <p className="error" role="alert">
            {loadError}
          </p>
        ) : null}
      </main>
    )
  }

  if (loading) {
    return (
      <main>
        <h1>Week plan</h1>
        <p className="lede">
          {driveConfigured && getRecipeSource() === 'google'
            ? 'Loading recipes and your week plan from Google Drive…'
            : 'Pick a recipe for each day. Your plan is saved in this browser only (localStorage).'}
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
          Pick a recipe for each day. Your plan is saved in this browser (
          <code>localStorage</code>
          {getRecipeSource() === 'google' ? ', and synced to Drive when signed in' : ''}
          ).
        </p>
        <p className="error" role="alert">
          {loadError}
        </p>
        {getRecipeSource() === 'google' ? (
          <div className="toolbar">
            <button type="button" onClick={handleSignOutGoogle}>
              Sign out of Google
            </button>
          </div>
        ) : null}
      </main>
    )
  }

  const lede =
    getRecipeSource() === 'google'
      ? 'Pick a recipe for each day. Your plan is saved in this browser and synced to a week-plan file on Google Drive when you change it.'
      : 'Pick a recipe for each day. Your plan is saved in this browser only (localStorage).'

  return (
    <main>
      <h1>Week plan</h1>
      <p className="lede">{lede}</p>

      <div id="app">
        <div className="week" role="list">
          {DAY_LABELS.map((dayLabel, dayIndex) => {
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
        {getRecipeSource() === 'google' ? (
          <button type="button" onClick={handleSignOutGoogle}>
            Sign out of Google
          </button>
        ) : null}
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
