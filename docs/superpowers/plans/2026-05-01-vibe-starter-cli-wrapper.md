# vibe-starter CLI Wrapper Implementation Plan (Plan 5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship a small npm package called `create-vibe-app` that wraps the template repo so vibe coders can scaffold a new project with `npx create-vibe-app my-idea`. The CLI clones the template, renames the project, initializes git, and prints next steps. Together with the template repo, this is the second of the two artifacts originally specced as "Phase 1 + 1.5".

**Architecture:** Plain Node.js CLI in `cli/` (sibling of `template/`). No TypeScript build step — direct ES modules. Uses `degit` to fetch a snapshot of the template from GitHub (or a local path during development). The CLI is deliberately small (~150 lines) so future maintenance is easy.

**Tech Stack:** Node 22+, ESM, `degit` for fetching, no other runtime deps.

**Working directory:** `/Users/michaelreikersdorfer/Development/vibe-starter/`. Parent repo on branch `feat/cli-wrapper`.

---

## File Structure

```
vibe-starter/
├── cli/
│   ├── bin/
│   │   └── create-vibe-app.js    # shebang entry point
│   ├── src/
│   │   ├── index.js              # main logic
│   │   ├── prompts.js            # readline prompts
│   │   └── scaffold.js           # clone + customize
│   ├── package.json
│   ├── README.md
│   └── .gitignore
└── docs/...
```

---

## Tasks

### Task 1: Initialize cli/ package

- Create `cli/package.json` (name `create-vibe-app`, type module, bin entry, dep `degit`)
- Create `cli/.gitignore`

### Task 2: Write bin/create-vibe-app.js

Tiny shebang script that imports and runs `src/index.js`.

### Task 3: Write src/scaffold.js

Function `scaffold({ name, target, templateSource })` that:
- Uses `degit` to fetch template into `target`
- Replaces `"name": "template"` in `package.json` with `"name": <name>`
- Replaces `vibe-starter (template)` heading in README with `<name>` (best-effort; users can edit)
- Runs `git init` in the target directory

### Task 4: Write src/prompts.js

Minimal prompt for project name if not given as argv. Supports both interactive (readline) and non-interactive (env var or default).

### Task 5: Write src/index.js

Wires it all together: parse argv, prompt if needed, scaffold, print next-steps.

### Task 6: README for cli/

Usage, installation note, "this is paired with the template repo at github.com/<user>/vibe-starter".

### Task 7: Smoke test locally

Run `node cli/bin/create-vibe-app.js test-app --local /Users/michaelreikersdorfer/Development/vibe-starter/template /tmp/cva-smoke`. Verify it produced a working clone; clean up.

### Task 8: Update parent README + DECISIONS

Mention `npx create-vibe-app` as the recommended entry point in the parent vibe-starter README. Add a DECISIONS entry for "use degit instead of git clone".

---

## What ships

```bash
npx create-vibe-app my-recipes
# → asks confirmation
# → clones template into ./my-recipes/
# → replaces project name
# → git init
# → prints: "Next: cd my-recipes && open in Claude Code, then type /setup"
```

After publishing the npm package and pushing the template to GitHub:
- `npx create-vibe-app <name>` works for anyone, no install needed
- The template repo continues to be the source of truth — CLI just wraps it

What's NOT in Plan 5:
- Publishing to npm (user-driven)
- Pushing template to a public GitHub repo (user-driven)
- Telemetry, update notifications, fancy interactive UI
- Bundling the template into the package (we use degit; smaller/simpler)
