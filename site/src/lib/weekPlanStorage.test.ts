import { describe, it, expect, beforeEach } from 'vitest'
import {
  emptyPlan,
  loadFirstDayOfWeekIndex,
  loadPlan,
  saveFirstDayOfWeekIndex,
  savePlan,
} from './weekPlanStorage'

const STORAGE_KEY = 'sous-chef:week-plan:v1'
const FIRST_DAY_STORAGE_KEY = 'sous-chef:first-day-of-week:v1'

describe('weekPlanStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('emptyPlan', () => {
    it('returns seven null slots', () => {
      const plan = emptyPlan()
      expect(plan.slots).toHaveLength(7)
      expect(plan.slots.every((s) => s === null)).toBe(true)
    })
  })

  describe('loadPlan / savePlan', () => {
    it('returns empty plan when storage is empty', () => {
      expect(loadPlan().slots).toEqual(emptyPlan().slots)
    })

    it('round-trips slot ids', () => {
      const plan = emptyPlan()
      plan.slots[0] = 'recipe-a'
      plan.slots[6] = 'recipe-b'
      savePlan(plan)
      expect(loadPlan().slots).toEqual(plan.slots)
    })

    it('maps empty string to null', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ slots: ['a', '', null, null, null, null, null] }),
      )
      expect(loadPlan().slots[1]).toBeNull()
    })

    it('pads short slot arrays with null', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ slots: ['only-one'] }))
      const slots = loadPlan().slots
      expect(slots[0]).toBe('only-one')
      expect(slots[6]).toBeNull()
    })

    it('truncates slots longer than seven', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          slots: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'extra'],
        }),
      )
      expect(loadPlan().slots).toHaveLength(7)
      expect(loadPlan().slots[6]).toBe('g')
    })

    it('returns empty plan for invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'not-json')
      expect(loadPlan().slots).toEqual(emptyPlan().slots)
    })

    it('returns empty plan when payload has no slots array', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({}))
      expect(loadPlan().slots).toEqual(emptyPlan().slots)
    })
  })

  describe('first day of week settings', () => {
    it('defaults to Monday when unset', () => {
      expect(loadFirstDayOfWeekIndex()).toBe(0)
    })

    it('round-trips first day index', () => {
      saveFirstDayOfWeekIndex(1)
      expect(loadFirstDayOfWeekIndex()).toBe(1)
    })

    it('normalizes out-of-range values', () => {
      saveFirstDayOfWeekIndex(8)
      expect(loadFirstDayOfWeekIndex()).toBe(1)
    })

    it('falls back to Monday for invalid stored values', () => {
      localStorage.setItem(FIRST_DAY_STORAGE_KEY, 'not-a-number')
      expect(loadFirstDayOfWeekIndex()).toBe(0)
    })
  })
})
