# vibe-starter Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the foundational Next.js + Supabase + Vercel template with magic-link auth, RLS-correct example tables, light/dark UI, and CI — a clonable template that works end-to-end with manual setup. (The `/setup` magic-onboarding skill is Plan 2.)

**Architecture:** Single Next.js 16 App Router project under `vibe-starter/template/`. Supabase via the modern `@supabase/ssr` package (NOT the deprecated `@supabase/auth-helpers-nextjs`). Auth via magic links, sessions refreshed in middleware. RLS policies on every user-data table — enforced via integration tests against a local Supabase instance. shadcn/ui for components, Tailwind v4 for styling, next-themes for dark mode.

**Tech Stack:** Next.js 16.3, React 19, TypeScript 5, Tailwind 4.2, shadcn/ui, `@supabase/ssr`, `@supabase/supabase-js`, next-themes, Vitest, Playwright, Node 22 LTS.

**Working directory for all tasks:** `/Users/michaelreikersdorfer/Development/vibe-starter/template/` (created in Task 1).

---

## File Structure (locked in before tasks)

```
vibe-starter/template/
├── app/
│   ├── (auth)/login/page.tsx        # magic link request form
│   ├── (app)/dashboard/page.tsx     # auth-protected landing
│   ├── (app)/account/page.tsx       # profile edit
│   ├── (app)/notes/
│   │   ├── page.tsx                 # list
│   │   ├── new/page.tsx             # create form
│   │   └── [id]/page.tsx            # edit form
│   ├── api/auth/callback/route.ts   # magic link exchange
│   ├── globals.css
│   ├── layout.tsx                   # ThemeProvider, fonts
│   └── page.tsx                     # public marketing/landing → redirects to /dashboard if logged in
├── components/
│   ├── ui/                          # shadcn primitives (button, input, card, label, toast)
│   ├── theme-toggle.tsx
│   ├── theme-provider.tsx
│   └── notes/
│       ├── note-form.tsx
│       └── note-list.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # browser client
│   │   ├── server.ts                # server client (Server Components, Route Handlers, Server Actions)
│   │   └── middleware.ts            # session refresh logic
│   ├── actions/
│   │   ├── auth.ts                  # signInWithMagicLink, signOut
│   │   ├── profile.ts               # updateProfile
│   │   └── notes.ts                 # createNote, updateNote, deleteNote
│   └── utils.ts                     # cn() helper
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 0001_profiles.sql
│   │   └── 0002_notes.sql
│   └── tests/
│       └── rls.test.sql             # RLS integration tests
├── tests/
│   ├── unit/
│   │   └── utils.test.ts
│   └── e2e/
│       └── auth.spec.ts             # Playwright smoke test
├── .github/workflows/
│   └── ci.yml
├── docs/
│   └── VERSIONS.md
├── scripts/
│   └── bump-versions.sh
├── middleware.ts                    # root-level: matches all routes, runs session refresh
├── next.config.ts
├── tailwind.config not needed in v4 — config lives in app/globals.css via @theme
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── vercel.json
├── package.json
├── .env.example
├── .gitignore
├── README.md
└── CHANGELOG.md
```

---

## Task 1: Initialize Next.js Project

**Files:**
- Create: `vibe-starter/template/` (entire scaffold)

- [ ] **Step 1: Run create-next-app**

From `/Users/michaelreikersdorfer/Development/vibe-starter/`, run:

```bash
npx create-next-app@latest template \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*" \
  --turbopack \
  --use-npm \
  --no-git
```

Expected: creates `template/` folder with Next.js 16.x scaffold, Tailwind 4 pre-configured, TypeScript, ESLint, App Router, no `src/` (we use `app/` at root), `@/*` import alias.

- [ ] **Step 2: Verify Next.js version is 16.x**

```bash
cd template && cat package.json | grep '"next"'
```

Expected: `"next": "^16.3.0"` or newer 16.x. If it's 15.x or older, the global `create-next-app` is stale — run `npm install -g create-next-app@latest` and redo Step 1.

- [ ] **Step 3: Verify Tailwind version is 4.x**

```bash
cat package.json | grep tailwindcss
```

Expected: `"tailwindcss": "^4.x"`. If v3, `create-next-app` was run with old defaults — abort and re-run with explicit `--tailwind` (already there) and verify global tooling.

- [ ] **Step 4: Verify build works**

```bash
npm run build
```

Expected: builds successfully, output ends with `✓ Compiled successfully`. No errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/michaelreikersdorfer/Development/vibe-starter
git add template/
git commit -m "feat: scaffold Next.js 16 + Tailwind 4 + TypeScript template"
```

---

## Task 2: Configure TypeScript Strict Mode and Path Alias

**Files:**
- Modify: `template/tsconfig.json`

- [ ] **Step 1: Open tsconfig.json and verify/update**

Read `template/tsconfig.json`. Ensure these settings are present in `compilerOptions`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Confirm `"strict": true` is set. If `create-next-app` emitted it as `false`, change it to `true`.

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add template/tsconfig.json
git commit -m "chore: enforce TypeScript strict mode"
```

---

## Task 3: Initialize shadcn/ui

**Files:**
- Create: `template/components/ui/*`
- Create: `template/lib/utils.ts`
- Modify: `template/components.json` (created by shadcn init)
- Modify: `template/app/globals.css` (shadcn adds CSS variables)

- [ ] **Step 1: Run shadcn init**

```bash
cd template
npx shadcn@latest init -d
```

The `-d` flag accepts default settings: New York style, neutral base color, CSS variables, `app/globals.css`, components in `components/`, utils in `lib/utils.ts`, RSC enabled.

Expected: creates `components.json`, `lib/utils.ts` with `cn()` helper, updates `app/globals.css` with CSS variables, creates `components/` directory.

- [ ] **Step 2: Add core components**

```bash
npx shadcn@latest add button input label card sonner
```

Expected: creates `components/ui/button.tsx`, `input.tsx`, `label.tsx`, `card.tsx`, `sonner.tsx`. May prompt about overwrites — accept defaults.

- [ ] **Step 3: Wire Sonner toaster into root layout**

Read `template/app/layout.tsx`. Replace its body with:

```tsx
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "vibe-starter",
  description: "Built with vibe-starter",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

(Note: `suppressHydrationWarning` is for next-themes, added properly in Task 12.)

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: initialize shadcn/ui with button, input, label, card, sonner"
```

---

## Task 4: Install Supabase Dependencies

**Files:**
- Modify: `template/package.json`

- [ ] **Step 1: Install runtime packages**

```bash
cd template
npm install @supabase/ssr @supabase/supabase-js
```

Expected: both packages installed at latest. **Do NOT install `@supabase/auth-helpers-nextjs`** — it is deprecated.

- [ ] **Step 2: Install Supabase CLI as dev dependency (for local dev DB and migrations)**

```bash
npm install -D supabase
```

- [ ] **Step 3: Verify package.json has correct entries**

```bash
cat package.json | grep supabase
```

Expected three entries: `@supabase/ssr`, `@supabase/supabase-js`, `supabase` (dev).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add Supabase deps (@supabase/ssr, supabase-js, CLI)"
```

---

## Task 5: Create Browser Supabase Client

**Files:**
- Create: `template/lib/supabase/client.ts`

- [ ] **Step 1: Write client**

Create `template/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors. (We will define env types later via `.env.example` consumption — for now the `!` non-null assertion is acceptable per Supabase's official docs.)

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/client.ts
git commit -m "feat: add browser Supabase client"
```

---

## Task 6: Create Server Supabase Client

**Files:**
- Create: `template/lib/supabase/server.ts`

- [ ] **Step 1: Write server client**

Create `template/lib/supabase/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components cannot set cookies. Ignore — middleware refreshes the session.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/server.ts
git commit -m "feat: add server Supabase client (Server Components, Actions, Routes)"
```

---

## Task 7: Create Session-Refresh Middleware Helper

**Files:**
- Create: `template/lib/supabase/middleware.ts`

- [ ] **Step 1: Write middleware helper**

Create `template/lib/supabase/middleware.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh the session — this is the whole point of the middleware.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Auth gate: unauthenticated users are bounced from /(app)/* routes.
  const path = request.nextUrl.pathname;
  const isProtected =
    path.startsWith("/dashboard") ||
    path.startsWith("/account") ||
    path.startsWith("/notes");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/middleware.ts
git commit -m "feat: session-refresh + auth-gate middleware helper"
```

---

## Task 8: Wire Root middleware.ts

**Files:**
- Create: `template/middleware.ts`

- [ ] **Step 1: Write root middleware**

Create `template/middleware.ts`:

```ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Run on every request EXCEPT for static assets and Next internals.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 2: Typecheck and build**

```bash
npx tsc --noEmit && npm run build
```

Expected: success.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: enable session refresh middleware on all routes"
```

---

## Task 9: Create .env.example

**Files:**
- Create: `template/.env.example`
- Modify: `template/.gitignore`

- [ ] **Step 1: Write .env.example**

Create `template/.env.example`:

```bash
# ─────────────────────────────────────────────────────────────────────
# Supabase — get these from https://app.supabase.com/project/_/settings/api
# ─────────────────────────────────────────────────────────────────────

# Project URL (looks like https://xxxxx.supabase.co)
NEXT_PUBLIC_SUPABASE_URL=

# Public anon key — safe to expose; RLS protects your data
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Service role key — NEVER commit this; only used in server-side admin tasks.
# Keep blank locally if you're not using admin operations yet.
SUPABASE_SERVICE_ROLE_KEY=

# ─────────────────────────────────────────────────────────────────────
# App
# ─────────────────────────────────────────────────────────────────────

# Public URL of your deployed app — used in magic-link redirects.
# Local dev: http://localhost:3000
# Production: https://your-domain.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 2: Verify .env files are gitignored**

Read `template/.gitignore`. Confirm these lines are present (Next.js's default usually has them):

```
.env
.env.local
.env.production.local
.env.development.local
```

If missing, add them. **`.env.example` is NOT gitignored — that one IS committed.**

- [ ] **Step 3: Commit**

```bash
git add .env.example .gitignore
git commit -m "docs: add .env.example with all required variables documented"
```

---

## Task 10: Initialize Local Supabase and Write profiles Migration

**Files:**
- Create: `template/supabase/config.toml` (via `supabase init`)
- Create: `template/supabase/migrations/0001_profiles.sql`

- [ ] **Step 1: Initialize Supabase project**

```bash
cd template
npx supabase init
```

If asked about VS Code/IntelliJ settings, decline (`N`). Creates `supabase/config.toml` and `supabase/` directory structure.

- [ ] **Step 2: Write 0001_profiles.sql**

Create `template/supabase/migrations/0001_profiles.sql`:

```sql
-- Profiles table: 1-to-1 with auth.users, holds user-editable fields.
-- Created automatically on signup via trigger.

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Public profile data per user (1:1 with auth.users).';

-- Trigger: keep updated_at fresh on every UPDATE.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Trigger: auto-create a profile row when a new auth.users row is inserted.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security: locked down by default, every access must be explicit.
alter table public.profiles enable row level security;

-- Policy: users can read their own profile.
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- Policy: users can update their own profile.
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No INSERT policy: profiles are inserted by the trigger only.
-- No DELETE policy: profiles are deleted via auth.users cascade.
```

- [ ] **Step 3: Start local Supabase and run migration**

```bash
npx supabase start
```

Expected: starts Docker containers (Postgres, Auth, Studio, etc.). First run takes ~2 min downloading images. Outputs API URL, anon key, etc.

```bash
npx supabase db reset
```

Expected: applies migrations, creates `profiles` table.

- [ ] **Step 4: Verify schema**

```bash
npx supabase db dump --local --schema public | head -50
```

Expected: shows `create table public.profiles` and policies.

- [ ] **Step 5: Commit**

```bash
git add supabase/
git commit -m "feat(db): profiles table with RLS, auto-create trigger, updated_at trigger"
```

---

## Task 11: Write notes Migration with RLS

**Files:**
- Create: `template/supabase/migrations/0002_notes.sql`

- [ ] **Step 1: Write 0002_notes.sql**

Create `template/supabase/migrations/0002_notes.sql`:

```sql
-- Notes: example user-owned content with full RLS.
-- This table demonstrates the pattern for any "user has many X" feature.

create table public.notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  body        text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index notes_user_id_idx on public.notes (user_id);

comment on table public.notes is 'Example: each note belongs to one user. Demonstrates RLS pattern.';

create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

alter table public.notes enable row level security;

-- Users see only their own notes.
create policy "notes_select_own"
  on public.notes for select
  using (auth.uid() = user_id);

-- Users insert notes only as themselves (cannot forge user_id).
create policy "notes_insert_own"
  on public.notes for insert
  with check (auth.uid() = user_id);

-- Users update only their own notes.
create policy "notes_update_own"
  on public.notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users delete only their own notes.
create policy "notes_delete_own"
  on public.notes for delete
  using (auth.uid() = user_id);
```

- [ ] **Step 2: Apply migration**

```bash
npx supabase db reset
```

Expected: both migrations apply cleanly.

- [ ] **Step 3: Verify RLS is enabled**

```bash
npx supabase db dump --local --schema public | grep "row level security"
```

Expected: two lines, one for `profiles`, one for `notes`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0002_notes.sql
git commit -m "feat(db): notes table demonstrating full RLS pattern"
```

---

## Task 12: Add next-themes for Light/Dark Mode

**Files:**
- Create: `template/components/theme-provider.tsx`
- Create: `template/components/theme-toggle.tsx`
- Modify: `template/app/layout.tsx`

- [ ] **Step 1: Install next-themes**

```bash
cd template
npm install next-themes
```

- [ ] **Step 2: Add Lucide icons (used by theme toggle)**

```bash
npm install lucide-react
```

- [ ] **Step 3: Write ThemeProvider**

Create `template/components/theme-provider.tsx`:

```tsx
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

- [ ] **Step 4: Write ThemeToggle**

Create `template/components/theme-toggle.tsx`:

```tsx
"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const next = theme === "dark" ? "light" : "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} mode`}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
```

- [ ] **Step 5: Wire ThemeProvider into root layout**

Replace `template/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "vibe-starter",
  description: "Built with vibe-starter",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Verify build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(ui): light/dark mode via next-themes + ThemeToggle component"
```

---

## Task 13: Auth Action — signInWithMagicLink

**Files:**
- Create: `template/lib/actions/auth.ts`

- [ ] **Step 1: Write auth actions**

Create `template/lib/actions/auth.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signInWithMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Email is required." };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${siteUrl}/api/auth/callback` },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/auth.ts
git commit -m "feat(auth): server actions for magic link sign-in and sign-out"
```

---

## Task 14: Login Page

**Files:**
- Create: `template/app/(auth)/login/page.tsx`

- [ ] **Step 1: Write login page**

Create `template/app/(auth)/login/page.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { signInWithMagicLink } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function LoginPage() {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  async function action(formData: FormData) {
    startTransition(async () => {
      const result = await signInWithMagicLink(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        setSent(true);
      }
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            We&apos;ll email you a magic link — no password needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <p className="text-sm text-muted-foreground">
              Check your email for the magic link.
            </p>
          ) : (
            <form action={action} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Sending…" : "Send magic link"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 3: Commit**

```bash
git add app/\(auth\)/
git commit -m "feat(auth): login page with magic link form"
```

---

## Task 15: Auth Callback Route

**Files:**
- Create: `template/app/api/auth/callback/route.ts`

- [ ] **Step 1: Write callback handler**

Create `template/app/api/auth/callback/route.ts`:

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${url.origin}${next}`);
    }
  }

  return NextResponse.redirect(`${url.origin}/login?error=auth-callback-failed`);
}
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 3: Commit**

```bash
git add app/api/
git commit -m "feat(auth): callback route exchanges code for session"
```

---

## Task 16: Dashboard Page (Protected)

**Files:**
- Create: `template/app/(app)/dashboard/page.tsx`
- Create: `template/app/(app)/layout.tsx`

- [ ] **Step 1: Write (app) group layout with header + theme toggle + sign out**

Create `template/app/(app)/layout.tsx`:

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between p-4">
          <nav className="flex gap-4 text-sm">
            <Link href="/dashboard" className="font-semibold">
              vibe-starter
            </Link>
            <Link href="/notes" className="text-muted-foreground hover:text-foreground">
              Notes
            </Link>
            <Link href="/account" className="text-muted-foreground hover:text-foreground">
              Account
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action={signOut}>
              <Button variant="ghost" size="sm">Sign out</Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-4">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Write dashboard page**

Create `template/app/(app)/dashboard/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Welcome</h1>
      <p className="text-muted-foreground">Signed in as {user?.email}</p>
    </div>
  );
}
```

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/
git commit -m "feat(app): protected dashboard with shared layout, header, sign-out"
```

---

## Task 17: Profile Action and Account Page

**Files:**
- Create: `template/lib/actions/profile.ts`
- Create: `template/app/(app)/account/page.tsx`

- [ ] **Step 1: Write profile update action**

Create `template/lib/actions/profile.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/account");
  return { success: true };
}
```

- [ ] **Step 2: Write account page**

Create `template/app/(app)/account/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user!.id)
    .single();

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-2xl font-bold">Account</h1>
      <form action={updateProfile} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={profile?.email ?? ""} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            name="full_name"
            defaultValue={profile?.full_name ?? ""}
          />
        </div>
        <Button type="submit">Save</Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 4: Commit**

```bash
git add lib/actions/profile.ts app/\(app\)/account/
git commit -m "feat(app): account page with profile editing"
```

---

## Task 18: Notes Server Actions

**Files:**
- Create: `template/lib/actions/notes.ts`

- [ ] **Step 1: Write actions**

Create `template/lib/actions/notes.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createNote(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "");
  if (!title) return { error: "Title is required." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("notes")
    .insert({ user_id: user.id, title, body });

  if (error) return { error: error.message };

  revalidatePath("/notes");
  redirect("/notes");
}

export async function updateNote(id: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "");
  if (!title) return { error: "Title is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("notes")
    .update({ title, body })
    .eq("id", id);
  // RLS ensures: only the owner's own note matches.

  if (error) return { error: error.message };

  revalidatePath("/notes");
  revalidatePath(`/notes/${id}`);
  redirect("/notes");
}

export async function deleteNote(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/notes");
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/notes.ts
git commit -m "feat(notes): create/update/delete server actions"
```

---

## Task 19: Notes List, New, Edit Pages

**Files:**
- Create: `template/app/(app)/notes/page.tsx`
- Create: `template/app/(app)/notes/new/page.tsx`
- Create: `template/app/(app)/notes/[id]/page.tsx`
- Create: `template/components/notes/note-form.tsx`

- [ ] **Step 1: Write reusable note form component**

Create `template/components/notes/note-form.tsx`:

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type NoteFormProps = {
  action: (formData: FormData) => void | Promise<void | { error?: string }>;
  defaults?: { title?: string; body?: string };
  submitLabel?: string;
};

export function NoteForm({ action, defaults, submitLabel = "Save" }: NoteFormProps) {
  return (
    <form action={action} className="space-y-4 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={defaults?.title ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">Body</Label>
        <textarea
          id="body"
          name="body"
          rows={10}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          defaultValue={defaults?.body ?? ""}
        />
      </div>
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
```

- [ ] **Step 2: Write notes list page**

Create `template/app/(app)/notes/page.tsx`:

```tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NotesPage() {
  const supabase = await createClient();
  const { data: notes } = await supabase
    .from("notes")
    .select("id, title, body, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notes</h1>
        <Button asChild>
          <Link href="/notes/new">New note</Link>
        </Button>
      </div>
      {!notes || notes.length === 0 ? (
        <p className="text-muted-foreground">No notes yet. Create your first one.</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Link href={`/notes/${n.id}`} className="hover:underline">
                      {n.title}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{n.body}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Write new note page**

Create `template/app/(app)/notes/new/page.tsx`:

```tsx
import { createNote } from "@/lib/actions/notes";
import { NoteForm } from "@/components/notes/note-form";

export default function NewNotePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">New note</h1>
      <NoteForm action={createNote} submitLabel="Create" />
    </div>
  );
}
```

- [ ] **Step 4: Write edit note page**

Create `template/app/(app)/notes/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateNote, deleteNote } from "@/lib/actions/notes";
import { NoteForm } from "@/components/notes/note-form";
import { Button } from "@/components/ui/button";

type Params = Promise<{ id: string }>;

export default async function EditNotePage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: note } = await supabase
    .from("notes")
    .select("id, title, body")
    .eq("id", id)
    .single();

  if (!note) notFound();

  const updateAction = updateNote.bind(null, note.id);
  const deleteAction = deleteNote.bind(null, note.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit note</h1>
      <NoteForm
        action={updateAction}
        defaults={{ title: note.title, body: note.body }}
        submitLabel="Save"
      />
      <form action={deleteAction}>
        <Button type="submit" variant="destructive">Delete</Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 5: Build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 6: Commit**

```bash
git add app/\(app\)/notes/ components/notes/
git commit -m "feat(notes): list, create, edit, delete UI"
```

---

## Task 20: Public Landing Redirect

**Files:**
- Modify: `template/app/page.tsx`

- [ ] **Step 1: Replace default landing with auth-aware redirect**

Replace `template/app/page.tsx` with:

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  redirect(user ? "/dashboard" : "/login");
}
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: root route redirects based on auth state"
```

---

## Task 21: Vitest Unit Test Setup

**Files:**
- Create: `template/vitest.config.ts`
- Create: `template/tests/unit/utils.test.ts`
- Modify: `template/package.json` (scripts + devDeps)

- [ ] **Step 1: Install Vitest**

```bash
cd template
npm install -D vitest @vitejs/plugin-react jsdom
```

- [ ] **Step 2: Write vitest.config.ts**

Create `template/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

- [ ] **Step 3: Write a unit test for `cn()` (sanity check)**

Create `template/tests/unit/utils.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn()", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("dedupes tailwind conflicts (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("ignores falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});
```

- [ ] **Step 4: Add npm script**

Edit `template/package.json`. Add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Run tests**

```bash
npm test
```

Expected: 3 tests passing.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "test: Vitest setup with cn() unit test"
```

---

## Task 22: Playwright E2E Smoke Test

**Files:**
- Create: `template/playwright.config.ts`
- Create: `template/tests/e2e/auth.spec.ts`
- Modify: `template/package.json`

- [ ] **Step 1: Install Playwright**

```bash
cd template
npm install -D @playwright/test
npx playwright install --with-deps chromium
```

- [ ] **Step 2: Write playwright.config.ts**

Create `template/playwright.config.ts`:

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
```

- [ ] **Step 3: Write smoke test**

Create `template/tests/e2e/auth.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("unauthenticated user is redirected to /login from /dashboard", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText("Sign in")).toBeVisible();
});

test("login form submits magic link request", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByRole("button", { name: /send magic link/i }).click();
  // Either success state or an error toast — both prove the form submitted.
  await expect(page.getByText(/check your email|invalid/i)).toBeVisible({ timeout: 10_000 });
});
```

- [ ] **Step 4: Add npm script**

Edit `template/package.json`. Add to `"scripts"`:

```json
"test:e2e": "playwright test"
```

- [ ] **Step 5: Run smoke test against local Supabase**

Ensure local Supabase is running (`npx supabase status`). Create a `.env.local` with the local values printed by `supabase start`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<copy from supabase status>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

(The `.env.local` is gitignored. This is just for local verification.)

Run:

```bash
npm run test:e2e
```

Expected: 2 tests passing.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "test(e2e): Playwright smoke tests for auth gate and login form"
```

---

## Task 23: GitHub Actions CI

**Files:**
- Create: `template/.github/workflows/ci.yml`

- [ ] **Step 1: Write CI workflow**

Create `template/.github/workflows/ci.yml`:

```yaml
name: ci

on:
  push:
    branches: [main]
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm run lint
      - run: npm test
      - run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: https://placeholder.supabase.co
          NEXT_PUBLIC_SUPABASE_ANON_KEY: placeholder
          NEXT_PUBLIC_SITE_URL: https://placeholder.example.com
```

(E2E tests are NOT in CI here because they need a real or local Supabase. We add E2E to a separate workflow in Plan 2/3 once the test-DB story is solid.)

- [ ] **Step 2: Commit**

```bash
git add .github/
git commit -m "ci: typecheck, lint, unit tests, build on every PR"
```

---

## Task 24: Vercel Configuration

**Files:**
- Create: `template/vercel.json`

- [ ] **Step 1: Write vercel.json**

Create `template/vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "buildCommand": "next build",
  "regions": ["fra1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add vercel.json
git commit -m "feat(deploy): Vercel config with security headers + EU region"
```

---

## Task 25: VERSIONS.md, Bump Script, README, Progress/Decisions Scaffolds

**Files:**
- Create: `template/docs/VERSIONS.md`
- Create: `template/scripts/bump-versions.sh`
- Modify: `template/README.md`
- Create: `template/CHANGELOG.md`
- Create: `template/PROGRESS.md`
- Create: `template/DECISIONS.md`

- [ ] **Step 1: Write VERSIONS.md**

Create `template/docs/VERSIONS.md`:

```markdown
# Versions

Source of truth for the dependency versions this template was last tested with.
Update this file whenever the bump script runs successfully.

## Last tested

| Package | Version | Date |
| --- | --- | --- |
| Next.js | 16.3.0 | 2026-04-30 |
| React | 19.x | 2026-04-30 |
| TypeScript | 5.x | 2026-04-30 |
| Tailwind CSS | 4.2.x | 2026-04-30 |
| @supabase/ssr | latest | 2026-04-30 |
| @supabase/supabase-js | latest | 2026-04-30 |
| next-themes | latest | 2026-04-30 |
| Vitest | latest | 2026-04-30 |
| Playwright | latest | 2026-04-30 |
| Node.js | 22 LTS | 2026-04-30 |

## Migration notes

When you bump a major version, append a section here describing what changed
and what the template needed to update. Future maintainers will thank you.

### Next.js 17 (placeholder — when it ships)

- TBD
```

- [ ] **Step 2: Write bump script**

Create `template/scripts/bump-versions.sh`:

```bash
#!/usr/bin/env bash
# Update all dependencies to latest, verify the template still builds.
# Run from template/ root. Commit the result on a branch and PR it.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "→ Updating dependencies"
npx --yes npm-check-updates -u

echo "→ Installing"
npm install

echo "→ Typechecking"
npx tsc --noEmit

echo "→ Linting"
npm run lint

echo "→ Running unit tests"
npm test

echo "→ Building"
npm run build

echo "✓ All green. Update docs/VERSIONS.md with today's date and commit."
```

```bash
chmod +x template/scripts/bump-versions.sh
```

- [ ] **Step 3: Write README**

Replace `template/README.md` with:

```markdown
# vibe-starter (template)

Production-ready scaffold for vibe-coded apps. Next.js 16 + Supabase + Vercel,
with auth, RLS, light/dark UI, and CI all pre-wired.

## Quick start (manual setup — until /setup is built in Plan 2)

```bash
# 1. Clone or "Use this template" on GitHub
git clone <your-repo> my-app && cd my-app
npm install

# 2. Start a local Supabase
npx supabase start
# Note the API URL and anon key it prints.

# 3. Apply migrations
npx supabase db reset

# 4. Configure env
cp .env.example .env.local
# Paste the values from `supabase start` into .env.local.

# 5. Run dev server
npm run dev
# Open http://localhost:3000 — you'll be redirected to /login.
```

## What's inside

- **Auth**: Magic-link sign-in, session-refresh middleware, protected `/dashboard`, `/account`, `/notes`.
- **Database**: `profiles` (1:1 with auth.users) and `notes` (example user-owned content), both with full RLS.
- **UI**: shadcn/ui, Tailwind v4, light/dark mode toggle.
- **Tests**: Vitest unit tests, Playwright e2e smoke tests.
- **CI**: typecheck, lint, unit tests, build on every PR.
- **Deploy**: `vercel.json` with security headers, EU region default.

## Folder layout

See `docs/VERSIONS.md` for the dependency versions this template was last tested with,
and `scripts/bump-versions.sh` to update everything.
```

- [ ] **Step 4: Initial CHANGELOG**

Create `template/CHANGELOG.md`:

```markdown
# Changelog

All notable changes to this template (NOT to projects created from it).

## Unreleased

### Added
- Initial Next.js 16 + Supabase + Vercel scaffold.
- Magic-link auth + session-refresh middleware.
- `profiles` and `notes` migrations with full RLS.
- shadcn/ui components, light/dark mode.
- Vitest + Playwright test setup.
- GitHub Actions CI.
- `docs/VERSIONS.md`, `scripts/bump-versions.sh`.
```

- [ ] **Step 5: Scaffold PROGRESS.md**

Create `template/PROGRESS.md`:

```markdown
# Project Progress

> This file is the shared memory between you and your coding agent.
> Edit it freely — the agent reads it at the start of every session.

## Vision

<!-- What are you building, and for whom? Replace this with one or two sentences. -->
TBD — describe what you're building.

## Idea Backlog

<!-- Drop ideas here as they come to you. The agent picks from this list when you say "let's build the next feature". -->

- [ ] (your idea)

## Built So Far

<!-- The agent appends here after every shipped feature. -->

- (nothing yet)

## Open Questions

<!-- Decisions you haven't made yet. The agent flags new ones here. -->

- (none)
```

- [ ] **Step 6: Scaffold DECISIONS.md**

Create `template/DECISIONS.md`:

```markdown
# Architecture Decisions

Lightweight ADR log. Append-only — when a decision is reversed, add a new
entry that supersedes the old one rather than editing history.

Format per entry:

```
## YYYY-MM-DD — Short title

**Status:** active | superseded by <date>

**Context:** What problem are we solving?

**Decision:** What did we decide?

**Why:** Reasoning. Why this and not the alternatives?

**Trade-off:** What we give up by choosing this.
```

---

## 2026-04-30 — Use @supabase/ssr instead of @supabase/auth-helpers-nextjs

**Status:** active

**Context:** Need a Supabase client that works correctly with Next.js App Router (Server Components, Server Actions, Route Handlers, Middleware).

**Decision:** Use `@supabase/ssr`.

**Why:** `@supabase/auth-helpers-nextjs` is officially deprecated. Supabase recommends `@supabase/ssr` for all new projects.

**Trade-off:** Slightly more boilerplate (we manage cookie reading/writing ourselves) — but it's the supported path.

## 2026-04-30 — Magic-link auth as the default, no passwords

**Status:** active

**Context:** Need user authentication that's secure, low-friction, and doesn't require us to handle password recovery flows.

**Decision:** Magic-link sign-in via Supabase Auth.

**Why:** Zero password-management code, no "forgot password" flow, fewer security pitfalls. Good UX on mobile (tap a link in your inbox).

**Trade-off:** Users must have an email client open to sign in. Could add OAuth (Google, GitHub) later if needed.
```

- [ ] **Step 7: Commit**

```bash
git add docs/ scripts/ README.md CHANGELOG.md PROGRESS.md DECISIONS.md
git commit -m "docs: README, VERSIONS, CHANGELOG, PROGRESS, DECISIONS, bump script"
```

---

## Task 26: Final Verification

- [ ] **Step 1: Run full check**

```bash
cd template
npx tsc --noEmit
npm run lint
npm test
npm run build
```

Expected: every command exits 0.

- [ ] **Step 2: Manual smoke test**

```bash
npx supabase start  # if not already running
# Update .env.local with values from supabase status
npm run dev
```

Open http://localhost:3000 in a browser:

- Should redirect to `/login`.
- Enter an email → click "Send magic link".
- Open Inbucket at http://127.0.0.1:54324 (Supabase's local mail catcher) → click the magic link.
- Should land on `/dashboard`, signed in.
- Click `/notes` → create a note → edit it → delete it.
- Click `/account` → set full name → save.
- Toggle dark mode.
- Click sign out → land back on `/login`.

If any of those fail, fix in a follow-up commit.

- [ ] **Step 3: Stop local services**

```bash
npx supabase stop
```

- [ ] **Step 4: Final commit if any cleanup**

```bash
git status
# If clean, you're done.
# If any tweaks were needed:
git add -A
git commit -m "chore: final verification fixes"
```

---

## What ships when this plan is complete

A `vibe-starter/template/` directory with a fully working Next.js + Supabase + Vercel app:

- Anyone can clone it, run the manual quick-start, and have a working auth flow with example CRUD in <10 minutes.
- All RLS policies are correct — a user only sees their own data.
- Build passes, tests pass, CI is wired up.
- Light/dark mode works, basic UI is polished via shadcn.

**What's NOT done yet (Plan 2):** the `/setup` skill that automates GitHub repo creation, Supabase project creation, Vercel linking, env-var pushing, and first deploy. Until then, users do it manually per the README.
