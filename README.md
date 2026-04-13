# Sous-chef

Project scaffolding lives in `docs/tech.md`, covering the TypeScript + Cursor stack, BDD workflow, commit rules, branching model, and the growing feature list. **Decision records** (technical ADRs and feature decisions) live under `docs/decisions/`; **backlog and work tracking** guidance is in `docs/work/`.

**Week planner:** the meal-planning UI is the React app under [`site/`](site/README.md). Run `cd site && npm install && npm run dev` and open the URL Vite prints (typically `http://localhost:5173/`). With GitHub Pages enabled for this repository, the built app is served at `https://<your-github-username-or-org>.github.io/Sous-chef/` (the [`base`](site/vite.config.ts) path is `/Sous-chef/` in CI builds).