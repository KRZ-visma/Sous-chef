---
id: FD-0002
title: Weekly shopping checklist from the week plan
status: accepted
date: 2026-04-13
area: week-planner
personas: [home-cook]
related_adrs: []
supersedes: null
superseded_by: null
---

# FD-0002: Weekly shopping checklist from the week plan

## Summary

Users planning a full week of meals need a single place to see everything they must buy, and to track progress while checking the pantry and shopping. The app provides a weekly shopping list derived from the selected recipes, with separate marks for items already at home versus items placed in the shopping basket.

## Functional description

- The shopping list is **derived** from the current week plan: every recipe assigned to a day contributes its ingredients (respecting multi-day recipes only on their start day, consistent with FD-0001).
- Ingredient lines are shown in a readable form (amount, unit, item). Identical lines may be **merged** into one row with a count of how many times they appear across the week.
- Each row offers **two independent** controls:
  - **In stock** — the user already has enough at home for this week’s plan.
  - **In basket** — the user has put the item in the cart while shopping.
- Checking either box is optional and does not remove the line; both can be used in whatever order fits the user’s workflow.
- Checklist state is **persisted on this device** together with the week plan (same browser storage scope as the plan).
- **Clear week** resets planned meals and clears shopping checklist state for a clean start.

Non-goals:

- Unit conversion or smart merging of different amounts of the same ingredient (for example, “2 cups” plus “1 cup” of flour).
- Sync across devices or accounts.
- Barcode scanning or store-specific inventory.

## Decisions

- Shopping is a **weekly aggregate view** tied to the planner, not a separate recipe-by-recipe shopping mode.
- **Stock** and **basket** are separate dimensions so users can distinguish pantry checks from in-store progress.
- Persistence matches the week plan: **local-only** storage with no implied backup or sharing.

## Open questions

- Should clearing a single day’s recipe partially reset checklist rows that only applied to that day, or is full-week reset sufficient?
- Should “in stock” automatically imply “in basket” for shopping trips, or stay fully independent?

## References

- `docs/decisions/features/0001-week-planner-multi-day-continuation.md`
- `site/src/App.tsx`
- `site/src/lib/weekPlan.ts`
- `site/src/lib/weekPlanStorage.ts`
