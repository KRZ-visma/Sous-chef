# Work tracking

## In-repo backlog

Use this folder when you want **lightweight, text-based** planning that lives next to the code:

- **[`backlog.md`](./backlog.md)** — ordered list of upcoming work with enough context for a human or agent to pick up an item.

Prefer **one issue per substantial task** in GitHub when you need discussion, assignment, or CI linkage. You can mirror or summarize GitHub issues in `backlog.md` with links.

## GitHub Projects vs this folder

| Use GitHub Projects when… | Use `docs/work/` when… |
|---------------------------|-------------------------|
| You want a board, assignees, and due dates across many repos. | You want a single file or short list editable in PRs without leaving the repo. |
| Work spans milestones and needs roll-up views. | You want agents to read one path (`docs/work/backlog.md`) with minimal API setup. |

**Practical split:** keep **canonical narrative and priorities** in `backlog.md` (or linked ADRs/features), and use **GitHub Projects** for execution tracking if the team already lives there. Link Project cards to issues; link issues to decision docs when useful.

## Suggested item shape

In `backlog.md`, each entry can follow:

- **ID:** `W-001` (optional)
- **Goal:** one line
- **Scope / out of scope:** bullets
- **Links:** related `ADR-*`, `FD-*`, or GitHub issue URL
