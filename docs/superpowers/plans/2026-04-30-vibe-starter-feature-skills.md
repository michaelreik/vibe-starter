# vibe-starter Feature-Loop Skills Implementation Plan (Plan 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the six feature-loop skills that turn a `/setup`-bootstrapped project into an iterative vibe-coding loop. After Plan 3 a vibe coder can say "add a recipes feature" and the agent walks through the right steps automatically (migration with RLS → server actions → UI → tests → PROGRESS update).

**Architecture:** Markdown skills under `template/.claude/skills/<name>/SKILL.md`. Slash commands under `template/.claude/commands/<command>.md`. Skills compose: `add-feature` is the master that calls into `add-supabase-table`, `add-rls-policy`, `update-progress`, and `deploy-to-production`.

**Tech Stack:** Markdown only. The agent invokes the skills as instructions; no executable code ships.

**Working directory for all tasks:** `/Users/michaelreikersdorfer/Development/vibe-starter/template/`. Parent repo on branch `feat/feature-skills`.

---

## Skill catalog (Plan 3 deliverables)

| Skill | Purpose | Trigger |
| --- | --- | --- |
| `add-feature` | Orchestrate a full feature: migration → RLS → actions → UI → tests → progress | `/new-feature`, "let's build X" |
| `add-supabase-table` | Generate a migration with the right RLS pattern; apply locally and push | `/new-table` |
| `add-rls-policy` | Add or audit RLS policies on an existing table | "is this table secure?" |
| `update-progress` | Maintain `PROGRESS.md` (move ideas → built, append entries) | After any feature ships |
| `deploy-to-production` | Build, commit, push, wait for Vercel, smoke-check live URL | `/ship` |
| `debug-supabase` | Decision tree for common Supabase auth/RLS bugs | "auth not working", "I can't see my data" |

Slash commands shipped together: `/new-feature`, `/new-table`, `/ship`, `/status`.

---

## Task 1: Write add-feature SKILL.md

**Files:** `template/.claude/skills/add-feature/SKILL.md`

- [ ] **Step 1: Create skill content** — see Task 1 content block in the implementation log below; commit after Task 6.

## Task 2: Write add-supabase-table SKILL.md

**Files:** `template/.claude/skills/add-supabase-table/SKILL.md`

## Task 3: Write add-rls-policy SKILL.md

**Files:** `template/.claude/skills/add-rls-policy/SKILL.md`

## Task 4: Write update-progress SKILL.md

**Files:** `template/.claude/skills/update-progress/SKILL.md`

## Task 5: Write deploy-to-production SKILL.md

**Files:** `template/.claude/skills/deploy-to-production/SKILL.md`

## Task 6: Write debug-supabase SKILL.md

**Files:** `template/.claude/skills/debug-supabase/SKILL.md`

## Task 7: Slash commands

**Files:**
- `template/.claude/commands/new-feature.md`
- `template/.claude/commands/new-table.md`
- `template/.claude/commands/ship.md`
- `template/.claude/commands/status.md`

## Task 8: Update CHANGELOG, CLAUDE.md, and README

**Files:**
- `template/CHANGELOG.md` — add Plan 3 entries
- `template/CLAUDE.md` — replace the "use add-feature when available" placeholder with real instructions
- `template/README.md` — list the new skills/commands under "Agent skills"

## Task 9: Final verification

- [ ] All skill files have valid YAML frontmatter
- [ ] Build/lint/test still pass
- [ ] No commits to feat/foundation or feat/setup-skill (only feat/feature-skills)

---

## What ships

After Plan 3, a vibe coder running on this template can:

1. Say "add a recipes feature where users save recipes" → agent runs `add-feature` skill end-to-end.
2. Type `/new-table comments` → agent runs `add-supabase-table` for a `comments` table with RLS.
3. Type `/ship` after a series of changes → agent runs `deploy-to-production`.
4. Type `/status` → agent reads `PROGRESS.md` and gives a one-paragraph summary.
5. When something breaks, say "auth isn't working in prod" → agent uses `debug-supabase`.

The skills are deliberately opinionated: every new table gets RLS, every feature touches `PROGRESS.md`, every deploy is verified on the live URL.
