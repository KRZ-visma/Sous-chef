# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Sous-chef is currently a scaffolding-only repo: a static HTML placeholder page under `site/` deployed to GitHub Pages. There is no build step, no `package.json`, no dependencies, and no test suite yet. See `docs/tech.md` for the planned TypeScript + BDD stack and project conventions.

### Running the site locally

Serve `site/` with any static file server. Example:

```
cd site && python3 -m http.server 8080
```

Then open `http://localhost:8080/`.

### Lint / Test / Build

No lint, test, or build tooling is configured yet. When TypeScript tooling is added, update this section accordingly.

### Deployment

Merges to `main` auto-deploy `site/` to GitHub Pages via `.github/workflows/pages-deploy.yml`. PRs get the site folder uploaded as a CI artifact for manual review (`.github/workflows/pages-pr-verify.yml`).
