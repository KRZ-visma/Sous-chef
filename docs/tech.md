# Project Guide

## Tech stack
- TypeScript everywhere; no mixed-language islands.
- Built and iterated inside Cursor, so responses favor concise clarity over perfect grammar.
- Deploy target is a single GitHub Pages site—lightweight hosting, no extra infra.

## Programming style
- Behavior-driven development with the red → green → refactor cadence.
- Each cycle ends with a commit before starting the next slice of behavior.
- Specs describe intent in business terms first, wiring follows afterward.

## Commit style
- Message format: `<domain>/<component>: <intent of change>`.
- Focus the summary on why the change matters, not mechanical details.
- Keep commits scoped to one completed red/green/refactor cycle.

## Branching strategy
- Feature-flow: cut a new `feature/<name>` branch for every upcoming capability.
- Rebase or merge from main frequently to keep the feature branch fresh.
- Open pull requests only when the feature branch already reflects a full BDD cycle.

## Feature catalog
- Maintain a living list of released and upcoming features here.
- Use concise bullet notes; include current status (planned, in progress, done).
- Example:
  - `auth/login`: planned — capture Persona A login flow.
