---
id: ADR-0002
title: Use Google Drive as initial user storage
status: accepted
date: 2026-04-13
tags: [storage, google-drive, frontend-only, weekplans, images]
deciders: []
consulted: []
informed: []
supersedes: null
superseded_by: null
---

# ADR-0002: Use Google Drive as initial user storage

## Context

The project currently runs as a static Vite + React site and avoids backend infrastructure. Upcoming data needs include user-managed week plans and potentially recipe pictures. Usage is expected to remain small in the near term, and the team can use a shared Google account so recipes and week plans are easy to share. We need a first storage approach that can be adopted quickly without introducing a backend service or committing to a larger data platform before real usage constraints are known.

## Decision

1. Use **Google Drive** as the initial storage backend for user data.
2. Access Google Drive directly from the frontend after Google sign-in.
3. For the initial phase, allow use of a shared Google account to simplify shared access to recipes and week plans.
4. Keep this as a pragmatic first step focused on low setup overhead and minimal tooling decisions for a small user base.
5. Re-evaluate and move to **Firebase** if Drive-based storage causes product or technical friction.

## Consequences

### Positive

- No custom backend is required for the first implementation.
- No immediate commitment to a new database platform is needed.
- Users can authenticate with Google and store their own app data quickly.
- Shared recipes and week plans are simple to coordinate when using one shared account.

### Negative / risks

- Google Drive is file storage, not a database; querying and consistency are limited.
- Concurrent edits and conflict handling may become complex as usage grows.
- File/folder management and API quota behavior can add maintenance overhead.
- A shared account reduces individual ownership and can create access/security management trade-offs.

### Follow-ups

- Define a small set of migration triggers (for example: sync conflicts, query limitations, or performance pain).
- If triggers are reached, move storage to **Firebase** (Firestore + Storage) as the next step.
- Keep data model boundaries clear so migration from Drive files to Firebase records is straightforward.

## Alternatives considered

- **Firebase now:** Rejected for now to avoid introducing new infrastructure before real issues appear.
- **Supabase now:** Rejected for now for the same reason; defer platform choice until scaling constraints are observed.
