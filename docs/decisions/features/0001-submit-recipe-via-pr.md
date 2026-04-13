---
id: FD-0001
title: Submit new recipes through pull requests
status: accepted
date: 2026-04-13
area: recipe-catalog
personas: [maintainer, contributor]
related_adrs: [ADR-0003]
supersedes: null
superseded_by: null
---

# FD-0001: Submit new recipes through pull requests

## Summary

Users can add a recipe from the web app using a form, and successful submission opens a pull request containing the new recipe JSON file and catalog index update.

## Functional description

The system should provide an "Add recipe" page where users can enter id, name, days covered, and ingredient rows.

- The id must be kebab-case and unique in the catalog.
- Submission validates required fields and shows useful validation or server errors.
- On success, the UI displays the created pull request URL so users can review and share it.
- The created change set includes both `{id}.json` and `_index.json` updates.

## Decisions

- Keep recipe submission separate from week planning using a dedicated route/page.
- Return actionable API errors (e.g., duplicate id, configuration missing) directly to users.
- Treat pull request creation as the completion point for submission (not auto-merge).

## Open questions

- Should we require authentication and identity in the submit UI for moderated workflows?
- Should the form support optional metadata (e.g., tags, instructions) in a future schema revision?

## References

- `site/src/pages/RecipeSubmitPage.tsx`
- `site/api/submit-recipe.ts`
- `site/server/recipePr.ts`
- ADR-0003
