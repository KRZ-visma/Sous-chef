import { describe, it, expect, beforeEach } from 'vitest'
import {
  emptyPlan,
  loadPlan,
  parseWeekPlanJson,
  savePlan,
} from './weekPlanStorage'

const STORAGE_KEY = 'sous-chef:week-plan:v1'

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

    it('uses a separate storage key per Google user sub', () => {
      savePlan(
        { slots: ['a', null, null, null, null, null, null] },
        'user-1',
      )
      expect(loadPlan('user-1').slots[0]).toBe('a')
      expect(loadPlan().slots.every((s) => s === null)).toBe(true)
    })
  })

  describe('parseWeekPlanJson', () => {
    it('parses valid week plan JSON', () => {
      const p = parseWeekPlanJson(
        JSON.stringify({ slots: ['x', null, null, null, null, null, null] }),
      )
      expect(p?.slots[0]).toBe('x')
    })

    it('returns null for invalid JSON', () => {
      expect(parseWeekPlanJson('not json')).toBeNull()
    })
  })
})
