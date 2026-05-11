# vibe-starter On-Demand Skills Implementation Plan (Plan 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three opt-in skills that aren't part of the default scaffold but light up on demand: transactional email (Resend), internationalization (next-intl), and custom domain + DNS (Cloudflare-first, with Vercel SSL via LetsEncrypt automatic). After Plan 4, vibe coders can `/add-email`, `/add-i18n`, or `/add-domain` whenever they need those capabilities.

**Architecture:** Markdown skills under `template/.claude/skills/<name>/SKILL.md`. Slash commands under `template/.claude/commands/<command>.md`. Each skill walks the user through whatever account creation / API key step is needed, modifies code in place to wire the integration, runs tests, and commits.

**Tech Stack:** Resend (email), next-intl (i18n), Cloudflare API + Vercel CLI (DNS + SSL).

**Working directory:** `/Users/michaelreikersdorfer/Development/vibe-starter/template/`. Parent repo on branch `feat/ondemand-skills`.

---

## Skill catalog

| Skill | Purpose | Trigger |
| --- | --- | --- |
| `add-email` | Wire Resend for transactional email; optionally swap Supabase auth SMTP | `/add-email` |
| `add-i18n` | Wire next-intl for multi-language support | `/add-i18n` |
| `add-custom-domain` | Point a custom domain to Vercel; auto SSL via LetsEncrypt | `/add-domain` |

---

## Tasks

### Task 1: add-email SKILL
- File: `template/.claude/skills/add-email/SKILL.md`
- Slash command: `template/.claude/commands/add-email.md`

### Task 2: add-i18n SKILL
- File: `template/.claude/skills/add-i18n/SKILL.md`
- Slash command: `template/.claude/commands/add-i18n.md`

### Task 3: add-custom-domain SKILL
- File: `template/.claude/skills/add-custom-domain/SKILL.md`
- Slash command: `template/.claude/commands/add-domain.md`

### Task 4: Update CHANGELOG, CLAUDE.md, README

Reflect the three new skills in the skill catalog.

### Task 5: Final verification

Build/lint/test still pass; frontmatter is well-formed.

---

## What ships

A vibe coder can:
- `/add-email` → agent walks them through getting a Resend API key, installs `resend`, scaffolds `lib/email/`, writes a sample template, optionally configures Supabase to send auth emails via Resend SMTP.
- `/add-i18n` → agent walks them through choosing locales, scaffolds the `[locale]` route group, migrates strings to `t()` calls, sets up `messages/<locale>.json`.
- `/add-domain` → agent asks "do you have a domain already?", picks the right path (Cloudflare API automation, manual instructions for other registrars, or Cloudflare-account-creation suggestion), wires DNS, verifies on Vercel, confirms SSL.
