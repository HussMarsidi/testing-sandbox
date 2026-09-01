import type { components } from "../types/api";
import { CATEGORY_LABELS } from "./validators";

export type Complaint = components["schemas"]["Complaint"];
export type CreateComplaint = components["schemas"]["CreateComplaint"];

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

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
    throw new Error("Failed to submit complaint");
  }

  return response.json() as Promise<{ id: number }>;
}

export async function fetchComplaints(): Promise<Complaint[]> {
  const response = await fetch(`${API_BASE}/api/complaints`);

  if (!response.ok) {
    throw new Error("Failed to load complaints");
  }

  return response.json() as Promise<Complaint[]>;
}

export function formatCategory(category: Complaint["category"]): string {
  return CATEGORY_LABELS[category];
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}
