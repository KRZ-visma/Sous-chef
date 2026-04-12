---
id: ADR-0001
title: Store recipes as JSON files under the static site
status: accepted
date: 2026-04-12
tags: [recipes, static-site, data]
deciders: []
consulted: []
informed: []
supersedes: null
superseded_by: null
---

# ADR-0001: Store recipes as JSON files under the static site

## Context

Sous-chef targets a **static GitHub Pages** deployment with **no database**. Recipes need a durable, reviewable format that works in Git and can be loaded in the browser. Weekly meal plans and aggregated shopping lists are **out of scope for this decision**; they can build on the same recipe files later.

## Decision

1. **Location:** Recipe files live under **`site/public/data/recipes/`** so Vite copies them to the site root at build time and they are available at predictable URLs on the same origin (for example `fetch("/data/recipes/<id>.json")` in development, or the same path relative to `import.meta.env.BASE_URL` when hosted under a subpath).
2. **Granularity:** **One file equals one recipe**, named **`{id}.json`** with kebab-case `id` matching the `id` field inside the file. This keeps diffs small and avoids editing a large single document.
3. **Format:** **JSON** (not YAML) so the browser can parse it without an extra dependency and tooling stays simple.
4. **Fields:** Each recipe has **`id`**, **`name`**, **`days`** (how many days the batch covers; typically 1 or 2), and **`ingredients`**.
5. **Ingredients:** Each ingredient is an object with required **`item`** and optional **`amount`** and **`unit`**, so lines can be as structured or as minimal as needed without a second representation.

## Consequences

### Positive

- No server or database; data ships with the static site.
- Git-friendly edits and clear ownership per recipe file.
- Optional **`amount`** / **`unit`** support shopping and scaling without forcing every line to be fully quantified.

### Negative / risks

- **Index maintenance:** The UI loads **`_index.json`** to discover recipe ids; it must stay in sync when files are added or removed.
- **No schema enforcement at runtime** until CI validates JSON against **`site/public/data/recipes/_schema.json`** (the project now has a build step; wiring validation is a follow-up).

### Follow-ups

- Add week plans and shopping aggregation on top of these files when ready.
- Wire CI or editor validation to `_schema.json` (optional hardening now that a build pipeline exists).

## Alternatives considered

- **Single `recipes.json` bundle:** Rejected for this phase because one-file-per-recipe yields smaller, clearer diffs and simpler parallel editing.
- **YAML front matter in Markdown:** Rejected because parsing YAML in the browser adds weight; JSON matches static-site constraints.
- **Ingredients as plain strings only:** Rejected because optional structured **`amount`** / **`unit`** improves shopping lists without requiring them on every line.
