import { test, expect } from "@playwright/test";

test("unauthenticated user is redirected to /login from /dashboard", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  // Don't use getByText("Sign in") — it matches both the card title and the
  // submit button, which violates Playwright strict mode.
  await expect(page.getByLabel("Email")).toBeVisible();
});

test("login form rejects bad credentials with an error toast", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("nobody@example.com");
  await page.getByLabel("Password").fill("definitely-wrong-password");
  await page.getByRole("button", { name: /^sign in$/i }).click();
  // Supabase returns "Invalid login credentials"; the page shows it via toast.
  await expect(page.getByText(/invalid login credentials/i)).toBeVisible({
    timeout: 10_000,
  });
});
