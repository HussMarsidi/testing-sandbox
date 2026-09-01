# Frontend Testing Plan

This document is the source of truth for how we test frontend work in the
feedback sandbox and, later, in the real codebase.

## Goal

Prove one small feature can move through every layer — unit, feature, e2e, and
CI — without hand-waving. The app is throwaway. The plumbing is not.

## The feature under test

1. **Submit feedback** — name, email, category, message.
2. **View complaints** — list everything the backend has stored.

Both flows share one API contract (`backend/openapi.json`).

## The three layers

Each behavior lives in exactly one layer.

| Layer | What it proves | Backend | Speed |
|-------|----------------|---------|-------|
| Unit | Pure logic in `src/lib/validators.ts` | None | Fastest |
| Feature | Real UI, user-visible states | MSW fake | Fast |
| E2e | One critical journey end-to-end | Real Hono + SQLite | Slowest |

### Unit

- Location: `frontend/tests/unit/`
- Target: `frontend/src/lib/validators.ts`
- No DOM, no network, no React.
- Good for validation rules, formatting helpers, and other pure functions.

### Feature

- Location: `frontend/tests/feature/`
- Uses Testing Library + Vitest + MSW.
- Fake backend: `frontend/tests/mocks/handlers.ts`
- Covers success and forced error paths.
- This is where most coverage should live.

### E2e

- Location: `frontend/tests/e2e/`
- Uses Playwright with the real backend and real SQLite.
- Keep this to one critical flow:
  submit feedback → see success → open complaints page → see the new row.

## The contract bridge

1. Backend routes are defined with Zod via `@hono/zod-openapi`.
2. `npm run generate:openapi` in `backend/` writes `backend/openapi.json`.
3. `npm run generate:types` in `frontend/` writes `frontend/src/types/api.ts`.
4. MSW handlers, API client code, and components all use those generated types.

**Never hand-edit `frontend/src/types/api.ts`.** Regenerate it from the spec.

If the backend changes shape, TypeScript should fail before tests do.

## AI guardrail

AI should not mark its own homework.

1. A human writes the visible acceptance contract first:
   labels, button text, success/error copy.
2. That contract lives in `frontend/src/lib/validators.ts` as `COPY`.
3. The trusted test is `frontend/tests/feature/feedback-form.acceptance.test.tsx`.
4. AI may add more tests, but only the human-written acceptance test is trusted.

For this POC, the copy is placeholder human-approved text so we can exercise the
pipeline before the real product copy lands.

## Commands

```bash
# backend
cd backend && npm install && npm run dev

# frontend
cd frontend && npm install && npm run dev

# fast tests (unit + feature, fake backend)
cd frontend && npm test

# slow test (real backend + sqlite)
cd frontend && npm run test:e2e
```

## CI gate

`.github/workflows/ci.yml` runs on every pull request:

1. Regenerate `backend/openapi.json` and fail if it drifted.
2. Regenerate frontend types and build the app.
3. Run backend tests.
4. Run frontend unit + feature tests.
5. Run the one Playwright e2e flow.

Nothing merges red.

## What belongs where

```
frontend/
├── src/lib/validators.ts      # pure logic + visible COPY contract
├── src/types/api.ts           # generated — do not edit
├── tests/unit/                # validators only
├── tests/feature/             # UI + MSW (bulk of coverage)
├── tests/e2e/                 # one real-browser flow
└── tests/mocks/handlers.ts    # fake backend
```

## Adding a new API

1. Add the route and Zod schema in `backend/src/`.
2. Regenerate and commit `backend/openapi.json`.
3. Regenerate `frontend/src/types/api.ts`.
4. Update MSW handlers to match.
5. Add feature tests with the fake backend.
6. Extend e2e only if the flow is business-critical.
