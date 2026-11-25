---
name: add-email
description: Wire Resend for transactional email — install the SDK, scaffold lib/email/, add a sample template, and optionally point Supabase auth emails through Resend SMTP. Use when the user invokes /add-email or says "send emails", "transactional email", "welcome email".
---

# add-email Skill

You are adding email-sending capability to a vibe-starter project. The
default choice is **Resend** — best DX, generous free tier (3,000/month,
100/day), official Vercel partner. Don't pick anything else unless the
user explicitly asks.

## When to invoke

- `/add-email` slash command.
- User says "send a welcome email", "I need transactional emails", "configure SMTP".

## Pre-flight

If `.vibe-state.json` is missing or `vercel_project_id` is unset, the
project hasn't been onboarded. Recommend `/setup` first and stop.

## Steps

### 1. Resend account + API key (user-driven)

**The key never goes through the chat.** Do not ask the user to paste it and
do not read or print `.env.local`. Run:

```bash
node scripts/env-tool.mjs init
node scripts/env-tool.mjs check RESEND_API_KEY re_
```

If the check passes, the key is already there: continue with the next step. Otherwise:

```bash
node scripts/env-tool.mjs slot RESEND_API_KEY
node scripts/env-tool.mjs open
```

Then tell the user, in their language:

> "I've opened your key box (`.env.local`). Please create a Resend key: sign up at https://resend.com/signup (free), then API Keys → Create API Key → Sending access. Paste it directly after `RESEND_API_KEY=`, save the file, and write 'done' here. Please don't paste the key into this chat."

When they say done, run the `check` again. If it fails, explain what is wrong
(missing, or not starting with `re_`) and let them fix the file. If the user
pastes a key into the chat anyway, tell them kindly to revoke it at Resend and
create a new one, because the chat history keeps it.

If the user wants to send from a custom domain (e.g., `hello@yourapp.com`),
they need to verify the domain on Resend (Dashboard → Domains). For now,
Resend lets unverified accounts send from `onboarding@resend.dev` for
testing — that's acceptable to wire the integration; tell the user to
add their custom domain later via Resend's UI.

### 2. Install dependencies

```bash
cd <project-root>
npm install resend react-email @react-email/components
```

`react-email` is the templating story (TSX components compiled to email-safe HTML). It's optional but the canonical Resend pairing — install it.

### 3. Scaffold lib/email/

Create `lib/email/client.ts`:

```ts
import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_ADDRESS =
  process.env.EMAIL_FROM ?? "onboarding@resend.dev";
```

Create `lib/email/send.ts`:

```ts
import { resend, FROM_ADDRESS } from "./client";

type SendArgs = {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  replyTo?: string;
};

export async function sendEmail({ to, subject, react, replyTo }: SendArgs) {
  const result = await resend.emails.send({
    from: FROM_ADDRESS,
    to: Array.isArray(to) ? to : [to],
    subject,
    react,
    replyTo,
  });
  if (result.error) {
    throw new Error(`Email send failed: ${result.error.message}`);
  }
  return result.data;
}
```

Create a sample welcome template at `lib/email/templates/welcome.tsx`:

```tsx
import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Button,
} from "@react-email/components";

type WelcomeEmailProps = {
  appName: string;
  appUrl: string;
};

export function WelcomeEmail({ appName, appUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
        <Container>
          <Heading>Welcome to {appName}</Heading>
          <Text>Thanks for signing up. Click below to get started:</Text>
          <Button
            href={appUrl}
            style={{
              background: "#000",
              color: "#fff",
              padding: "12px 20px",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            Open {appName}
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
```

### 4. Document env vars

Append to `.env.example`:

```bash

# ─────────────────────────────────────────────────────────────────────
# Resend (https://resend.com) — transactional email
# ─────────────────────────────────────────────────────────────────────

# API key from https://resend.com/api-keys (starts with re_)
RESEND_API_KEY=

# From-address. Use onboarding@resend.dev for unverified testing,
# or your verified domain (e.g. hello@yourapp.com).
EMAIL_FROM=onboarding@resend.dev
```

Set the from-address locally (not a secret):

```bash
node scripts/env-tool.mjs set EMAIL_FROM onboarding@resend.dev
```

### 5. Push env vars to Vercel

The tool reads the values from `.env.local`, so nothing is shown:

```bash
node scripts/env-tool.mjs push RESEND_API_KEY EMAIL_FROM
```

They take effect with the next deploy (`/ship`).

### 6. Optional: route Supabase auth emails through Resend

By default Supabase uses its own SMTP with a hard ~3-emails-per-hour limit
on free tier. For production auth emails at scale, swap to Resend SMTP.

Ask the user: "Do you want Supabase to send auth emails (password reset,
invites) via Resend? This raises the rate limit and improves
deliverability. (yes/no)"

If yes:
1. Resend Dashboard → SMTP. Note host, port, username (`resend`), password (an SMTP-specific token).
2. In Supabase Dashboard → Project Settings → Auth → SMTP Settings:
   - Enable Custom SMTP
   - Host: `smtp.resend.com`
   - Port: `465` (SSL)
   - Username: `resend`
   - Password: the token from step 1
   - Sender email: must match `EMAIL_FROM` (a verified domain on Resend, NOT `onboarding@resend.dev` — Supabase rejects that)
3. Save. Test by triggering a password-reset email from the login flow
   (or via Supabase dashboard → Authentication → Users → "Send password
   recovery").

If user doesn't have a verified domain yet, skip this step — recommend doing it after `/add-domain`.

### 7. Test the basic send

Add a quick smoke command (don't ship as a real route — this is for verification):

```bash
node --env-file=.env.local --input-type=module -e "
import { Resend } from 'resend';
const r = new Resend(process.env.RESEND_API_KEY);
const { data, error } = await r.emails.send({
  from: 'onboarding@resend.dev',
  to: 'delivered@resend.dev',
  subject: 'Test',
  text: 'It works.'
});
console.log(error || data);
"
```

`delivered@resend.dev` is Resend's test address — it accepts emails without sending them, so this won't waste your quota. Expect `{ id: '...' }` printed.

### 8. Commit

Make sure `.env.local` is not staged.

```bash
git add lib/email/ .env.example package.json package-lock.json
git -c commit.gpgsign=false commit -m "feat(email): wire Resend for transactional emails

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Edge cases

- **Resend free tier exceeded** (3,000/month or 100/day): tell user; they can upgrade ($20/mo for 50k) or wait until next month.
- **API key invalid**: Resend returns a clear error. Surface it.
- **User wants something other than Resend**: Postmark, SES, Mailgun all work. The interface in `lib/email/send.ts` is small enough to swap. Don't refactor proactively — only if user asks.

## What you do NOT do

- Hard-code API keys in source.
- Ask for keys in the chat, or read or print `.env.local`.
- Send real emails to real addresses during smoke tests — use `delivered@resend.dev`.
- Skip pushing env vars to Vercel and then wonder why prod can't send email.
