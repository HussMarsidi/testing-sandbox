import { expect, test } from "@playwright/test";

const COPY = {
  nameLabel: "Name",
  emailLabel: "Email",
  categoryLabel: "Category",
  messageLabel: "Message",
  submitButton: "Submit feedback",
  successMessage: "Thank you! Your feedback has been received.",
  complaintsPageTitle: "All complaints",
  navComplaints: "View complaints",
} as const;

test("submits feedback and shows it on the complaints page", async ({ page }) => {
  const uniqueMessage = `E2E complaint at ${Date.now()}`;

  await page.goto("/");

  await page.getByLabel(COPY.nameLabel).fill("Playwright User");
  await page.getByLabel(COPY.emailLabel).fill("playwright@example.com");
  await page.getByLabel(COPY.categoryLabel).selectOption("bug");
  await page.getByLabel(COPY.messageLabel).fill(uniqueMessage);
  await page.getByRole("button", { name: COPY.submitButton }).click();

  await expect(page.getByRole("status")).toHaveText(COPY.successMessage);

  await page.getByLabel("Main").getByRole("link", { name: COPY.navComplaints }).click();
  await expect(
    page.getByRole("heading", { name: COPY.complaintsPageTitle }),
  ).toBeVisible();

  const complaint = page.getByRole("listitem").filter({ hasText: uniqueMessage });
  await expect(complaint).toBeVisible();
  await expect(complaint.getByText("Playwright User")).toBeVisible();
});
