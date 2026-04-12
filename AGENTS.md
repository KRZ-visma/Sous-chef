# AGENTS.md

## Cursor Cloud specific instructions

### Overview

The web app under `site/` is a **Vite + React + TypeScript** single-page app. Static recipe JSON ships under `site/public/data/recipes/` and is fetched at runtime. See `docs/tech.md` for conventions and the planned BDD workflow.

### Running the site locally

```
cd site && npm install && npm run dev
```

Then open the URL Vite prints (typically `http://localhost:5173/`).

### Lint / Test / Build

- **Lint:** `cd site && npm run lint`
- **Production build:** `cd site && npm run build` (output in `site/dist/`)
- **Preview production build:** `cd site && npm run preview`

No automated test suite is wired up yet.

### Deployment

Merges to `main` build `site/` and deploy **`site/dist/`** to GitHub Pages via `.github/workflows/pages-deploy.yml`. PRs upload the built **`site/dist/`** folder as a CI artifact for manual review (`.github/workflows/pages-pr-verify.yml`).
