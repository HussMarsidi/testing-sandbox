import type { Screen } from "@testing-library/react";
import { MOCK_AUTH_TOKEN } from "../mocks/handlers";
import { setAuthToken } from "../../src/lib/auth-storage";

export function authenticateTestUser(): void {
  setAuthToken(MOCK_AUTH_TOKEN);
}

export function clearAuthenticatedUser(): void {
  localStorage.removeItem("feedback_sandbox_token");
}

export async function waitForCategories(screen: Screen): Promise<void> {
  await screen.findByRole("option", { name: "Bug" });
}
