import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { components } from "../../src/types/api";
import { isValidStatusTransition } from "../../src/lib/status";

type Complaint = components["schemas"]["Complaint"];
type CategoryOption = components["schemas"]["CategoryOption"];
type UserRole = components["schemas"]["LoginResponse"]["role"];

export const MOCK_ADMIN_USERNAME = "admin";
export const MOCK_ADMIN_PASSWORD = "password";
export const MOCK_VIEWER_USERNAME = "viewer";
export const MOCK_VIEWER_PASSWORD = "password";

function createMockToken(username: string, role: UserRole): string {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ sub: username, role }));
  return `${header}.${payload}.mock-signature`;
}

export const MOCK_ADMIN_TOKEN = createMockToken(MOCK_ADMIN_USERNAME, "admin");
export const MOCK_VIEWER_TOKEN = createMockToken(MOCK_VIEWER_USERNAME, "viewer");

/** @deprecated Use MOCK_ADMIN_TOKEN */
export const MOCK_AUTH_TOKEN = MOCK_ADMIN_TOKEN;

export const MOCK_CATEGORIES: CategoryOption[] = [
  { value: "bug", label: "Bug" },
  { value: "feature_request", label: "Feature Request" },
  { value: "other", label: "Other" },
];

let complaints: Complaint[] = [];
let shouldFailCreate = false;
let shouldFailList = false;
let shouldFailDetail = false;
let shouldFailUpdate = false;
let shouldFailCategories = false;
let shouldFailLogin = false;

function getAuthRole(request: Request): UserRole | null {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length);
  if (token === MOCK_ADMIN_TOKEN) {
    return "admin";
  }
  if (token === MOCK_VIEWER_TOKEN) {
    return "viewer";
  }

  return null;
}

function filterComplaints(url: URL): Complaint[] {
  let result = [...complaints];
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search")?.trim().toLowerCase();

  if (status) {
    result = result.filter((complaint) => complaint.status === status);
  }

  if (search) {
    result = result.filter(
      (complaint) =>
        complaint.name.toLowerCase().includes(search) ||
        complaint.email.toLowerCase().includes(search) ||
        complaint.message.toLowerCase().includes(search),
    );
  }

  return result;
}

export function resetMockState() {
  complaints = [];
  shouldFailCreate = false;
  shouldFailList = false;
  shouldFailDetail = false;
  shouldFailUpdate = false;
  shouldFailCategories = false;
  shouldFailLogin = false;
}

export function seedComplaints(entries: Complaint[]) {
  complaints = [...entries];
}

export function setCreateFailure(shouldFail: boolean) {
  shouldFailCreate = shouldFail;
}

export function setListFailure(shouldFail: boolean) {
  shouldFailList = shouldFail;
}

export function setDetailFailure(shouldFail: boolean) {
  shouldFailDetail = shouldFail;
}

export function setUpdateFailure(shouldFail: boolean) {
  shouldFailUpdate = shouldFail;
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
      return HttpResponse.json({ token: MOCK_ADMIN_TOKEN, role: "admin" });
    }

    if (
      body.username === MOCK_VIEWER_USERNAME &&
      body.password === MOCK_VIEWER_PASSWORD
    ) {
      return HttpResponse.json({ token: MOCK_VIEWER_TOKEN, role: "viewer" });
    }

    return HttpResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }),
  http.get("/api/complaints", ({ request }) => {
    const role = getAuthRole(request);
    if (!role) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (shouldFailList) {
      return HttpResponse.json({ error: "Server error" }, { status: 500 });
    }

    const url = new URL(request.url);
    return HttpResponse.json(filterComplaints(url));
  }),
  http.get("/api/complaints/:id", ({ request, params }) => {
    const role = getAuthRole(request);
    if (!role) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (shouldFailDetail) {
      return HttpResponse.json({ error: "Server error" }, { status: 500 });
    }

    const id = Number(params.id);
    const complaint = complaints.find((entry) => entry.id === id);
    if (!complaint) {
      return HttpResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    return HttpResponse.json(complaint);
  }),
  http.patch("/api/complaints/:id", async ({ request, params }) => {
    const role = getAuthRole(request);
    if (!role) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (role !== "admin") {
      return HttpResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (shouldFailUpdate) {
      return HttpResponse.json({ error: "Server error" }, { status: 500 });
    }

    const id = Number(params.id);
    const existingIndex = complaints.findIndex((entry) => entry.id === id);
    if (existingIndex === -1) {
      return HttpResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    const body = (await request.json()) as components["schemas"]["UpdateComplaintStatus"];
    const existing = complaints[existingIndex];
    if (!isValidStatusTransition(existing.status, body.status)) {
      return HttpResponse.json(
        { error: `Cannot change status from ${existing.status} to ${body.status}` },
        { status: 400 },
      );
    }

    const updated: Complaint = { ...existing, status: body.status };
    complaints = [
      ...complaints.slice(0, existingIndex),
      updated,
      ...complaints.slice(existingIndex + 1),
    ];

    return HttpResponse.json(updated);
  }),
  http.post("/api/complaints", async ({ request }) => {
    if (shouldFailCreate) {
      return HttpResponse.json({ error: "Server error" }, { status: 500 });
    }

    const body = (await request.json()) as components["schemas"]["CreateComplaint"];
    const complaint: Complaint = {
      id: complaints.length + 1,
      created_at: new Date().toISOString(),
      status: "open",
      ...body,
    };

    complaints = [complaint, ...complaints];
    return HttpResponse.json({ id: complaint.id }, { status: 201 });
  }),
];

export const server = setupServer(...handlers);
