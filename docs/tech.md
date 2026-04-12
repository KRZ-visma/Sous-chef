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

## Commit style
- Message format: `<domain>/<component>: <intent of change>`.
- Focus the summary on why the change matters, not mechanical details.
- Keep commits scoped to one completed red/green/refactor cycle.

## Branching strategy
- Feature-flow: cut a new `feature/<name>` branch for every upcoming capability.
- Rebase or merge from main frequently to keep the feature branch fresh.
- **Open a GitHub pull request only when the feature is ready for review**—after the work is complete enough to merge, not after the first commit on the branch. Prefer local commits (or draft PRs only if your team explicitly uses them) until you are ready for human review.

## Recipe data (static)
- **Location:** **`site/data/recipes/`** — one **`{id}.json`** file per recipe (kebab-case `id`), deployed with the site. See **`site/data/recipes/README.md`** and **`docs/decisions/technical/0001-recipe-json-storage.md`** for shape and rationale.

## Deployment (GitHub Pages)
- The static placeholder site lives under **`site/`** and deploys automatically via **`.github/workflows/pages-deploy.yml`** when changes are **merged to `main`**.
- In the GitHub repo: **Settings → Pages → Build and deployment**, set the source to **GitHub Actions** (not “Deploy from a branch”) so the workflow can publish the artifact.

## Reviewing changes before merge
- **PR workflow:** **`.github/workflows/pages-pr-verify.yml`** runs on pull requests targeting `main`, builds nothing extra for now, and uploads the **`site/`** folder as a **workflow artifact**. Reviewers open the PR’s **Checks** tab → the workflow run → **Artifacts**, download the zip, and open `index.html` locally to sanity-check the static output before approving.
- **Public preview URLs for every PR** are not part of this repo’s default setup. GitHub Pages normally publishes from `main` only. If you need a shareable URL per PR, add a preview host (for example Netlify or Vercel pull-request previews) or a community Pages preview action; document whichever you adopt here.

## Feature catalog
- Maintain a living list of released and upcoming features here.
- Use concise bullet notes; include current status (planned, in progress, done).
- Example:
  - `auth/login`: planned — capture Persona A login flow.
- For **behavior, rationale, and functional decisions**, add or link records under **`docs/decisions/features/`** (see **`docs/decisions/README.md`**). Technical trade-offs belong in **`docs/decisions/technical/`** (ADR-style templates in **`docs/decisions/templates/`**).

## Planning and new work
- **`docs/work/backlog.md`** — lightweight in-repo backlog (good for agents and PR-friendly edits).
- **GitHub Projects** — optional; use when you need assignees, boards, and cross-repo views. See **`docs/work/README.md`** for when to use which.
