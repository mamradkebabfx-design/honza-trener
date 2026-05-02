# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Active follow-up checklist (read at session start)

There is a pending post-launch checklist at **`../dalsi-kroky.md`** (sibling of this repo, intentionally outside git). It contains SEO submission tasks (Google Search Console, Seznam Webmaster, Bing), sanity checks (contact form E2E, Open Graph preview, JSON-LD validation, PageSpeed), Resend branded sender setup, and low-priority polish.

**At the start of any new session, before starting unrelated work, do this:**
1. Read `../dalsi-kroky.md` to see what's still unchecked.
2. Greet the user with a one-sentence reminder of where they were (e.g. *"Pamatuj — ještě je rozdělaný checklist `dalsi-kroky.md`, naposledy jsme byli u sekce X. Chceš v něm pokračovat, nebo děláš dnes něco jiného?"*).
3. If they want to continue, jump in. If they want something else, drop the reminder and proceed.

**When the user confirms the checklist is fully done, remove this section from CLAUDE.md and delete `../dalsi-kroky.md`.** It's transient state, not durable project documentation.

## Project

Landing page for **Honza Procházka**, a personal fitness trainer in Prague specializing in kinesiology. Vanilla HTML / CSS / JS — no build step, no framework, no package manager. The only backend code is a single Vercel serverless function (`api/contact.js`) that handles form submissions. Primary goal is client acquisition (booking first session). Language is Czech.

The business brief (tone, target audience, services, pricing, page structure) lives in `honza-trener.md`. When writing copy or changing structure, read that file first — it defines the tone of voice (calm, human, non-aggressive, low-pressure CTA) and explicitly lists things to avoid (overhyped fitness claims, generic marketing phrases).

## Running locally

Serving the static files is enough for everything except the contact form:

```
python3 -m http.server 8000
# then open http://localhost:8000
```

`file://` breaks relative paths and `localStorage`, so always serve over HTTP. **The contact form (`/api/contact`) won't work under `python3 -m http.server`** — that endpoint only exists when the Vercel runtime is serving the repo. For local end-to-end form testing, use `npx vercel dev` (no install needed), which boots a local replica of the Vercel edge + serverless functions and loads env vars from a local `.env` file if present. Without `vercel dev`, test the form on the deployed Vercel URL.

## Architecture

Four files make up the whole app:
- `index.html` — single-page layout. Current section order: hero (title + trainer photo, no benefits inline) → about (`#o-mne`, text only) → benefits (`#benefity`, 4 cards) → for-whom → pricing (`#cenik`) → FAQ (`#faq`) → CTA/contact (`#kontakt`) → footer. Contains inline JSON-LD structured data (LocalBusiness, Person, Service+Offer, FAQPage) — keep it in sync with visible copy when editing pricing, FAQ, or contact info.
- `styles.css` — all styles. Design tokens are CSS custom properties on `:root` (colors, radius, shadow, easing). Minimalistic aesthetic: black/white/gray with a single green accent (`--accent: #14a277`). Mobile-first, single stylesheet, no preprocessor.
- `script.js` — age gate (18+, gated via `localStorage.ageVerified`), sticky nav shadow, mobile menu toggle, IntersectionObserver reveal animations (`.reveal` → `.visible`), and contact form AJAX submission to the `/api/contact` endpoint (JSON body) with loading/success/error states.
- `api/contact.js` — Vercel serverless function (Node.js runtime, ES module). Parses JSON body, checks the honeypot, server-side validates `name` / `email` / length limits, then calls the Resend API (`https://api.resend.com/emails`) using `RESEND_API_KEY` from env. Sends plain-text mail to `prochazka.coaching@gmail.com` from `onboarding@resend.dev` with `reply_to` set to the visitor's email. Uses native `fetch` — no npm dependencies, so there is still no `package.json`.

Assets:
- `assets/` is the live folder referenced by `index.html` (logo, trainer photos). `images/` is the original source dump — copy into `assets/` when adding new photos, don't reference `images/` from HTML.
- Trainer photos currently used: `assets/honza-hero.jpg` (hero, right column) and `assets/honza-about.jpg` (also used as OG image).

SEO:
- Canonical / OG URLs / `robots.txt` / `sitemap.xml` / all JSON-LD `@id`s in `index.html` use `https://www.honzacoach.cz/` (production canonical, with `www`). The bare `vercel.app` URL is no longer referenced in code — keep it that way. The apex `honzacoach.cz` redirects (307) to `www.honzacoach.cz` via Vercel — if you ever flip `www` ↔ apex as primary in Vercel, you MUST also update all 16 occurrences in these three files in one pass to keep canonical consistent with the redirect direction.
- Meta description, OG tags, and JSON-LD all duplicate copy from the page — when editing pricing, FAQ answers, or contact details, update the JSON-LD block in `index.html` head as well.

## Contact form

The form posts JSON to `/api/contact` (same-origin Vercel function) which relays the message to `prochazka.coaching@gmail.com` via Resend. Fields: `name` (required), `email` (required, regex-validated), `phone` (optional), `message` (optional), `botcheck` (honeypot hidden checkbox — non-empty value silently succeeds without sending). The destination address is hardcoded in `api/contact.js`; change it there if needed.

- **Why same-origin** — this replaced the original Web3Forms integration because **O2 Czech Republic intercepts TLS for `api.web3forms.com`** and serves a `*.o2.cz` cert instead of the real one, causing "Failed to fetch" / Safari "Load failed" for any O2 customer, *including* O2 mobile data (O2 is both an ISP and a mobile carrier in CZ). Hosting the endpoint under `honza-trener.vercel.app/api/contact` — the same origin as the site itself — makes it uninterceptable. **Before reintroducing any third-party form service, verify with `curl -v https://<service-domain>/` that the cert subject/issuer match the expected service and are NOT `*.o2.cz`.**
- **Resend sender** — currently still using Resend's shared `onboarding@resend.dev`. Works, but limited deliverability and unbranded. **Next step (pending — domain `honzacoach.cz` is attached but Resend not yet verified):** in Resend dashboard → Domains → Add Domain → `honzacoach.cz` → add the shown SPF TXT + DKIM CNAME records into Forpsi DNS editor (see Deployment → Forpsi section below for path) → wait for "Verified" → then change `from` in `api/contact.js` from `'onboarding@resend.dev'` to `'Honza Procházka <noreply@honzacoach.cz>'`. Single-line change + commit + push.
- **Env var** — `RESEND_API_KEY` must be set in Vercel dashboard (Project → Settings → Environment Variables, all three environments). Never commit the key to git. If the var is missing, `api/contact.js` returns 500 with "Server není nakonfigurovaný."
- **`form.name` trap** — still worth knowing if anyone refactors: accessing form fields via `form.fieldName` does NOT work for a field called `name`, because `HTMLFormElement.name` reflects the form element's own `name` attribute (a string). Current code uses `FormData` — keep it that way, don't "simplify" to `form.name.value`.

## Conventions specific to this project

- Copy is in Czech. Keep tone calm, human, non-pushy per `honza-trener.md`.
- Instagram handle is `@_honza_prochazka` (note leading underscore). Email is `prochazka.coaching@gmail.com`. Location: Form Factory, Václavské náměstí, Prague.
- Pricing: 1×/week = 800 Kč, 2×/week = 700 Kč, 3×/week = 600 Kč — these appear in the pricing section AND the JSON-LD `Offer` list; update both. Pricing cards do not have "Vybrat" buttons (removed by design).
- Age gate is required: the site is 18+. The modal is shown on first visit and remembered in `localStorage`. Don't remove without being asked.
- Reveal animation: any new section element that should fade in on scroll needs the `reveal` class — the IntersectionObserver in `script.js` picks it up automatically.
- Featured pricing card (`.plan--featured`) has a dark background; any text/button inside it needs explicit white-on-dark overrides (already done for list items, h3, price small, and the primary button).

## Deployment

Per the user's global instructions: deploy flow is Git → GitHub → Vercel (auto-deploy). Git author email must be `mamradkebabfx@gmail.com`. Never commit or push without explicit request.

- Git remote `origin` → `https://github.com/mamradkebabfx-design/honza-trener.git`.
- **Live URL:** `https://www.honzacoach.cz/` (production, primary). The technical `https://honza-trener.vercel.app/` URL also stays live as Vercel's per-project subdomain — useful for testing or curl-ing without DNS dependence, but never link to it from external content (canonical points to `www.honzacoach.cz`). Vercel project is connected to the GitHub repo and auto-deploys on every push to `main`. Vercel auto-detects `api/*.js` as serverless functions — no `vercel.json` needed.
- **Pushing:** the user pushes via **GitHub Desktop** (authentication is set up there). They have no `gh` CLI and no Homebrew — do not try `brew install gh`. For new commits, prepare the changes and a commit message, then ask them to commit+push from GitHub Desktop.
- **Env vars in Vercel:** `RESEND_API_KEY` is set in Project → Settings → Environment Variables (all three environments). After changing env vars you must trigger a redeploy for them to take effect — the existing build keeps the old value baked in.
- **Custom domain `honzacoach.cz` (registered at Forpsi).** DNS is managed via Forpsi customer admin:
  - Path: https://admin.forpsi.com → **Domény → honzacoach.cz → [Editace DNS záznamů]** (NOT "Změna DNS serverů" — that would change NSSET).
  - **NSSET stays `FORPSI`** — we use Forpsi nameservers (`ns.forpsi.net` etc.) and only edit A/CNAME records within them. Do NOT switch to Vercel nameservers.
  - Active records:
    - **A** `@` → `216.198.79.1` (Vercel's current recommended apex IP. Their older `76.76.21.21` still works but the Domains UI explicitly recommends the new range. If Vercel ever shows a different IP, copy that one — do not hardcode from memory.)
    - **CNAME** `www` → `3e4021b2e8a88592.vercel-dns-017.com` (this CNAME target is **per-project unique** — Vercel no longer uses the legacy generic `cname.vercel-dns.com`. If re-verifying, copy verbatim from Vercel Project → Settings → Domains → www.honzacoach.cz → DNS Records.)
  - In Vercel Domains UI: `www.honzacoach.cz` is **primary (Production)**; apex `honzacoach.cz` redirects (307) to it.
  - **Forpsi propagation delay:** after editing DNS records, `ns.forpsi.net` returns `REFUSED` for up to ~30 min while their internal zone replication catches up — this is normal, not an error. If still REFUSED after 30 min, use Forpsi live chat (https://support.forpsi.com/Main/Chat/) to push it.
  - **Things NOT to touch in Forpsi:** the "Redirect" tab (their own HTTP forwarder, conflicts with Vercel), DNSSEC ("Vypnout DNSSEC"), the parking presets ("nastavit na webserver/mailserver FORPSI") at the top of the DNS editor.
