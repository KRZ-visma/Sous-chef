---
id: ADR-0002
title: Create recipe pull requests through a server-side API
status: accepted
date: 2026-04-13
tags: [frontend, github-api, deployment]
deciders: [team]
consulted: []
informed: []
supersedes: null
superseded_by: null
---

# ADR-0002: Create recipe pull requests through a server-side API

## Context

The app is deployed as static assets and now includes a recipe submission form. Submitting should create a pull request with a new recipe JSON file and update the recipe index. GitHub write APIs require credentials and are not safe to call directly from browser code.

## Decision

- Add a server-side endpoint (`POST /api/submit-recipe`) that validates recipe payloads, creates a branch, commits recipe/index changes, and opens a PR.
- Keep frontend code credential-free; browser code only posts recipe JSON to the endpoint.
- Share request handling logic between local Vite development middleware and serverless API handlers.

## Consequences

### Positive

- GitHub tokens remain server-side and are never exposed in browser bundles.
- Submission behavior is testable independently from UI rendering.
- Local development can exercise the same path as deployed API behavior.

### Negative / risks

- GitHub Pages alone cannot execute the API route; a serverless-capable host is required for production submission.
- API credentials need repository-scoped write permissions and secret management.

### Follow-ups

- Document deployment expectations and required environment variables for production hosts.
- Add rate limiting / abuse protections if anonymous public submissions are enabled.

## Alternatives considered

- **Browser calls directly to GitHub API:** rejected because it would expose write credentials or fail due to CORS/auth constraints.
- **Manual recipe editing only:** rejected because it does not satisfy the submit-from-app requirement.
