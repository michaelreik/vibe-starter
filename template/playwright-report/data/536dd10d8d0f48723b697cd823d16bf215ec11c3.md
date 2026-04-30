# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> unauthenticated user is redirected to /login from /dashboard
- Location: tests/e2e/auth.spec.ts:3:5

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/login$/
Received string:  "http://localhost:3000/dashboard"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    9 × unexpected value "http://localhost:3000/dashboard"

```

# Page snapshot

```yaml
- generic [ref=e2]: Cannot GET /dashboard
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test("unauthenticated user is redirected to /login from /dashboard", async ({
  4  |   page,
  5  | }) => {
  6  |   await page.goto("/dashboard");
> 7  |   await expect(page).toHaveURL(/\/login$/);
     |                      ^ Error: expect(page).toHaveURL(expected) failed
  8  |   await expect(page.getByText("Sign in")).toBeVisible();
  9  | });
  10 | 
  11 | test("login form submits magic link request", async ({ page }) => {
  12 |   await page.goto("/login");
  13 |   await page.getByLabel("Email").fill("test@example.com");
  14 |   await page.getByRole("button", { name: /send magic link/i }).click();
  15 |   // Either success state or an error toast — both prove the form submitted.
  16 |   await expect(page.getByText(/check your email|invalid/i)).toBeVisible({
  17 |     timeout: 10_000,
  18 |   });
  19 | });
  20 | 
```