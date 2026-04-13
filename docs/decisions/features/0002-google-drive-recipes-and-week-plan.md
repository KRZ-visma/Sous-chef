---
id: FD-0002
title: Google sign-in and Drive-backed recipes and week plan
status: accepted
date: 2026-04-13
area: week-planner
personas: [home-cook]
related_adrs: []
supersedes: null
superseded_by: null
---

# FD-0002: Google sign-in and Drive-backed recipes and week plan

## Summary

When the app is configured with a Google OAuth client id and a Drive folder id, users can sign in with Google and load recipe JSON from that folder instead of the bundled sample data. The week plan can sync to a `week-plan.json` file in the same folder so planning follows the user across browsers when they use the same Google account and folder.

## Functional description

- If Drive integration env vars are **not** set, behavior stays the same as before: bundled recipes from `site/public/data/recipes/` and week plan in `localStorage` only.
- If Drive integration **is** set, the first screen asks the user to **Sign in with Google** or **Use sample recipes (offline)**.
- After Google sign-in, the app requests **Drive** access: read the folder contents, and create or update `week-plan.json` via the restricted `drive.file` scope (plus `drive.readonly` for listing and downloading recipe JSON).
- The week plan is still stored in **localStorage** for responsiveness, keyed by Google user id when signed in; changes are **written to** `week-plan.json` on Drive when possible.
- Users can **sign out of Google** to clear the session and return to the recipe source choice.

Non-goals:

- Server-side OAuth or storing refresh tokens outside the browser session.
- Sharing one Drive folder between multiple users with conflict resolution beyond last-write-wins for the week plan file.

## Decisions

- Recipe source choice (Google vs bundled) is remembered for the browser session only (`sessionStorage`).
- Drive folder contents mirror the static site layout (`_index.json` plus one JSON file per recipe id).
- Week plan sync uses a single file name (`week-plan.json`) in that folder.

## Open questions

- Whether to add a “sync now” control or background refresh for the week plan file when it changes elsewhere.

## References

- Google Identity Services (sign-in) and Google Drive API v3 (file list and media download/upload).
