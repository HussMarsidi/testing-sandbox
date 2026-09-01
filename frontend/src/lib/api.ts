import type { components } from "../types/api";
import { clearAuthToken, getAuthToken, setAuthToken, type UserRole } from "./auth-storage";

export type Complaint = components["schemas"]["Complaint"];
export type CreateComplaint = components["schemas"]["CreateComplaint"];
export type CategoryOption = components["schemas"]["CategoryOption"];
export type LoginRequest = components["schemas"]["LoginRequest"];
export type ComplaintStatus = Complaint["status"];
export type ComplaintFilters = {
  status?: ComplaintStatus;
  search?: string;
};

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}`, response.status);
  }

  return response.json() as Promise<T>;
}

export async function fetchCategories(): Promise<CategoryOption[]> {
  const response = await fetch(`${API_BASE}/api/categories`);
  return parseResponse<CategoryOption[]>(response);
}

export async function login(payload: LoginRequest): Promise<UserRole> {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    throw new ApiError("Invalid credentials", 401);
  }

  if (!response.ok) {
    throw new ApiError("Login failed", response.status);
  }

  const body = (await response.json()) as components["schemas"]["LoginResponse"];
  setAuthToken(body.token);
  return body.role;
}

export function logout(): void {
  clearAuthToken();
}

export async function createComplaint(
  payload: CreateComplaint,
): Promise<{ id: number }> {
  const response = await fetch(`${API_BASE}/api/complaints`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new ApiError("Failed to submit complaint", response.status);
  }

  return response.json() as Promise<{ id: number }>;
}

function buildComplaintsUrl(filters: ComplaintFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  const query = params.toString();
  return query ? `${API_BASE}/api/complaints?${query}` : `${API_BASE}/api/complaints`;
}

export async function fetchComplaints(
  filters: ComplaintFilters = {},
): Promise<Complaint[]> {
  const response = await fetch(buildComplaintsUrl(filters), {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new ApiError("Failed to load complaints", response.status);
  }

  return response.json() as Promise<Complaint[]>;
}

export async function fetchComplaint(id: number): Promise<Complaint> {
  const response = await fetch(`${API_BASE}/api/complaints/${id}`, {
    headers: authHeaders(),
  });

  if (response.status === 404) {
    throw new ApiError("Complaint not found", 404);
  }

  if (!response.ok) {
    throw new ApiError("Failed to load complaint", response.status);
  }

  return response.json() as Promise<Complaint>;
}

export async function updateComplaintStatus(
  id: number,
  status: ComplaintStatus,
): Promise<Complaint> {
  const response = await fetch(`${API_BASE}/api/complaints/${id}`, {
    method: "PATCH",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (response.status === 403) {
    throw new ApiError("Forbidden", 403);
  }

  if (response.status === 400) {
    throw new ApiError("Invalid status transition", 400);
  }

  if (!response.ok) {
    throw new ApiError("Failed to update complaint", response.status);
  }

  return response.json() as Promise<Complaint>;
}

export function getCategoryLabel(
  categories: CategoryOption[],
  value: Complaint["category"],
): string {
  return categories.find((category) => category.value === value)?.label ?? value;
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}
