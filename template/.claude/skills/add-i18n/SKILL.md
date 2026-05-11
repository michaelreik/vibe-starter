---
name: add-i18n
description: Wire next-intl for multi-language support — install the SDK, scaffold the [locale] route group, migrate UI strings to t() calls, set up messages/<locale>.json. Use when user invokes /add-i18n or says "translation", "multi-language", "internationalization", "i18n".
---

# add-i18n Skill

You are adding internationalization to a vibe-starter project. The default
choice is **next-intl** — de-facto standard for Next.js App Router,
2M+ weekly downloads, actively maintained.

## When to invoke

- `/add-i18n` slash command.
- User says "make this work in German", "add multi-language", "translate".

## Pre-flight

This is a structurally invasive change — every page moves under `app/[locale]/`.
Before starting, confirm with the user that this is the right time (better
done early, before lots of hand-coded strings exist). If the project already
has many strings, the migration is feasible but tedious — surface it.

## Required inputs

1. **Default locale** — usually `en`.
2. **Additional locales** — e.g., `de`, `fr`. At least one or there's no point.

## Steps

### 1. Install

```bash
npm install next-intl
```

### 2. Move app/ routes under [locale]

This is the structural change. The current layout is:

```
app/
├── (auth)/login/page.tsx
├── (app)/dashboard/page.tsx
├── (app)/account/page.tsx
├── (app)/notes/...
├── api/auth/callback/route.ts   ← stays at app/api/, NOT moved
├── layout.tsx
└── page.tsx
```

Becomes:

```
app/
├── [locale]/
│   ├── (auth)/login/page.tsx
│   ├── (app)/dashboard/page.tsx
│   ├── ...
│   ├── layout.tsx               ← becomes the locale layout
│   └── page.tsx
├── api/auth/callback/route.ts   ← stays here (locale-agnostic)
└── layout.tsx                   ← root layout, no locale awareness
```

Move command (run from `template/`):

```bash
mkdir -p app/[locale]
git mv "app/(auth)" "app/[locale]/(auth)"
git mv "app/(app)" "app/[locale]/(app)"
git mv "app/page.tsx" "app/[locale]/page.tsx"
# Note: keep app/layout.tsx and app/api/ where they are.
```

### 3. Configure next-intl

Create `i18n/routing.ts`:

```ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "de"],          // ← include user's chosen list
  defaultLocale: "en",            // ← user's default
  localePrefix: "as-needed",      // /dashboard for default; /de/dashboard for others
});
```

Create `i18n/request.ts`:

```ts
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as typeof routing.locales[number])) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

Create `messages/en.json`:

```json
{
  "common": {
    "signIn": "Sign in",
    "signOut": "Sign out",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete"
  },
  "auth": {
    "signInDescription": "Use the credentials you set during /setup.",
    "emailLabel": "Email",
    "passwordLabel": "Password",
    "signInButton": "Sign in",
    "signingIn": "Signing in…"
  },
  "dashboard": {
    "welcome": "Welcome",
    "signedInAs": "Signed in as {email}"
  },
  "notes": {
    "title": "Notes",
    "newNote": "New note",
    "noNotesYet": "No notes yet. Create your first one.",
    "deleteConfirm": "Delete this note?"
  }
}
```

Create `messages/<each-other-locale>.json` with the same keys, translated.
For unknown user-language locales, ask the user to provide the translations
(don't auto-translate — quality is too low and it ships to production).

### 4. Update next.config.ts

Wrap with the next-intl plugin:

```ts
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig = {
  // existing config
};

export default withNextIntl(nextConfig);
```

### 5. Update middleware

Currently `middleware.ts` runs `updateSession`. Now it must ALSO run the next-intl middleware. Compose:

```ts
import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  // Run intl middleware first to handle locale detection / redirects.
  const intlResponse = intlMiddleware(request);
  if (intlResponse && intlResponse.headers.get("location")) {
    return intlResponse;
  }
  // Then run Supabase session refresh + auth gate.
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### 6. Migrate strings in pages and components

For each page/component under `app/[locale]/` and reusable components:

```tsx
// Before:
<Button>Sign in</Button>

// After:
import { useTranslations } from "next-intl";
const t = useTranslations("common");
<Button>{t("signIn")}</Button>
```

For server components: `import { getTranslations } from "next-intl/server";` and `const t = await getTranslations("dashboard");`.

Update each page and component until the grep `grep -rE '"[A-Z]' app/ components/` returns no hand-coded English strings (excluding code identifiers and CSS classes).

### 7. Update auth-protected route paths in middleware

The path-prefix check in `lib/supabase/middleware.ts` uses `/dashboard`, etc. With next-intl's `localePrefix: "as-needed"`, those paths still work for the default locale but become `/de/dashboard` for German. Update:

```ts
const isProtected =
  /\/(?:dashboard|account|notes)/.test(path);
```

(Drops the `startsWith` and uses a regex that matches the path segment regardless of locale prefix.)

### 8. Verify auth redirect under i18n

The password sign-in action calls `redirect("/dashboard")`. With i18n
enabled, you have two options:

- Leave it as is and trust the intl middleware to forward to `/${locale}/dashboard`.
- Read the user's locale (cookie or `Accept-Language`) in the auth action and
  redirect to the localized path directly.

Use the simpler approach — change nothing — and let middleware handle it.

### 9. Verify

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
npm run dev
```

Smoke check:
- `http://localhost:3000` → loads in default locale
- `http://localhost:3000/de` → loads in German (or chosen locale)
- Auth still works — sign in with email + password
- Theme toggle still works
- Sign out still works

### 10. Commit

Commit per logical chunk:
- `feat(i18n): install next-intl, configure routing`
- `feat(i18n): move pages under [locale] route group`
- `feat(i18n): migrate UI strings to t() calls`
- `feat(i18n): compose intl + Supabase middleware`

## Edge cases

- **Locale persistence across sessions**: next-intl reads from URL by default. For cookie-based persistence, see next-intl docs on `localeCookie`. Don't add cookies until the user asks.
- **Supabase auth email locale**: Supabase has separate templates per locale (Dashboard → Authentication → Email Templates). For now, English templates are fine. Surface the option to the user.
- **Date / number formatting**: next-intl ships `useFormatter`. Use it for dates/numbers in UI; surface this if the user has hand-formatted dates anywhere.

## What you do NOT do

- Auto-translate strings to other languages. Quality is too low and it goes to production.
- Move `app/api/` under `[locale]/` — API routes are locale-agnostic.
- Forget to update the auth-gate path check in middleware.
