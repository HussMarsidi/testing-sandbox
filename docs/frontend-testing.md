# Frontend testing in this repo

We have a feedback app with enough moving parts to practice real testing tradeoffs:
roles, status workflow, filters, detail pages, OpenAPI contract checks, smoke vs
nightly e2e. The app is not the point. The tests are.

This doc walks through what we actually run, what files are involved, and why
each layer exists. If you want to follow along, skip to [Try it yourself](#try-it-yourself)
and run the commands — then come back here when something breaks or you are not
sure where a test should live.

---

## The pyramid (what we actually have)

Three layers. More tests at the bottom, fewer at the top. Slower and heavier as
you go up.

```
                    ┌──────────────────────────────────────┐
                    │  E2E smoke — 1 test (PR CI)          │
                    │  E2E regression — 2 tests (nightly)  │
                    │  Playwright · Chromium · real stack  │
                    └──────────────────────────────────────┘
              ┌────────────────────────────────────────────────────┐
              │  Feature — 16 tests                                │
              │  Vitest · jsdom · Testing Library · MSW            │
              └────────────────────────────────────────────────────┘
    ┌──────────────────────────────────────────────────────────────────────────┐
    │  Unit — 6 tests (frontend) + 13 backend API/status tests               │
    └──────────────────────────────────────────────────────────────────────────┘
```

**Unit** — `frontend/tests/unit/` + `backend/tests/`  
**Feature** — `frontend/tests/feature/*.test.tsx`  
**E2E smoke** — `frontend/tests/e2e/smoke/` (every PR)  
**E2E regression** — `frontend/tests/e2e/regression/` (nightly workflow)  
**Contract** — Schemathesis against live Hono + `openapi.json` (`backend npm run test:contract`)

Vitest runs frontend unit + feature (`npm test`). Playwright smoke runs on PR CI
(`npm run test:e2e`). Regression runs nightly (`npm run test:e2e:regression`).

---

## Unit tests

### What happens when you run them

Vitest imports `validateComplaintForm` from `src/lib/validators.ts`, calls it
with plain objects, checks the return value. No `render()`. No `fetch`. No MSW.
The whole file finishes in a few milliseconds.

Example from `validators.test.ts`:

```ts
const result = validateComplaintForm({
  name: "",
  email: "",
  category: "",
  message: "",
});

expect(result.valid).toBe(false);
expect(result.errors).toEqual(
  expect.arrayContaining([
    { field: "name", message: COPY.validation.nameRequired },
    // ...
  ]),
);
```

That test proves: empty form → four field errors with the exact strings from
`COPY.validation`. It does not prove the errors show up under the inputs. That
is a feature test job.

### What belongs here

Put logic here when you can test it by calling a function and inspecting the
result:

- `validateComplaintForm()` — required fields, email regex, message length
- `getFieldError(errors, "name")` — lookup helper used by the form
- `formatDate()` in `api.ts` — string in, string out

Good unit test: pass `{ email: "not-an-email", ... }`, expect
`COPY.validation.emailInvalid` in `result.errors`.

### What does not belong here

Do not unit test things that only make sense with UI or I/O wired up:

- **Do not** render `<FeedbackForm />` in a unit test. That is feature territory.
- **Do not** test that clicking Submit shows an alert. That needs DOM + user events.
- **Do not** mock `fetch` for `createComplaint()` in unit tests. Either test
  `validateComplaintForm` (pure) or test the form submission in feature tests
  where MSW handles HTTP.
- **Do not** duplicate every validation rule twice (unit asserts the message,
  feature asserts the same message on screen). Pick both only when the rule is
  easy to break in isolation *and* the wiring matters — e.g. trim before validate.

We only have one unit file right now because most of the app is UI + network.
That is normal for a form-heavy frontend.

---

## Feature tests

### What happens when you run them

1. `vitest.config.ts` loads `tests/setup.ts` (jest-dom matchers, cleanup) and
   `tests/setup-msw.ts` (starts the MSW Node server).
2. A test calls `renderWithProviders(<FeedbackForm />)` or
   `renderProtectedComplaints()`.
3. React mounts in jsdom. Components call React Query hooks (`useCategories`,
   `useComplaints`), which call `fetch()` in `api.ts`.
4. MSW intercepts those `fetch` calls before they leave the process. Handlers in
   `tests/mocks/handlers.ts` return JSON — same paths as production
   (`/api/categories`, `/api/complaints`, etc.).
5. Testing Library queries the DOM (`getByLabelText`, `findByRole`) and you assert
   on visible text.

So: real component tree, real hooks, fake server. Fast, and you control failures.

### The fake backend (`tests/mocks/handlers.ts`)

This file is the main reason feature tests are useful. It keeps an in-memory
`complaints` array. `POST /api/complaints` pushes to it; `GET /api/complaints`
reads it back (with a Bearer token check).

Toggle helpers flip error modes without touching production code:

```ts
setCategoriesFailure(true);  // GET /api/categories → 500
setCreateFailure(true);      // POST /api/complaints → 500
setListFailure(true);        // GET /api/complaints → 500
setLoginFailure(true);       // POST /api/auth/login → 500
```

`setup-msw.ts` calls `resetMockState()` after every test so complaints from one
test do not leak into the next. It also sets `onUnhandledRequest: "error"` — if
the app hits a URL we did not mock, the test fails immediately instead of hanging.

### Render helpers (`tests/helpers/render.tsx`)

Components expect providers. The app wraps with `QueryClientProvider` +
`AuthProvider` in `App.tsx`. Tests need the same stack or hooks throw.

- `renderWithProviders(ui)` — fresh `QueryClient` (retries off) + `MemoryRouter`
- `renderProtectedComplaints()` — adds auth + routes for `/complaints` and
  `/login`, mounts `ProtectedRoute` around the list page
- `renderLoginPage()` — auth + login route only

Each render gets its own `QueryClient` so cached query data does not bleed between
tests.

### Auth shortcuts (`tests/helpers/auth.ts`)

Most complaints tests call `authenticateTestUser()` before render. That writes
`MOCK_AUTH_TOKEN` to localStorage — same token MSW expects in the
`Authorization` header. Skips typing username/password on every test.

One test in `complaints-list.test.tsx` renders full `<App />` and logs in through
the UI instead. That test is slower but checks nav links + login form + list in
one chain.

### Concrete examples in the suite

**`feedback-form.acceptance.test.tsx`**

| Test | What it does |
|------|----------------|
| Labels and button | Renders form, checks `COPY` strings, waits for "Bug" option (categories loaded) |
| Validation | Clicks submit with empty fields, expects four inline error messages |
| Success | Fills form, submits, expects `role="status"` success banner |
| Server error | `setCreateFailure(true)`, submit valid form, expects alert with server message |
| Categories down | `setCategoriesFailure(true)`, expects error banner + disabled submit |

**`complaints-list.test.tsx`**

| Test | What it does |
|------|----------------|
| Not authed | Visit `/complaints`, redirected to login heading |
| Empty list | Token in localStorage, MSW returns `[]`, shows empty copy |
| Load error | `setListFailure(true)`, shows complaints load error alert |
| Custom data | `server.use()` overrides GET handler for one test with a hard-coded row |
| Full flow | Submit on `/`, login via UI, see complaint on list |

### What belongs here

- Does the user see the right label, error, success, empty state?
- Does `ProtectedRoute` send you to login?
- Does the form disable when categories fail to load?
- Does React Query loading/error state reach the DOM?

Use `userEvent` for clicks and typing. Use `findBy*` when waiting on async
(fetch + re-render). Use `getBy*` when the element should already be there.

### What does not belong here

- **Do not** test `validateComplaintForm` edge cases here if they are already
  covered in unit tests — unless you are checking they render in the right place.
- **Do not** boot the real backend. If you need SQLite persistence, that is e2e.
- **Do not** assert on implementation details (`useState` call count, query key
  strings) unless you are debugging — assert on what the user sees (`role="alert"`,
  label text from `COPY`).
- **Do not** use `authenticateTestUser()` in the test that is specifically
  about the login form UX — type credentials like a user would.

### React Query in feature tests

`ComplaintsListPage` calls `useComplaints()`. On mount, React Query runs
`fetchComplaints()` → MSW responds → component re-renders with data or error.

No manual `waitFor` on fetch in the page anymore. Tests still use
`findByText("Jane Doe")` because the query is async. The helper
`waitForCategories(screen)` waits for the "Bug" `<option>` — same idea for the
dropdown fetch.

---

## E2E tests

### What happens when you run them

`playwright.config.ts` starts two processes before the test runs:

1. Backend — `npm run start` in `backend/`, port 3001, SQLite file
   `data/e2e-complaints.db`
2. Frontend — `npm run dev` on port 5173

Playwright opens Chromium, goes to `http://127.0.0.1:5173/`, and runs one test:
fill form → submit → click Sign in → log in as `admin` / `password` → open
complaints → find a list item containing a unique message string
(`E2E complaint at ${Date.now()}`).

That timestamp matters. It proves the row came from *this* run, not leftover data
(though e2e DB is separate from dev either way).

### What e2e catches that feature tests miss

Feature tests never touch:

- Vite dev server and `/api` proxy wiring
- Real JWT creation and verification on the backend
- SQLite insert on POST and read on GET
- Full router + nav + auth context in a real browser layout

We have one e2e test because that happy path is enough to prove the stack is
connected. We already hammer errors in feature tests with `setListFailure` and
friends — repeating every 500 in Playwright would be slow and brittle.

### What does not belong in e2e

- Validation message copy for empty fields — covered in unit + feature.
- "Invalid password" alert — feature test with MSW 401.
- Every category dropdown edge case — feature test.
- Anything you can flip with a one-line MSW flag — keep it in feature.

Add e2e when you need proof that real persistence or real auth headers work, not
when you need another variant of "show error banner."

---

## OpenAPI types — why that file exists

Frontend and backend are separate packages. Without a shared contract, you find
out about mismatches at runtime: form submits, server returns 400, or TypeScript
silently treats a renamed field as `any`.

We fix that with a generated spec and generated types.

**Backend side**

Routes are defined with Zod schemas in Hono (`@hono/zod-openapi`). The same
schemas validate incoming requests *and* describe the API shape. Running:

```bash
cd backend && npm run generate:openapi
```

writes `backend/openapi.json`. That file is committed. CI regenerates it and
fails if someone changed routes but forgot to update the spec — the diff shows up
in the PR.

**Frontend side**

```bash
cd frontend && npm run generate:types
```

runs `openapi-typescript` on that JSON and writes `src/types/api.ts`. Do not edit
that file by hand. Regenerate when the API changes.

**Who consumes the types**

- `src/lib/api.ts` — `Complaint`, `CreateComplaint`, `LoginRequest`, etc.
- `tests/mocks/handlers.ts` — `components["schemas"]["Complaint"]` for mock payloads
- Any component or test building request/response objects

If the backend renames `created_at` to `createdAt`, regeneration updates the
type, TypeScript errors in `api.ts` and MSW handlers, and you fix before tests
even run. That is the point — compile-time guardrail, not documentation for its
own sake.

MSW handlers should stay typed against the same schemas so the fake backend cannot
drift from the real one. When you add an endpoint, update backend → regenerate
openapi → regenerate types → add handler → add feature test.

---

## Try it yourself

Install once:

```bash
cd backend && npm install
cd frontend && npm install
```

### Unit + feature (default loop)

```bash
cd frontend && npm test
```

~15 tests, a few seconds, no servers. MSW handles all HTTP.

Watch mode while writing tests:

```bash
cd frontend && npm run test:watch
```

Single file:

```bash
cd frontend && npx vitest run tests/feature/complaints-list.test.tsx
```

### E2E smoke (PR CI)

```bash
cd frontend && npm run test:e2e
```

Runs `tests/e2e/smoke/` — one critical happy path.

### E2E regression (nightly)

```bash
cd frontend && npm run test:e2e:regression
```

Runs `tests/e2e/regression/` — viewer read-only + admin status update on the real
stack. Same Playwright server boot as smoke.

### Backend + contract tests

```bash
cd backend && npm test
cd backend && npm run test:contract
```

Backend tests hit the real Hono app in-process. Contract tests run Schemathesis
against a live server and verify responses match `openapi.json`.

### Manual click-through (optional)

```bash
# terminal 1
cd backend && npm run dev

# terminal 2
cd frontend && npm run dev
```

Open http://localhost:5173. Logins: `admin` / `password`, `viewer` / `password`.

### CI

`.github/workflows/ci.yml` on every PR: backend tests → Schemathesis contract →
verify openapi.json → build frontend → `npm test` → smoke e2e.

`.github/workflows/nightly-e2e.yml` runs regression e2e on a schedule (and via
workflow_dispatch).

---

## File map

```
frontend/
├── src/
│   ├── lib/
│   │   ├── validators.ts       validateComplaintForm, COPY strings
│   │   ├── api.ts              fetch wrappers (typed from OpenAPI)
│   │   ├── queries.ts          useCategories, useComplaints
│   │   └── query-client.ts     QueryClient defaults (retries off in tests)
│   └── types/api.ts            generated — regenerate, don't edit
└── tests/
    ├── setup.ts                jest-dom + cleanup
    ├── setup-msw.ts            MSW server lifecycle
    ├── unit/
    │   └── validators.test.ts
    ├── feature/
    │   ├── feedback-form.acceptance.test.tsx
    │   └── complaints-list.test.tsx
    ├── e2e/
    │   ├── smoke/
    │   └── regression/
    ├── mocks/handlers.ts       fake API + failure toggles
    └── helpers/
        ├── render.tsx          QueryClient + router + route helpers
        ├── auth.ts               token shortcut, waitForCategories
        └── form.ts               fillFeedbackForm, loginThroughUi
```

Backend contract file: `backend/openapi.json`.
