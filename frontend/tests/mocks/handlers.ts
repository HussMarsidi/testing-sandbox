import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { components } from "../../src/types/api";

type Complaint = components["schemas"]["Complaint"];
type CategoryOption = components["schemas"]["CategoryOption"];

export const MOCK_AUTH_TOKEN = "test-token";
export const MOCK_ADMIN_USERNAME = "admin";
export const MOCK_ADMIN_PASSWORD = "password";

export const MOCK_CATEGORIES: CategoryOption[] = [
  { value: "bug", label: "Bug" },
  { value: "feature_request", label: "Feature Request" },
  { value: "other", label: "Other" },
];

let complaints: Complaint[] = [];
let shouldFailCreate = false;
let shouldFailList = false;
let shouldFailCategories = false;
let shouldFailLogin = false;

function isAuthorized(request: Request): boolean {
  const authorization = request.headers.get("Authorization");
  return authorization === `Bearer ${MOCK_AUTH_TOKEN}`;
}

export function resetMockState() {
  complaints = [];
  shouldFailCreate = false;
  shouldFailList = false;
  shouldFailCategories = false;
  shouldFailLogin = false;
}

export function setCreateFailure(shouldFail: boolean) {
  shouldFailCreate = shouldFail;
}

export function setListFailure(shouldFail: boolean) {
  shouldFailList = shouldFail;
}

export function setCategoriesFailure(shouldFail: boolean) {
  shouldFailCategories = shouldFail;
}

export function setLoginFailure(shouldFail: boolean) {
  shouldFailLogin = shouldFail;
}

export const handlers = [
  http.get("/api/categories", () => {
    if (shouldFailCategories) {
      return HttpResponse.json({ error: "Server error" }, { status: 500 });
    }

    return HttpResponse.json(MOCK_CATEGORIES);
  }),
  http.post("/api/auth/login", async ({ request }) => {
    if (shouldFailLogin) {
      return HttpResponse.json({ error: "Server error" }, { status: 500 });
    }

    const body = (await request.json()) as components["schemas"]["LoginRequest"];
    if (
      body.username === MOCK_ADMIN_USERNAME &&
      body.password === MOCK_ADMIN_PASSWORD
    ) {
      return HttpResponse.json({ token: MOCK_AUTH_TOKEN });
    }

    return HttpResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }),
  http.get("/api/complaints", ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (shouldFailList) {
      return HttpResponse.json({ error: "Server error" }, { status: 500 });
    }

    return HttpResponse.json(complaints);
  }),
  http.post("/api/complaints", async ({ request }) => {
    if (shouldFailCreate) {
      return HttpResponse.json({ error: "Server error" }, { status: 500 });
    }

    const body = (await request.json()) as components["schemas"]["CreateComplaint"];
    const complaint: Complaint = {
      id: complaints.length + 1,
      created_at: new Date().toISOString(),
      ...body,
    };

    complaints = [complaint, ...complaints];
    return HttpResponse.json({ id: complaint.id }, { status: 201 });
  }),
];

export const server = setupServer(...handlers);
