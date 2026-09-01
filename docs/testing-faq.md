# Testing FAQ

Pushback we hear, and how this repo answers it. For how each layer is wired,
see [frontend-testing.md](./frontend-testing.md).

---

## If we mock the data, are we even testing the features?

**Mocks never prove the API.** We do not claim they do.

Feature tests with MSW prove the **frontend feature**: real React, real hooks,
real `fetch` in `api.ts`. They fake HTTP so we can check every UI state fast
(success, empty, 401 redirect, 500 banner).

If MSW were the only gate, the concern would stand. It is not.

| Question | Who answers it | Real server? |
|---|---|---|
| Empty form shows the right errors? | Unit + feature | no |
| Success banner / 500 alert / empty list / redirect to login? | Feature (MSW) | no — on purpose |
| POST writes SQLite, GET reads it, JWT is real? | Backend Vitest + smoke e2e | **yes** |
| Admin can PATCH status, viewer cannot? | Backend tests + nightly e2e | **yes** |
| Live API still matches `openapi.json`? | Schemathesis | **yes** |
| Frontend types still match that spec? | `generate:types` + `npm run build` | n/a |

Passing MSW alone is not the release bar. Passing **all CI layers** is.
See [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

---

## How do we know each product feature works?

Map the product to the tests that actually prove it:

- **Submit feedback** — feature tests for UI; backend `POST` test + smoke e2e
  for persistence.
- **Login / protected list** — feature tests for redirect + login UX; backend
  auth tests + e2e for real JWT.
- **Status / roles** — backend tests + nightly
  `admin-updates-status` / `viewer-read-only`.
- **Contract** — CI regenerates `openapi.json` and fails if it drifted;
  Schemathesis hits the live server.

The one test that is the full product path is
`frontend/tests/e2e/smoke/feedback-flow.spec.ts`:

browser → fill form → real POST → login `admin` / `password` → open list →
**that exact message** is in the list.

No MSW. Real Chromium, real Hono, real SQLite.

---

## Then why mock at all?

The smoke test cannot cheaply prove:

- empty form shows 4 errors
- categories 500 disables submit
- create 500 shows the alert
- unauthenticated `/complaints` redirects to login

Those are still product behavior. Forcing them on a real server needs test-only
flags. MSW `setCreateFailure(true)` is that flag.

Trade: mocks for the UI states. One real e2e for the wiring. Backend tests for
SQLite / JWT / roles.

---

## How do I walk a skeptic through this?

Don’t start with the pyramid. Agree first: green mocks + a broken API is a real
failure mode **if mocks are the only gate**. Then show CI and break things live.

### Line to use

> We don’t trust mocks for “does the product work.” Mocks test the UI. Backend
> tests + contract + Playwright test the real API and the real browser. CI must
> pass **all** of them.

### Demo (about 10 minutes)

**1. Break the real backend**

In `backend/src/routes/auth.ts`, make login always return 401.

```bash
cd frontend && npm test          # still green — MSW. This is the fear. Admit it.
cd backend && npm test           # red
cd frontend && npm run test:e2e  # red — cannot sign in, complaint never appears
```

Mocks would not catch this. That is why the other jobs exist.

**2. Break the UI, keep the API**

Change the submit button label, or stop showing the success banner.

- Backend tests + Schemathesis → green
- Feature test `feedback-form.acceptance.test.tsx` → red

E2e alone would miss most of this, or you would need many slow Playwright tests.

**3. Read the smoke test together**

Open `frontend/tests/e2e/smoke/feedback-flow.spec.ts`. That file is the
“is the feature working” proof.

If after the demo they still want more proof, add e2e on critical auth/status
paths — do not delete MSW. Nightly already covers admin status update and
viewer read-only.

### Don’t say / do say

**Don’t:** “The pyramid…” · “Feature tests *are* testing the feature” (they hear
fake data = fake test) · “Trust the contract.”

**Do:** “Mocks never prove the API. We don’t claim they do.” · “PR CI runs real
backend tests, Schemathesis on a live server, then Playwright on the real
stack.” · “A mock-only suite would be a problem. Ours isn’t mock-only.”

---

## Schemathesis says login mostly returns 401. Did tests fail?

No. That line is a warning, not a failure.

The script logs in once with `admin` / `password` to get a JWT for protected
routes. Schemathesis then tests `POST /api/auth/login` itself by inventing
random username/password pairs that still match the schema. Almost none of
those are real users, so the API correctly returns 401.

401 is documented as “invalid credentials.” The check still passes. Ignore the
warning unless the summary shows a failed check.
