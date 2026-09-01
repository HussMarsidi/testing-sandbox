import type { Screen } from "@testing-library/react";
import {
  MOCK_ADMIN_TOKEN,
  MOCK_VIEWER_TOKEN,
} from "../mocks/handlers";
import { setAuthToken, type UserRole } from "../../src/lib/auth-storage";

export function authenticateTestUser(role: UserRole = "admin"): void {
  setAuthToken(role === "admin" ? MOCK_ADMIN_TOKEN : MOCK_VIEWER_TOKEN);
}

export function clearAuthenticatedUser(): void {
  localStorage.removeItem("feedback_sandbox_token");
}

export async function waitForCategories(screen: Screen): Promise<void> {
  await screen.findByRole("option", { name: "Bug" });
}
