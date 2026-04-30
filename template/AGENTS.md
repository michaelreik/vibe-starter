# AGENTS.md — Next.js 16 + Supabase notes

This template runs on **Next.js 16** (App Router, React 19, Turbopack)
and **`@supabase/ssr`** — both newer than most LLM training data.
A few non-obvious patterns to honor:

## Next.js 16

- `cookies()` from `next/headers` is **async**: `const cookieStore = await cookies();`
- Route handler `params` is a **Promise**: `type Params = Promise<{ id: string }>;` then `const { id } = await params;`
- Server Actions used directly in `<form action={...}>` must return `void` or `Promise<void>`. To return error objects, wrap them in a client component using `useTransition` (see `components/notes/note-form.tsx`).
- Read live framework docs at `node_modules/next/dist/docs/` if anything feels unfamiliar.

## @supabase/ssr (NOT @supabase/auth-helpers-nextjs)

- Browser client: `import { createClient } from "@/lib/supabase/client";`
- Server client (Server Components, Actions, Routes): `import { createClient } from "@/lib/supabase/server"; const supabase = await createClient();` — note the `await`.
- Middleware session refresh lives in `lib/supabase/middleware.ts`; it also enforces the auth gate for `/dashboard`, `/account`, `/notes`.

## RLS is mandatory

Every user-owned table MUST have:
- `alter table public.<name> enable row level security;`
- Policies covering each command the app uses (see `supabase/migrations/0002_notes.sql` for the canonical four-policy pattern).

Without RLS, anon-key requests return all rows from anyone — a guaranteed data leak in production.

## shadcn/ui (4.x)

- Built on `@base-ui/react`, NOT Radix. The `asChild` prop is not supported on `Button`.
- For "button that navigates", use `<Link href="..." className={buttonVariants()}>...</Link>`.
