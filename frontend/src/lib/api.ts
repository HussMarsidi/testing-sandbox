import type { components } from "../types/api";
import { clearAuthToken, getAuthToken, setAuthToken } from "./auth-storage";

export type Complaint = components["schemas"]["Complaint"];
export type CreateComplaint = components["schemas"]["CreateComplaint"];
export type CategoryOption = components["schemas"]["CategoryOption"];
export type LoginRequest = components["schemas"]["LoginRequest"];

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

export async function login(payload: LoginRequest): Promise<void> {
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

export async function fetchComplaints(): Promise<Complaint[]> {
  const response = await fetch(`${API_BASE}/api/complaints`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new ApiError("Failed to load complaints", response.status);
  }

  return response.json() as Promise<Complaint[]>;
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
