# vibe-starter — Design Spec

**Datum:** 2026-04-30
**Status:** Entwurf, vor Implementierung
**Autor:** Michael Reikersdorfer (mit Claude)

## Vision

Ein "Vibe-Coding Starter Kit": ein Template-Repository plus CLI-Wrapper, die einer
weniger technischen Person erlauben, mit einem Coding-Agent (Claude Code, Cursor)
in <15 Minuten von der Idee zu einer live deployten Web-App zu kommen — komplett
mit GitHub-Repo, Supabase-Datenbank inklusive Auth, und Vercel-Hosting.

Das Versprechen an den User: "Sag dem Agent was du bauen willst — alles andere
passiert automatisch, beim ersten Mal mit Schritt-für-Schritt-Begleitung,
danach autonom."

## Zielgruppe

"Vibe Coder" — kann Claude Code oder einen vergleichbaren Agent installieren
und nutzen, will aber nicht selbst CLIs bedienen, manuell Datenbanken
konfigurieren oder Deployment-Pipelines verstehen. Der Coding-Agent ist die
einzige UI, die der User direkt benutzt.

## Tech-Stack-Entscheidungen

Begründungen siehe `DECISIONS.md` (wird mit Implementierung mitwachsen).

| Komponente | Wahl | Version (Stand 2026-04-30) |
| --- | --- | --- |
| Framework | Next.js (App Router) | 16.3.0 |
| UI Library | React | 19.x |
| Sprache | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.2.0 |
| Component Library | shadcn/ui (vendored) | aktuelle CLI |
| Backend / DB / Auth | Supabase | latest |
| Supabase Client | `@supabase/ssr` (NICHT `@supabase/auth-helpers-nextjs` — deprecated) | latest |
| Hosting | Vercel | — |
| Email (on demand) | Resend | latest |
| i18n (on demand) | next-intl | latest |
| DNS (on demand) | Cloudflare API + Vercel SSL (LetsEncrypt automatisch) | — |
| Node | 22.x LTS | — |

## Architektur — drei Artefakte

```
1. vibe-starter (Template-Repo auf GitHub)
   └── geklont von ↓
2. create-vibe-app (npm CLI)
   └── User tippt im Agent ↓
3. Skills + Slash Commands in .claude/
```

### Artefakt 1: Template-Repo `vibe-starter`

**Public auf GitHub.** "Use this template" Button verfügbar.

#### Datei-Struktur

```
vibe-starter/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (app)/dashboard/page.tsx
│   ├── (app)/account/page.tsx
│   ├── (app)/notes/                 # Beispiel-CRUD
│   ├── api/auth/callback/route.ts
│   └── layout.tsx
├── components/
│   ├── ui/                          # shadcn/ui
│   └── theme-toggle.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   └── utils.ts
├── supabase/
│   ├── migrations/
│   │   ├── 0001_profiles.sql        # users + RLS-Policies
│   │   └── 0002_notes.sql           # Beispiel-CRUD + RLS
│   └── config.toml
├── .claude/
│   ├── skills/                      # 10 Skills (siehe unten)
│   └── commands/                    # 8 Slash Commands
├── .github/workflows/
│   └── ci.yml                       # Lint + Typecheck
├── docs/
│   └── VERSIONS.md                  # Tested with + Migration Notes
├── scripts/
│   └── bump-versions.sh             # npm-check-updates Wrapper
├── middleware.ts                    # Auth Guard
├── CLAUDE.md                        # Schlanker Agent-Einstieg
├── README.md                        # Für Menschen
├── PROGRESS.md                      # Vision/Backlog/Verlauf (vom Agent gepflegt)
├── DECISIONS.md                     # Architektur-Entscheidungen (ADR-Stil)
├── .vibe-state.json                 # Maschinen-State (gitignored)
├── .env.example                     # Doku der ENV-Vars
├── .gitignore
├── package.json
└── vercel.json
```

#### Drei kritische Out-of-the-Box-Features

1. **RLS-Policies sind richtig gemacht.** `0001_profiles.sql` und `0002_notes.sql`
   demonstrieren das saubere Pattern (`auth.uid() = user_id`). Vibe Coder kopiert
   dieses Pattern, statt sich ein Datenleck zu bauen.
2. **Auth funktioniert end-to-end ab Sekunde 1** nach `/setup`. Magic Link
   Login, Server- und Client-Komponenten, Session Refresh über Middleware —
   alles korrekt verkabelt.
3. **`.env.example` ist die Wahrheit.** Jede Variable mit Kommentar wozu, woher
   zu bekommen. Der `setup-project` Skill liest diese Datei und weiß, was er
   befüllen muss.

#### State- und Verlaufs-Dateien

Drei separate Files, drei Zwecke:

| Datei | Zweck | Wer schreibt | Im Git? |
| --- | --- | --- | --- |
| `.vibe-state.json` | Maschinen-State, Idempotenz beim Setup | Agent (Skills) | Nein |
| `PROGRESS.md` | Vision, Ideen-Backlog, Was gebaut wurde, Offene Fragen | Agent + User | Ja |
| `DECISIONS.md` | Architektur-Entscheidungen mit "Warum" (ADR-leichtgewichtig) | Agent (User darf editieren) | Ja |

`PROGRESS.md` Sektionen: "Was wir bauen (Vision)", "Ideen-Backlog",
"Was schon gebaut wurde", "Offene Entscheidungen".

`DECISIONS.md` Format pro Eintrag: Datum, Titel, Status (aktiv/überholt),
Kontext, Entscheidung, Warum, Trade-off.

`.vibe-state.json` Beispiel:
```json
{
  "setup_completed_steps": ["tools_check", "github_login", "supabase_login", "vercel_login", "github_repo", "supabase_project", "vercel_project", "first_deploy", "verified"],
  "github_repo": "user/my-recipes",
  "supabase_project_id": "abc123",
  "vercel_project_id": "prj_xyz"
}
```

### Artefakt 2: CLI-Wrapper `create-vibe-app`

**Phase 1.5** (nach dem Template ist fertig).

```bash
npx create-vibe-app my-recipes
```

Macht: Template via `gh repo create --template <org>/vibe-starter` klonen,
Projekt-Name in `package.json` und README ersetzen, `git init` (oder Push als
neues Repo, falls schon eingeloggt), optional Claude Code öffnen.

Bewusst minimal in Phase 1.5: kein eigener Server, keine Telemetrie, keine
Auth — nur ein dünner Wrapper, der das Template-Repo als Quelle der Wahrheit
nutzt.

### Artefakt 3: Skills und Slash Commands

#### Skills (`.claude/skills/`)

| Skill | Zweck |
| --- | --- |
| `setup-project` | Hybrid-Onboarding (siehe unten) |
| `add-feature` | Komplettes Feature scaffolden: Migration → RLS → Server Action → UI → Test → PROGRESS-Update |
| `add-supabase-table` | Migration + Types + RLS-Policy für eine neue Tabelle |
| `add-rls-policy` | Nur Policy für eine bestehende Tabelle |
| `add-email` | Resend integrieren (Account, API Key, Helper, Beispiel-Template, optional Supabase-SMTP) |
| `add-i18n` | next-intl integrieren (Locales, `[locale]` Routing, Migration der UI-Strings) |
| `add-custom-domain` | DNS + automatisches SSL (Cloudflare Default, alle drei Pfade) |
| `deploy-to-production` | Commit, Push, Deploy-Verifikation |
| `update-progress` | `PROGRESS.md` und `DECISIONS.md` pflegen |
| `debug-supabase` | Decision-Tree für häufige Auth/RLS-Fehler |

#### Slash Commands (`.claude/commands/`)

```
/setup            → setup-project
/ship             → deploy-to-production
/new-feature      → add-feature
/new-table        → add-supabase-table
/add-domain       → add-custom-domain
/add-email        → add-email
/add-i18n         → add-i18n
/status           → fasst PROGRESS.md zusammen
```

## Der Hybrid-Setup-Flow

User tippt `/setup` einmal nach dem Klonen. Sechs Stufen:

1. **Tools prüfen** — `git`, `gh`, `supabase`, `vercel`. Fehlende installieren via `brew`/`npm`.
2. **GitHub Login** — `gh auth login --web`. Browser öffnet sich, User klickt Authorize.
3. **Supabase Login** — `supabase login`. Browser, Authorize.
4. **Vercel Login** — `vercel login`. Browser, Authorize.
5. **Projekte anlegen** — Agent fragt Projekt-Name, DB-Region, Vercel-Region. Dann:
   - `gh repo create <name> --private --source=. --push`
   - `supabase projects create <name> --region <region>` → `supabase link` → `supabase db push`
   - `vercel link --yes` → Env Vars setzen → `vercel --prod`
6. **Verifikation** — Agent öffnet die Live-URL, prüft dass Magic-Link-Login durchgeht. Erst dann gilt Setup als fertig.

**Idempotenz**: Jeder Schritt schreibt seinen Erfolg in `.vibe-state.json`.
Bei Abbruch oder Fehler kann `/setup` ab letzter erfolgreicher Stufe
weiterlaufen.

**Edge Cases:**
- Repo-Name kollidiert → Agent fragt: überschreiben oder umbenennen
- Supabase Free-Tier voll (max 2 Projekte) → klare Fehlermeldung mit Upgrade-Link
- Vercel Free-Tier voll (max 3 Hobby-Projekte) → klare Fehlermeldung
- Region-Wechsel wäre später schmerzhaft → Region wird einmal explizit abgefragt, Default `eu-central-1` (DACH-Zielgruppe)

## DNS-Pfad-Logik (`add-custom-domain`)

1. Frage: "Hast du schon eine Domain?"
2. **Ja, bei Cloudflare** → Pfad B: User trägt API-Token ein, Agent legt Records via Cloudflare API an, verifiziert auf Vercel
3. **Ja, bei anderem Registrar** (GoDaddy, Namecheap, …) → Pfad C: Geführte Schritt-für-Schritt-Anleitung, Agent gibt exakte DNS-Records, User klickt im Registrar-UI
4. **Nein** → Empfehlung: Cloudflare-Account anlegen (kostenlos), dann Pfad B. Vercel-Domain-Kauf wird nur erwähnt, wenn User explizit "ich will keinen extra Account" sagt.
5. SSL: in allen Pfaden automatisch durch Vercel via LetsEncrypt — kein User-Input nötig.

## Wartungs-Stack (für das Template selbst)

Damit das Template auch in 6 Monaten noch ein gutes Onboarding ist:

- **`package.json` Caret-Pinning** (`^16.3.0`) — Patch und Minor Updates automatisch
- **Renovate oder Dependabot** auf dem Template-Repo, wöchentlich
- **`docs/VERSIONS.md`** — "Tested with"-Tabelle und Migration-Notes für Major-Bumps
- **`scripts/bump-versions.sh`** — Einzeiler: `npx npm-check-updates -u && npm install && npm run build && npm run typecheck`

## Tests

- **Template-CI** auf jedem PR: `npm run build`, `npm run typecheck`, Vitest unit, Playwright E2E gegen lokale Supabase
- **End-to-End Setup-Test** — wöchentlich (geplanter Agent oder manuell): frischer GitHub-Account → `npx create-vibe-app` → `/setup` → Magic Link Login → `/add-email` → `/add-domain` → muss in <15 Min durchgehen. Fängt API-Drift bei Supabase/Vercel/GitHub ab.
- **Smoke Test pro Skill** — `tests/skills/<skill-name>/` mit happy-path-Beispiel gegen ein Test-Projekt

## Was bewusst NICHT in Phase 1 ist (YAGNI)

- Keine Telemetrie
- Keine Auto-Updates für bereits erstellte Projekte (Template ist Snapshot zum Zeitpunkt des Erstellens)
- Kein Backend/Server für den CLI-Wrapper
- Kein Stripe, kein Admin-Panel, kein File-Upload (Skills dafür kommen on-demand in Phase 1.6)
- Phase 2 (Hosted Produkt mit Web-UI) ist eigenes Brainstorming später

## Phasenplan

| Phase | Inhalt | Status |
| --- | --- | --- |
| **1** | Template-Repo: Code-Skelett, alle 10 Skills, 8 Commands, Setup-Flow, Wartungs-Stack | offen |
| **1.5** | CLI-Wrapper `create-vibe-app` als npm-Paket | offen |
| **1.6** | Optionale Zusatz-Skills (Stripe, File-Upload, Admin-Panel) bei Bedarf | offen |
| **2** | Hosted Produkt mit Web-UI — eigenes Brainstorming | nicht gestartet |

## Erfolgskriterium für Phase 1

Eine Person, die noch nie ein Next.js-Projekt aufgesetzt hat, schafft es:

1. Template via "Use this template" zu klonen
2. In Claude Code zu öffnen
3. `/setup` zu tippen, drei Browser-Logins durchzuklicken
4. "Ich will eine App wo Freunde Rezepte teilen" zu sagen
5. Live deployten Prototyp zu sehen — alles in unter 30 Minuten
