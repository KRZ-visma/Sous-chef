# Project Guide

Editor and agent context for this repo is configured under **`.cursor/rules`**. That file should **point here** rather than duplicate stack, workflow, or catalog content. When you edit this guide, update `.cursor/rules` in the same pass if anything Cursor-specific needs to change.

## Tech stack
- TypeScript everywhere; no mixed-language islands.
- Built and iterated inside Cursor, so responses favor concise clarity over perfect grammar.
- Deploy target is a single GitHub Pages site—lightweight hosting, no extra infra.

## Programming style
- Behavior-driven development with the red → green → refactor cadence.
- Each cycle ends with a commit before starting the next slice of behavior.
- Specs describe intent in business terms first, wiring follows afterward.

## Decision record policy (required)
- Any change that alters user-visible behavior, feature rules, architecture, data shape, integrations, or non-trivial technical constraints must include a decision record update in the same PR.
- Create a new decision record when introducing a new rule or trade-off. Update an existing record when clarifying, correcting, or superseding a prior decision.
- Feature behavior decisions belong in `docs/decisions/features/`. Technical and architecture decisions belong in `docs/decisions/technical/`.
- Use the templates in `docs/decisions/templates/` and keep status metadata accurate (`proposed`, `accepted`, `superseded`, etc.).
- If no decision record was needed, state why in the PR description so reviewers can verify the exception.

## Commit style
- Message format: `<domain>/<component>: <intent of change>`.
- Focus the summary on why the change matters, not mechanical details.
- Keep commits scoped to one completed red/green/refactor cycle.

## Branching strategy
- Feature-flow: cut a new `feature/<name>` branch for every upcoming capability.
- Rebase or merge from main frequently to keep the feature branch fresh.
- **Open a GitHub pull request only when the feature is ready for review**—after the work is complete enough to merge, not after the first commit on the branch. Prefer local commits (or draft PRs only if your team explicitly uses them) until you are ready for human review.

## Recipe data (static)
- **Location:** **`site/public/data/recipes/`** — one **`{id}.json`** file per recipe (kebab-case `id`), copied to the site root at build time and deployed with the app. See **`site/public/data/recipes/README.md`** and **`docs/decisions/technical/0001-recipe-json-storage.md`** for shape and rationale.

## Frontend (Vite + React + TypeScript)
- Source lives under **`site/src/`**. **`npm run dev`** runs the Vite dev server; **`npm run build`** emits static assets to **`site/dist/`** (this is what GitHub Pages publishes).

## Deployment (GitHub Pages)
- The app is built from **`site/`** (install, lint, **`npm run build`**) and **`.github/workflows/pages-deploy.yml`** publishes **`site/dist/`** when changes are **merged to `main`**.
- In the GitHub repo: **Settings → Pages → Build and deployment**, set the source to **GitHub Actions** (not “Deploy from a branch”) so the workflow can publish the artifact.

## Reviewing changes before merge
- **PR workflow:** **`.github/workflows/pages-pr-verify.yml`** runs on pull requests targeting `main`, runs **`npm ci`**, **`npm run lint`**, and **`npm run build`** in **`site/`**, and uploads **`site/dist/`** as a **workflow artifact**. Reviewers open the PR’s **Checks** tab → the workflow run → **Artifacts**, download the zip, and preview the built files locally (for example with **`npx vite preview`** pointed at the extracted **`dist/`**) before approving.
- **Public preview URLs for every PR** are not part of this repo’s default setup. GitHub Pages normally publishes from `main` only. If you need a shareable URL per PR, add a preview host (for example Netlify or Vercel pull-request previews) or a community Pages preview action; document whichever you adopt here.

## Feature catalog
- Maintain a living list of released and upcoming features here.
- Use concise bullet notes; include current status (planned, in progress, done).
- `google-drive/recipes`: done — optional sign-in and folder-backed recipes and week plan (see `docs/decisions/features/0002-google-drive-recipes-and-week-plan.md`).
- Example:
  - `auth/login`: planned — capture Persona A login flow.
- For **behavior, rationale, and functional decisions**, add or link records under **`docs/decisions/features/`** (see **`docs/decisions/README.md`**). Technical trade-offs belong in **`docs/decisions/technical/`** (ADR-style templates in **`docs/decisions/templates/`**). This is required whenever those decisions change.

## Planning and new work
- **`docs/work/backlog.md`** — lightweight in-repo backlog (good for agents and PR-friendly edits).
- **GitHub Projects** — optional; use when you need assignees, boards, and cross-repo views. See **`docs/work/README.md`** for when to use which.
