---
name: add-custom-domain
description: Point a custom domain at the Vercel deployment. SSL is automatic via Vercel + LetsEncrypt. Recommends Cloudflare DNS as default; supports existing-domain-elsewhere flow with guided manual steps. Use when user invokes /add-domain or says "custom domain", "use my own domain", "yourapp.com".
---

# add-custom-domain Skill

You are pointing a custom domain at the Vercel deployment. SSL is **automatic
via Vercel** (LetsEncrypt) — the user doesn't need to manage certificates
manually. What they need is **DNS management**.

## When to invoke

- `/add-domain <domain>` slash command.
- User says "I want to use my own domain", "set up <domain>".

## Pre-flight

`.vibe-state.json.vercel_url` must be set (project deployed at least once).
If not, recommend `/setup` and stop.

## First question

Ask the user: **"Do you already own a domain you want to use?"**

Branch from there:

- **No, I need to buy one** → Section A
- **Yes, it's at Cloudflare** → Section B
- **Yes, it's at GoDaddy / Namecheap / something else** → Section C

## Section A — User needs a domain

Recommend **Cloudflare Registrar** as the default:
- Cheapest at-cost pricing (no markup over wholesale)
- Free DNS with the best API
- WHOIS privacy free
- 2FA, no upselling

Tell the user:

> "I recommend Cloudflare for both the domain and DNS — it's cheapest, has the best API for me to automate further changes, and free SSL is automatic on Vercel's side. Sign up at https://dash.cloudflare.com/sign-up if you don't have an account, then go to Domain Registration → Register and pick a domain. Tell me the domain when ready."

If they want a different registrar (Namecheap, Porkbun, etc.) — that's fine, route to Section C after they buy.

Once they have a Cloudflare domain → Section B.

## Section B — Cloudflare DNS (best automation)

### B.1 Get a Cloudflare API token

Tell the user:

> "I'll need a Cloudflare API token scoped to your zone. Go to https://dash.cloudflare.com/profile/api-tokens → Create Token → 'Edit zone DNS' template → select your domain → Create. Paste the token back here."

Validate token format (starts with letters/digits, ~40 chars). Don't store
it in `.env.local` — it's a one-shot for this skill. Hold it in memory.

### B.2 Add the domain to Vercel

```bash
vercel domains add <domain>
```

Vercel will output something like:
```
Set the following records in your DNS provider:
  A    @     76.76.21.21
  CNAME www  cname.vercel-dns.com
```

Capture those records.

### B.3 Add DNS records via Cloudflare API

For each record from Vercel:

```bash
ZONE_ID=$(curl -s -H "Authorization: Bearer $CF_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones?name=<domain>" | jq -r '.result[0].id')

curl -s -X POST -H "Authorization: Bearer $CF_TOKEN" -H "Content-Type: application/json" \
  "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  --data '{"type":"A","name":"@","content":"76.76.21.21","proxied":false,"ttl":1}'

curl -s -X POST -H "Authorization: Bearer $CF_TOKEN" -H "Content-Type: application/json" \
  "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  --data '{"type":"CNAME","name":"www","content":"cname.vercel-dns.com","proxied":false,"ttl":1}'
```

**Important:** `proxied: false` — Cloudflare proxying conflicts with Vercel's edge. The DNS-only "grey cloud" is correct.

### B.4 Wait for verification

```bash
vercel domains inspect <domain>
```

Repeat until it shows "Configured: ✓". DNS propagation is usually <60 seconds for fresh records, but can take longer.

### B.5 Update NEXT_PUBLIC_SITE_URL

Auth emails (password reset, invites) must redirect to the new domain:

```bash
vercel env rm NEXT_PUBLIC_SITE_URL production --yes
echo "https://<domain>" | vercel env add NEXT_PUBLIC_SITE_URL production
vercel --prod  # redeploy so the new env var takes effect
```

Update `.env.local` similarly so dev mode matches:

```bash
sed -i.bak 's|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=https://<domain>|' .env.local && rm .env.local.bak
```

### B.6 Update Supabase auth redirect URLs

Supabase will reject auth-email callbacks to URLs not in its allow-list.
Add the new domain:

> "Go to https://app.supabase.com → your project → Authentication → URL Configuration. Add `https://<domain>/api/auth/callback` and `https://<domain>` to the redirect URLs list. Save."

Wait for the user to confirm. (We can't automate this without service-role API tokens, which we don't ship.)

### B.7 Verify SSL and login

```bash
curl -sI https://<domain> | head -3
```

Expect 200 or 308. SSL is on automatically (Vercel issues LetsEncrypt cert
within ~1 min of DNS being correct).

Open the domain in a browser and have the user sign in with their email
and password. Confirm the app works on the new domain (not the old
`*.vercel.app`).

### B.8 Update vibe-state.json

```json
{
  "custom_domain": "<domain>",
  "domain_provider": "cloudflare"
}
```

### B.9 Commit any code changes

If you only changed env vars, there's nothing to commit. If you also touched
config files (e.g., `vercel.json` got an alias entry), commit:

```bash
git -c commit.gpgsign=false commit -m "feat(domain): point <domain> to Vercel via Cloudflare DNS"
```

## Section C — Existing domain at another registrar

Manual flow — give the user clear, copy-pasteable instructions.

### C.1 Add the domain to Vercel

```bash
vercel domains add <domain>
```

Capture the records Vercel asks for.

### C.2 Tell the user exactly what to add

Give them this verbatim, replacing the actual values from step C.1:

> "Log into your domain registrar's DNS settings for `<domain>`. Add these records:
>
> - **A record**: name `@` (or blank/root), value `76.76.21.21`, TTL `Auto` or `300`
> - **CNAME record**: name `www`, value `cname.vercel-dns.com`, TTL `Auto` or `300`
>
> If your registrar is Namecheap: Domain List → Manage → Advanced DNS.
> If GoDaddy: My Domains → DNS.
> If Google Domains (now Squarespace): DNS → Custom records.
>
> Save. Tell me when it's done."

Wait. Then run `vercel domains inspect <domain>` to verify.

### C.3 — C.7

Same as B.4 onwards (wait for verification, update env vars, update Supabase
redirect URLs, verify SSL + login, update state, commit).

## Edge cases

- **Domain already in use by another Vercel project**: `vercel domains add` fails. User must remove from the other project first.
- **DNS not propagating after 5 min**: check the records actually saved (some registrars cache the form). Have user do `dig <domain>` to confirm.
- **Cloudflare proxy is on (orange cloud)**: SSL handshake errors. Toggle to DNS-only (grey cloud).
- **Apex + www**: this skill sets up both. If user wants `www` to redirect to apex (or vice versa), Vercel's domain settings → "Redirect" handles it.

## What you do NOT do

- Manage SSL certificates manually (Vercel does it).
- Modify the user's other DNS records.
- Skip updating `NEXT_PUBLIC_SITE_URL` and Supabase redirect URLs — auth emails (password reset, invites) break otherwise.
- Recommend "buy a domain through Vercel" as the default — Cloudflare is cheaper and has better tools.
