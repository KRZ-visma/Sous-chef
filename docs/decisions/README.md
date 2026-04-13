# Decisions

This folder holds **durable decisions** in two tracks. Use plain Markdown with **YAML front matter** so humans can review prose and tools (including AI agents) can parse stable metadata.

| Track | Folder | Purpose |
|--------|--------|---------|
| Technical | [`technical/`](./technical/) | Architecture, stack, trade-offs, constraints (ADR-style). |
| Features | [`features/`](./features/) | How the product should behave, user-facing rules, and why we chose them. |

## Conventions

- **Filenames:** `NNNN-short-kebab-title.md` with a four-digit sequence per folder (`0001`, `0002`, …). Feature records may prefix the id in front matter as `FD-0001`; technical records as `ADR-0001` (aligned with the filename number).
- **Status:** Keep `status` in front matter current. When replacing a decision, add a new file and mark the old one `superseded` with `superseded_by` pointing to the new id.
- **Templates:** Copy from [`templates/adr.md`](./templates/adr.md) or [`templates/feature-decision.md`](./templates/feature-decision.md).
- **Change gate:** If a PR changes product behavior, decision logic, architecture, or important constraints, it must include a corresponding decision record change in this directory.

## Relationship to other docs

- High-level stack and workflow stay in [`../tech.md`](../tech.md).
- The feature bullet list there remains a **short catalog**; expand behavior and rationale in `features/` when it matters.
