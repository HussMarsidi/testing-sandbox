# Frontend Testing

This project is a small sandbox for learning how frontend tests are layered,
what each layer is good for, and how they fit together with a real backend and
a fake one.

The app (feedback form, login, complaints list) is just enough surface area to
exercise the ideas. The interesting part is the testing setup around it.

---

## The testing pyramid

Most frontend projects benefit from three layers, from fast/narrow to slow/wide:

```
        ┌─────────┐
        │   E2E   │  few tests, real browser + real servers
        ├─────────┤
        │ Feature │  many tests, real UI + fake network
        ├─────────┤
        │  Unit   │  many tests, pure functions, no UI
        └─────────┘
```

Each layer answers a different question:

| Layer | Question it answers | In this repo |
|-------|---------------------|--------------|
| **Unit** | Does this pure logic behave correctly? | `frontend/tests/unit/` |
| **Feature** | Does the UI show the right thing to the user? | `frontend/tests/feature/` |
| **E2E** | Does the full system work together in a browser? | `frontend/tests/e2e/` |

You do not need every layer for every change. The idea is to pick the **smallest
layer that still gives you confidence** — and reach for a heavier layer only when
the lighter one cannot prove what you care about.

---

## Unit tests — logic without the UI

**Concept:** test functions that take data in and return data out. No React, no
DOM, no network. These run in milliseconds and pin down rules like validation,
formatting, and parsing.

**In this project:** `frontend/tests/unit/validators.test.ts` exercises
`validateComplaintForm()` in `src/lib/validators.ts`. It checks that valid input
passes, missing fields fail, and bad email / short messages produce the expected
error messages.

**When to reach for unit tests:** any time you have logic you could call from a
Node script without rendering a component.

---

## Feature tests — UI with a fake backend

**Concept:** render real components, interact like a user (click, type, select),
and assert on what appears on screen. Network calls are intercepted by
[MSW](https://mswjs.io/) (Mock Service Worker), so tests stay fast and you can
force failures (500 errors, empty lists, bad credentials) without standing up
infrastructure.

**In this project:**

- `tests/mocks/handlers.ts` — the fake API. Same routes as the real backend
  (`/api/categories`, `/api/complaints`, `/api/auth/login`), backed by in-memory
  state instead of SQLite.
- `tests/setup-msw.ts` — starts the MSW server before tests, resets handlers
  after each test.
- `tests/helpers/render.tsx` — wraps components with `QueryClientProvider`,
  `MemoryRouter`, and auth/routes where needed.
- `tests/feature/feedback-form.acceptance.test.tsx` — form labels, validation,
  success, and error states.
- `tests/feature/complaints-list.test.tsx` — protected route redirect, empty
  list, load errors, and a full submit → login → view flow.

Data fetching uses **React Query** (`src/lib/queries.ts`). Components call
hooks like `useCategories()` and `useComplaints()`; MSW satisfies those requests
in tests the same way a real server would in the browser.

**When to reach for feature tests:** most UI work — forms, lists, loading and
error states, routing, auth gates. This is usually where most of your coverage
lives.

---

## E2E tests — one real browser journey

**Concept:** open a real browser, hit the real frontend and backend, and walk
through a critical user path. Slower and flakier than feature tests, but they
catch wiring problems (proxy config, CORS, auth headers, database persistence)
that mocks cannot see.

**In this project:** `frontend/tests/e2e/feedback-flow.spec.ts` uses Playwright
to submit feedback, sign in, open the complaints page, and confirm the new row
is visible. Playwright config starts both servers automatically:

- Backend on `http://127.0.0.1:3001` (SQLite at `data/e2e-complaints.db`)
- Frontend on `http://127.0.0.1:5173`

**When to reach for E2E:** a small set of business-critical flows — not every
edge case. If feature tests already cover an error path with MSW, you usually
do not need to repeat it in E2E.

---

## Shared API types

The backend publishes an OpenAPI spec at `backend/openapi.json`. The frontend
generates TypeScript types from it:

```bash
cd backend && npm run generate:openapi
cd frontend && npm run generate:types   # writes src/types/api.ts
```

The API client (`src/lib/api.ts`), MSW handlers, and components all reference
those generated types. When the API shape changes, TypeScript surfaces mismatches
before tests run.

---

## Try it yourself

Install once:

```bash
cd backend && npm install
cd frontend && npm install
```

### 1. Unit + feature tests (fast, no servers needed)

```bash
cd frontend && npm test
```

Runs Vitest against `tests/unit/` and `tests/feature/`. MSW fakes every HTTP
call. Expect ~15 tests in a few seconds.

Watch mode while editing tests:

```bash
cd frontend && npm run test:watch
```

Run a single file:

```bash
cd frontend && npx vitest run tests/feature/complaints-list.test.tsx
```

### 2. E2E test (Playwright starts backend + frontend for you)

```bash
cd frontend && npm run test:e2e
```

Playwright launches Chromium, boots both servers, and runs the one flow in
`tests/e2e/`. First run may download browser binaries.

Run headed (see the browser):

```bash
cd frontend && npx playwright test --headed
```

### 3. Manual smoke test (optional)

If you want to click through the app yourself while developing:

```bash
# terminal 1
cd backend && npm run dev

# terminal 2
cd frontend && npm run dev
```

Open `http://localhost:5173`. Default login: `admin` / `password`.

### 4. CI (what runs on pull requests)

GitHub Actions (`.github/workflows/ci.yml`) runs backend tests, regenerates and
builds the frontend, runs `npm test`, then `npm run test:e2e`. Same commands as
above, in sequence, on every PR.

---

## Where things live

```
frontend/
├── src/
│   ├── lib/
│   │   ├── validators.ts     pure logic (unit test target)
│   │   ├── api.ts            HTTP helpers
│   │   └── queries.ts        React Query hooks
│   └── types/api.ts          generated from OpenAPI
└── tests/
    ├── unit/                 Vitest, no DOM
    ├── feature/              Vitest + Testing Library + MSW
    ├── e2e/                  Playwright + real servers
    ├── mocks/handlers.ts     fake backend
    └── helpers/              shared render/auth/form utilities
```

---

## Choosing a layer (cheat sheet)

| You changed… | Start with… |
|--------------|-------------|
| Validation rules or copy constants | Unit |
| Form behavior, loading/error UI, routing | Feature |
| Proxy, auth cookie/header wiring, DB persistence | E2E (one happy path) |
| API response shape | Regenerate types, then feature tests |

Feature tests give the best return for day-to-day UI work. Unit tests keep pure
logic cheap to verify. E2E tests are the safety net for "does the whole stack
actually work?" — keep that list short.
