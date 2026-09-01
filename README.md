# Feedback Sandbox

A small throwaway project to prove our **frontend testing plan** works from end
to end — *before* we use it on the real codebase.

The app itself does not matter. The plumbing does. So we build the smallest
feature that still touches every part of the plan: feedback submission, a
complaints list, every test layer, and one CI gate.

> Full testing plan: see [`docs/frontend-testing-plan.md`](docs/frontend-testing-plan.md).

---

## The feature

### Submit feedback

A feedback form: **name, email, category, message.**

- Frontend: `FeedbackForm` (React + TypeScript)
- Backend: `POST /api/complaints` (Hono + SQLite)

### View complaints

A second page that lists everything submitted.

- Frontend: complaints list page
- Backend: `GET /api/complaints`

---

## How to run it

```bash
# backend (Hono + SQLite)
cd backend && npm install && npm run dev

# frontend (React)
cd frontend && npm install && npm run dev

# tests
cd frontend && npm test          # unit + feature (fast, fake backend)
cd frontend && npm run test:e2e  # e2e (real backend + real SQLite)
```

Backend default: `http://localhost:3001`  
Frontend default: `http://localhost:5173` (proxies `/api` to the backend)

---

## The three test layers

Each behavior lives in **exactly one** layer.

- **Unit** — pure logic. A value in, a value out. No UI, no backend.
  → `frontend/tests/unit/` (targets `src/lib/validators.ts`)
- **Feature** — the default, and the bulk. Real form, **fake** backend.
  Act like a user; check what shows on screen. Covers success *and* error.
  → `frontend/tests/feature/` (fake backend lives in `tests/mocks/handlers.ts`)
- **E2e** — one critical flow only. Real browser, **real** backend.
  → `frontend/tests/e2e/`

Only e2e touches the real backend. Everything else fakes it — that's what keeps
the tests fast and lets us force error cases on demand.

---

## The bridge (the contract)

1. The backend describes its API in one standard file — the **OpenAPI spec**.
   With Hono + Zod, that spec is built from the *same rules* that check incoming
   requests, so the spec can't lie about what the backend does.
2. That spec is **committed to the repo** as `backend/openapi.json`. It is the
   contract. When the API changes, this file changes — and shows up as a diff in
   the pull request, where a human can see it.
3. The frontend turns that file into TypeScript types
   (`frontend/src/types/api.ts`) using `openapi-typescript`.
4. Both the fake backend (MSW) and the real form use those same types. All three
   sides are locked to one shape.

**The one rule that keeps this honest: never hand-edit the generated file**
(`frontend/src/types/api.ts`). It's machine-made from the spec. Edit it and the
whole safety idea breaks. Regenerate instead.

If the backend renames a field, the types change, and the frontend stops
compiling. The compiler is the check — no test to write.

Regenerate commands:

```bash
cd backend && npm run generate:openapi
cd frontend && npm run generate:types
```

---

## The AI guardrail

AI writes a lot of the code, so AI must not be allowed to mark its own homework.

1. A **human** writes the visible contract first — the exact labels, button
   text, and success/error messages the user should see. This becomes the
   acceptance test.
2. AI builds the feature until its code matches those visible states and the
   test passes.
3. AI may draft more tests. A human skims them: real behavior, or just agreeing
   with the code?

Only the human-written acceptance test is *trusted*. AI-drafted tests add
coverage, not trust.

For this POC, the visible copy lives in `frontend/src/lib/validators.ts` as
`COPY`, and the trusted test is
`frontend/tests/feature/feedback-form.acceptance.test.tsx`.

---

## The CI gate

One gate. Runs on every pull request. Nothing merges red.

- Rebuild the spec from backend code and compare it to the committed
  `backend/openapi.json` → fail if the API moved but the contract file wasn't
  updated.
- Regenerate the frontend types → the compiler catches shape breaks.
- Run unit + feature tests (fake backend).
- Run the one e2e test (real backend + real SQLite).

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

---

## Folder map

```
feedback-sandbox/
├── backend/                    Hono + SQLite
│   ├── src/
│   │   ├── index.ts            starts the server
│   │   ├── app.ts              app wiring + OpenAPI doc route
│   │   ├── routes/
│   │   │   └── complaints.ts   POST + GET endpoints
│   │   ├── db.ts               sqlite setup
│   │   └── scripts/
│   │       └── generate-openapi.ts
│   ├── tests/                  backend's own light tests
│   └── openapi.json            THE CONTRACT (committed, never hand-edited)
│
├── frontend/                   React + TypeScript
│   ├── src/
│   │   ├── components/
│   │   │   └── FeedbackForm.tsx
│   │   ├── pages/
│   │   │   └── ComplaintsListPage.tsx
│   │   ├── lib/
│   │   │   ├── validators.ts   pure logic + visible COPY contract
│   │   │   └── api.ts          fetch helpers
│   │   └── types/
│   │       └── api.ts          GENERATED from the spec — never hand-edit
│   └── tests/
│       ├── unit/               validators
│       ├── feature/            real UI, fake backend (the bulk)
│       ├── e2e/                real UI, real backend (one flow)
│       └── mocks/
│           └── handlers.ts     the fake backend (MSW)
│
├── docs/
│   └── frontend-testing-plan.md
└── .github/workflows/ci.yml    the one gate
```
