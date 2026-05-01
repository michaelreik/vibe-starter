# Maintainer Guide

Was noch zu tun ist und wie du den vollständigen Stack Schritt für Schritt
testen kannst. Diese Datei ist für **dich als Owner von vibe-starter**, nicht
für Endnutzer (die lesen nur `template/README.md` nach dem Klonen).

---

## Teil A — Was noch zu tun ist

### Schritt A1: Repo als GitHub Template markieren (~30 Sekunden)

Damit der "Use this template" Button auf GitHub funktioniert.

1. https://github.com/michaelreik/vibe-starter/settings öffnen
2. Unter **General → Template repository** das Häkchen setzen
3. Save

Effekt: Auf der Repo-Seite erscheint oben ein grüner "Use this template" Button.
Vibe Coder können damit ein neues Repo aus deinem Template erzeugen, ohne
`create-vibe-app` zu nutzen.

> **Hinweis zur Repo-Struktur:** Aktuell liegt das eigentliche Template in
> `template/`, parallel zu `cli/` und `docs/`. Wenn jemand "Use this template"
> klickt, bekommt er das *gesamte* Repo (inkl. `cli/` und `docs/`). Das ist
> für die meisten Vibe Coder verwirrend. Zwei saubere Optionen — entscheide
> später, wenn du ernsthaft launchst:
>
> - **Option 1**: Separates Public-Repo nur fürs Template
>   (`michaelreik/vibe-starter-template`), `cli/` bleibt hier. Erfordert
>   beim Update beider Repos parallel zu pushen.
> - **Option 2**: Monorepo bleibt, "Use this template" wird nicht beworben,
>   einziger Empfohlener Weg ist `npx create-vibe-app` (das nur das
>   `template/` Subverzeichnis fetcht via degit).
>
> Für jetzt: Option 2 reicht. `create-vibe-app` ist eh die bessere UX.

### Schritt A2: CLI auf npm publishen

```bash
cd /Users/michaelreikersdorfer/Development/vibe-starter/cli
npm whoami        # falls nicht eingeloggt: npm login
npm publish --access public
```

**Wenn `create-vibe-app` bereits belegt ist** (auf npm prüfen:
https://www.npmjs.com/package/create-vibe-app), drei Optionen:

1. **Scoped Package** (empfohlen):
   ```bash
   # In cli/package.json: "name": "@michaelreik/create-vibe-app"
   npm publish --access public
   ```
   Nutzer rufen dann auf: `npx @michaelreik/create-vibe-app my-app`

2. **Anderer Name**: z.B. `vibe-starter-cli`, `michaelreik-starter`. In
   `cli/package.json` ändern, neu publishen.

3. **Bestehenden Namen übernehmen**: nur wenn der Author das Paket abgegeben
   hat oder es deprecated ist. Sonst nicht möglich.

Nach dem Publish den Aufruf in `template/README.md` ggf. anpassen
(steht aktuell auf `npx create-vibe-app`).

### Schritt A3: End-to-End-Test mit echten Accounts

Erst nach A1 und A2 möglich. Plan dafür siehe Teil B unten.

---

## Teil B — Test-Guideline Schritt für Schritt

Vier Testebenen, von schnell zu vollständig. Mach **mindestens** Ebene 1 und 2,
bevor du `create-vibe-app` an andere Leute gibst.

### Ebene 1: Template baut und läuft lokal (~10 Min)

Validiert: das Scaffold an sich (Plan 1 Output).

```bash
# Frischen Clone in einem Throwaway-Verzeichnis
cd ~/Development
rm -rf vibe-starter-test
git clone --depth 1 git@github.com:michaelreik/vibe-starter.git vibe-starter-test
cd vibe-starter-test/template
npm install

# Lokale Supabase starten (Docker muss laufen)
npx supabase start
# Notiere die ausgegebenen "Publishable" und "Secret" Keys.

# Migrationen anwenden
npx supabase db reset

# .env.local aus den Keys befüllen
cat > .env.local <<EOF
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sb_publishable_... aus supabase status>
SUPABASE_SERVICE_ROLE_KEY=<sb_secret_... aus supabase status>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
EOF

# Dev-Server (Port 3000 muss frei sein!)
npm run dev
```

Im Browser http://localhost:3000 öffnen und Checkliste durchgehen:

- [ ] Redirect von `/` zu `/login` funktioniert
- [ ] Email eingeben → "Send magic link" → "Check your email"
- [ ] http://127.0.0.1:54324 (Mailpit) öffnen → Mail klicken → landet auf `/dashboard`
- [ ] `/notes` → "New note" → erstellen → bearbeiten → löschen
- [ ] `/account` → Full name setzen → Save → Toast "Saved"
- [ ] Theme-Toggle (Sonne/Mond) wechselt Light/Dark
- [ ] Sign out → zurück auf `/login`
- [ ] In der Mailpit-UI keine durchgängigen Email-Errors

Aufräumen:
```bash
npx supabase stop
cd ~/Development && rm -rf vibe-starter-test
```

### Ebene 2: CLI-Wrapper lokal (~3 Min)

Validiert: dass `create-vibe-app` einen sauberen Klon produziert (Plan 5 Output).

```bash
cd /Users/michaelreikersdorfer/Development/vibe-starter

# Mit lokalem Template (nutzt deinen aktuellen Stand, nicht GitHub)
node cli/bin/create-vibe-app.js /tmp/cva-local-test \
  --local /Users/michaelreikersdorfer/Development/vibe-starter/template

# Verifikation
cd /tmp/cva-local-test
ls -la                              # ← Template-Files da, kein node_modules
cat package.json | grep '"name"'    # ← "name": "cva-local-test"
head -3 README.md                    # ← Heading "# cva-local-test"
ls .claude/skills/ | wc -l           # ← 10
git log --oneline                    # ← leer (frisch git init, noch kein Commit)

# Aufräumen
cd ~ && rm -rf /tmp/cva-local-test
```

### Ebene 3: CLI-Wrapper via GitHub (~3 Min)

Validiert: dass `degit` den Template-Subfolder vom Public-Repo fetcht.

```bash
# Vom Repo, NICHT lokal
node /Users/michaelreikersdorfer/Development/vibe-starter/cli/bin/create-vibe-app.js \
  /tmp/cva-github-test
# Default: degit fetched michaelreik/vibe-starter/template

cd /tmp/cva-github-test
ls .claude/skills/ | wc -l           # ← 10
ls .claude/commands/ | wc -l         # ← 8

# Aufräumen
cd ~ && rm -rf /tmp/cva-github-test
```

Falls dieser Schritt fehlschlägt mit `404 Not Found`: das Repo ist privat oder
der Pfad stimmt nicht. Fix: GitHub Repo public machen (Settings → Visibility),
oder bei privatem Repo `degit`-Auth konfigurieren.

### Ebene 4: End-to-End mit echten Accounts (~30 Min)

Validiert: den `/setup`-Skill und die komplette Onboarding-Story (Plan 2 Output).
Erfordert:

- Throwaway-Mail-Adresse (oder Plus-Aliasing wie `mr+vibetest@propup.at`)
- Bereitschaft, einen GitHub-Repo, ein Supabase-Projekt und ein Vercel-Projekt
  anzulegen (wirst nachher manuell löschen können)

```bash
# 1. Frischen Klon mit dem CLI
node /Users/michaelreikersdorfer/Development/vibe-starter/cli/bin/create-vibe-app.js \
  ~/Development/vibe-starter-e2e

cd ~/Development/vibe-starter-e2e

# 2. Claude Code in diesem Verzeichnis öffnen
#    (in deinem Terminal: claude oder den Conductor)

# 3. Im Agent /setup tippen
```

Dann begleitend abhaken:

- [ ] **Stage 1 (tools_check):** Agent prüft `git`, `gh`, `npx supabase`, `vercel`. Installiert fehlende. (Wenn alle schon da sind, sehr schnell.)
- [ ] **Stage 2 (github_login):** Browser öffnet GitHub-OAuth. Authorize klicken. `gh auth status` zeigt eingeloggt.
- [ ] **Stage 3 (supabase_login):** Browser öffnet Supabase. Authorize.
- [ ] **Stage 4 (vercel_login):** Browser öffnet Vercel. Authorize.
- [ ] **Stage 5 (remote_projects):** Agent fragt Projekt-Name, DB-Region (`eu-central-1` Default), Vercel-Region (`fra1` Default). Dann:
  - GitHub-Repo erstellt (private, gepusht). Prüfe auf https://github.com/michaelreik/vibe-starter-e2e
  - Supabase-Projekt erstellt. Prüfe auf https://app.supabase.com → Projects-Liste
  - Vercel-Projekt verlinkt. Prüfe auf https://vercel.com/dashboard
  - Env-Vars in Vercel gesetzt. `vercel env ls` zeigt 4 Vars (URL, ANON, SERVICE, SITE_URL)
- [ ] **Stage 6 (first_deploy):** `vercel --prod` läuft durch. URL wird im Output angezeigt. `NEXT_PUBLIC_SITE_URL` auf die echte URL aktualisiert, redeploy.
- [ ] **Stage 7 (verified):** Agent öffnet die Live-URL. Sign-in mit Magic Link → kommt im Mail-Postfach an, Klick → `/dashboard`.
- [ ] `.vibe-state.json` enthält alle 7 Stages und IDs:
  ```bash
  cat .vibe-state.json
  ```

**Resumability-Test (optional):**

```bash
# In der Mitte abbrechen (Ctrl-C beim Agent), dann erneut:
/setup
```
Sollte ab der letzten unvollständigen Stage fortsetzen, nicht von vorne.

**Aufräumen nach E2E:**

- GitHub: Repo löschen → https://github.com/michaelreik/vibe-starter-e2e/settings → Danger Zone → Delete
- Supabase: Projekt löschen → app.supabase.com → Settings → Pause/Delete
- Vercel: Projekt löschen → vercel.com/dashboard → Settings → Delete
- Lokal: `rm -rf ~/Development/vibe-starter-e2e`

### Ebene 5: Feature-Loop testen (~15 Min, optional)

Validiert: dass die Feature-Skills funktionieren (Plan 3 Output).

Auf einem `/setup`-fertigen Projekt aus Ebene 4:

```bash
# Im Agent
/new-feature add a "todos" feature where each user has todos with title and completed flag

# Erwartet:
# - Agent fragt 2-3 Klarstellungsfragen
# - Erstellt Migration 0003_todos.sql mit voller RLS
# - Erstellt lib/actions/todos.ts
# - Erstellt app/(app)/todos/page.tsx + new + [id]
# - Updated PROGRESS.md
# - Commits in mehreren atomic Schritten

# Dann
/ship
# Erwartet: typecheck, lint, test, build → push → Vercel-Deploy → Live-URL Smoke Check
```

### Ebene 6: On-Demand-Skills testen (~optional)

```bash
/add-email      # → Resend account, API key, Vercel env
/add-domain     # → Cloudflare oder anderer Registrar
/add-i18n       # → next-intl, struktureller Umbau
```

Jedes davon kann eigenständig getestet werden, kostet aber externe Accounts.

---

## Häufige Probleme beim Testen

| Symptom | Ursache | Fix |
| --- | --- | --- |
| Port 3000 belegt | anderes Projekt läuft | `lsof -i :3000` → Prozess stoppen |
| Supabase startet nicht | Docker nicht aktiv | Docker Desktop starten, dann `npx supabase start` |
| `create-vibe-app: command not found` | nicht via `npx` aufgerufen | `npx create-vibe-app …` oder Pfad zur lokalen Kopie |
| `degit: 404` beim CLI | Repo private oder URL falsch | Repo public machen oder `--template michaelreik/<repo>/template` |
| Magic-Link Email kommt nicht an | Lokal: in Mailpit | http://127.0.0.1:54324 öffnen |
| Magic-Link Email kommt in Prod nicht | Supabase Free-SMTP-Limit | `/add-email` für Resend-SMTP-Swap |
| Vercel deploy 5xx nach push | Env Vars fehlen | `vercel env ls`; ggf. nachpushen |

---

## Kontakt für Bug Reports

Bis es eine Issue-Vorlage gibt: einfach Issues auf
https://github.com/michaelreik/vibe-starter/issues anlegen, mit
- welche Ebene aus der Test-Guideline
- exakter Fehlertext
- Stage / Commit, an dem es bricht
