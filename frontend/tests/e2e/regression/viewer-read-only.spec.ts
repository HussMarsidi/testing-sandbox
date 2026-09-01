import { expect, test } from "@playwright/test";

const COPY = {
  complaintsPageTitle: "All complaints",
  navLogin: "Sign in",
  usernameLabel: "Username",
  passwordLabel: "Password",
  loginButton: "Sign in",
  statusLabel: "Status",
} as const;

test("@regression viewer can read complaints but cannot change status", async ({
  page,
}) => {
  const uniqueMessage = `Viewer read test at ${Date.now()}`;

  await page.goto("/");
  await page.getByLabel("Name").fill("Viewer Read Test");
  await page.getByLabel("Email").fill("viewer-read@example.com");
  await page.getByLabel("Category").selectOption({ label: "Bug" });
  await page.getByLabel("Message").fill(uniqueMessage);
  await page.getByRole("button", { name: "Submit feedback" }).click();
  await expect(page.getByRole("status")).toBeVisible();

  await page.getByLabel("Main").getByRole("link", { name: COPY.navLogin }).click();
  await page.getByLabel(COPY.usernameLabel).fill("viewer");
  await page.getByLabel(COPY.passwordLabel).fill("password");
  await page.getByRole("button", { name: COPY.loginButton }).click();

  await expect(
    page.getByRole("heading", { name: COPY.complaintsPageTitle }),
  ).toBeVisible();

  const complaint = page.getByRole("listitem").filter({ hasText: uniqueMessage });
  await expect(complaint).toBeVisible();
  await expect(complaint.locator(".status-control select")).toHaveCount(0);
  await expect(complaint.getByText("Open")).toBeVisible();
});
