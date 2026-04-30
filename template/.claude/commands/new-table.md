---
description: Generate a new Supabase table migration with the canonical 4-policy RLS pattern, apply locally, and push to remote if linked.
---

Run the `add-supabase-table` skill. Read `.claude/skills/add-supabase-table/SKILL.md`
and follow it exactly. Pick the next migration number, write the SQL with
RLS, apply via `npx supabase db reset` to verify, then push if linked.

Table description from user: $ARGUMENTS
