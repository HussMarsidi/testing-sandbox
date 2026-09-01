import { expect, test } from "@playwright/test";

const COPY = {
  nameLabel: "Name",
  emailLabel: "Email",
  categoryLabel: "Category",
  messageLabel: "Message",
  submitButton: "Submit feedback",
  successMessage: "Thank you! Your feedback has been received.",
  complaintsPageTitle: "All complaints",
  navLogin: "Sign in",
  usernameLabel: "Username",
  passwordLabel: "Password",
  loginButton: "Sign in",
} as const;

test("@smoke submits feedback, signs in, and shows it on the complaints page", async ({
  page,
}) => {
  const uniqueMessage = `E2E complaint at ${Date.now()}`;

  await page.goto("/");
  await expect(page.getByLabel(COPY.categoryLabel)).toBeEnabled();

  await page.getByLabel(COPY.nameLabel).fill("Playwright User");
  await page.getByLabel(COPY.emailLabel).fill("playwright@example.com");
  await page.getByLabel(COPY.categoryLabel).selectOption({ label: "Bug" });
  await page.getByLabel(COPY.messageLabel).fill(uniqueMessage);
  await page.getByRole("button", { name: COPY.submitButton }).click();

  await expect(page.getByRole("status")).toHaveText(COPY.successMessage);

  await page.getByLabel("Main").getByRole("link", { name: COPY.navLogin }).click();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await page.getByLabel(COPY.usernameLabel).fill("admin");
  await page.getByLabel(COPY.passwordLabel).fill("password");
  await page.getByRole("button", { name: COPY.loginButton }).click();

  await expect(
    page.getByRole("heading", { name: COPY.complaintsPageTitle }),
  ).toBeVisible();

  const complaint = page.getByRole("listitem").filter({ hasText: uniqueMessage });
  await expect(complaint).toBeVisible();
  await expect(complaint.getByText("Playwright User")).toBeVisible();
});
