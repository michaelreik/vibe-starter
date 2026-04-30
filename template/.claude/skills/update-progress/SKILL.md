---
name: update-progress
description: Maintain PROGRESS.md after a feature ships, an idea moves, or a question is answered. Always invoke after any feature work to keep project memory current.
---

# update-progress Skill

`PROGRESS.md` is the shared memory between sessions. If it goes stale,
future-you (and the user) lose the thread. Keep it fresh.

## When to invoke

- Right after `add-feature` ships a feature.
- After `deploy-to-production` succeeds.
- When the user adds a new idea ("hey can we maybe also do X?" → backlog).
- When an open question gets answered.
- Periodically when reviewing the project.

## Read the current state

```bash
cat PROGRESS.md
```

The file has four sections:
1. **Vision** — usually written by the user once; only edit if user explicitly says vision changed
2. **Idea Backlog** — checkboxes
3. **Built So Far** — dated bullets, append-only
4. **Open Questions** — active questions

## Apply updates based on context

### Move an item from Backlog to Built

If the just-shipped feature corresponds to a backlog entry:
1. Remove the entry from "Idea Backlog" (delete the line)
2. Add to "Built So Far": `- YYYY-MM-DD: <feature description>`

### Append a Built entry without a backlog source

For something the user asked to build that wasn't in the backlog:
- Add to Built So Far directly with today's date

### Add a new backlog item

When the user mentions a future feature:
- Add a `- [ ] <description>` to Idea Backlog

### Resolve an Open Question

When something gets decided:
- Remove the question from Open Questions
- Consider adding to `DECISIONS.md` if it was an architecture choice

### Add a new Open Question

When something is unresolved and worth tracking:
- Add to Open Questions

## Format conventions

- **Dates** in `YYYY-MM-DD` format
- **Built So Far entries** are short — one line per feature, not a paragraph
- **Backlog entries** are imperative ("add X") not aspirational ("would be nice to have X")
- Don't reorder existing entries unless asked

## Commit

```bash
git add PROGRESS.md
git -c commit.gpgsign=false commit -m "docs(progress): <short description of update>"
```

If you're committing PROGRESS.md as part of a larger feature commit, fold
it in there instead of a separate commit.

## Edge cases

- **PROGRESS.md missing**: re-create from the template in `.claude/skills/setup-project/SKILL.md` (look for the structure used in the original scaffold).
- **User wants to wipe the backlog**: don't auto-clear; ask which entries are still relevant.
- **File format drifted** (user added new sections): preserve their structure; don't auto-rewrite.

## What you do NOT do

- Edit "Built So Far" entries from the past — they're history.
- Move items between sections without confirming the move makes sense.
- Add features to "Built So Far" that haven't actually shipped (no commits / no deploy).
