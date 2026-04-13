---
id: FD-0001
title: Week planner multi-day continuation behavior
status: accepted
date: 2026-04-13
area: week-planner
personas: [home-cook]
related_adrs: []
supersedes: null
superseded_by: null
---

# FD-0001: Week planner multi-day continuation behavior

## Summary

The week planner should make multi-day recipes easy to understand and prevent accidental double-planning. When a recipe spans multiple days, users assign it once on the start day, and covered days are automatically shown as already planned.

## Functional description

When a recipe with `days > 1` is selected on a day:

- The selected day is the only editable slot that stores the recipe id.
- Covered days are treated as continuation days and are not separately assignable.
- Continuation-day dropdowns are disabled and display an "Already planned" state.
- Continuation-day content indicates which day the recipe started on.
- Coverage wraps across the week boundary (for example, Sunday to Monday).
- Saved plans are normalized so continuation days do not keep independent recipe ids.

Non-goals:

- Introducing separate split-meal modeling per day.
- Supporting multiple overlapping recipes in one day slot.

## Decisions

- Multi-day planning is anchored to a single explicit start day chosen by the user.
- Covered days are represented as derived UI state rather than independent plan entries.
- Week coverage uses cyclic day math, so week-end placement behaves consistently.
- The planner favors prevention of conflicting edits by disabling continuation day selectors.

## Open questions

- Should continuation-day labels include recipe name in addition to start day?
- Should the planner support explicit "override continuation" behavior for exceptions?

## References

- `site/src/App.tsx`
- `site/src/lib/weekPlan.ts`
- `site/src/lib/weekPlan.test.ts`
