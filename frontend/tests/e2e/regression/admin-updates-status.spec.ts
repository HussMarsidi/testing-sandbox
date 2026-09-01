import { expect, test } from "@playwright/test";

const COPY = {
  complaintsPageTitle: "All complaints",
  navLogin: "Sign in",
  usernameLabel: "Username",
  passwordLabel: "Password",
  loginButton: "Sign in",
  statusLabel: "Status",
} as const;

test("@regression admin updates complaint status on the real stack", async ({
  page,
}) => {
  const uniqueMessage = `Admin status update at ${Date.now()}`;

  await page.goto("/");
  await page.getByLabel("Name").fill("Admin Status Test");
  await page.getByLabel("Email").fill("admin-status@example.com");
  await page.getByLabel("Category").selectOption({ label: "Bug" });
  await page.getByLabel("Message").fill(uniqueMessage);
  await page.getByRole("button", { name: "Submit feedback" }).click();
  await expect(page.getByRole("status")).toBeVisible();

  await page.getByLabel("Main").getByRole("link", { name: COPY.navLogin }).click();
  await page.getByLabel(COPY.usernameLabel).fill("admin");
  await page.getByLabel(COPY.passwordLabel).fill("password");
  await page.getByRole("button", { name: COPY.loginButton }).click();

  await expect(
    page.getByRole("heading", { name: COPY.complaintsPageTitle }),
  ).toBeVisible();

  const complaint = page.getByRole("listitem").filter({ hasText: uniqueMessage });
  await expect(complaint).toBeVisible();

  await complaint.getByLabel(COPY.statusLabel).selectOption({ label: "In progress" });
  await expect(complaint.getByLabel(COPY.statusLabel)).toHaveValue("in_progress");
});
