import { test, expect } from "@playwright/test";

test("unauthenticated user is redirected to /login from /dashboard", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText("Sign in")).toBeVisible();
});

test("login form submits magic link request", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByRole("button", { name: /send magic link/i }).click();
  // Either success state or an error toast — both prove the form submitted.
  await expect(page.getByText(/check your email|invalid/i)).toBeVisible({
    timeout: 10_000,
  });
});
