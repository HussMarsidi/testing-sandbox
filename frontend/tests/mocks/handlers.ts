import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { components } from "../../src/types/api";

type Complaint = components["schemas"]["Complaint"];

let complaints: Complaint[] = [];
let shouldFailCreate = false;
let shouldFailList = false;

export function resetMockState() {
  complaints = [];
  shouldFailCreate = false;
  shouldFailList = false;
}

export function setCreateFailure(shouldFail: boolean) {
  shouldFailCreate = shouldFail;
}

export function setListFailure(shouldFail: boolean) {
  shouldFailList = shouldFail;
}

export const handlers = [
  http.get("/api/complaints", () => {
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
