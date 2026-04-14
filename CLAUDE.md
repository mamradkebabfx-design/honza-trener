# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- Canonical / OG URLs / `robots.txt` / `sitemap.xml` / all JSON-LD `@id`s in `index.html` currently hardcode `https://honza-trener.vercel.app/` (the live Vercel URL). When the real domain is attached, replace this string in all three files (`index.html`, `robots.txt`, `sitemap.xml`) in one pass.
- Meta description, OG tags, and JSON-LD all duplicate copy from the page — when editing pricing, FAQ answers, or contact details, update the JSON-LD block in `index.html` head as well.

## Contact form

The form posts JSON to `/api/contact` (same-origin Vercel function) which relays the message to `prochazka.coaching@gmail.com` via Resend. Fields: `name` (required), `email` (required, regex-validated), `phone` (optional), `message` (optional), `botcheck` (honeypot hidden checkbox — non-empty value silently succeeds without sending). The destination address is hardcoded in `api/contact.js`; change it there if needed.

- **Why same-origin** — this replaced the original Web3Forms integration because **O2 Czech Republic intercepts TLS for `api.web3forms.com`** and serves a `*.o2.cz` cert instead of the real one, causing "Failed to fetch" / Safari "Load failed" for any O2 customer, *including* O2 mobile data (O2 is both an ISP and a mobile carrier in CZ). Hosting the endpoint under `honza-trener.vercel.app/api/contact` — the same origin as the site itself — makes it uninterceptable. **Before reintroducing any third-party form service, verify with `curl -v https://<service-domain>/` that the cert subject/issuer match the expected service and are NOT `*.o2.cz`.**
- **Resend sender** — currently using Resend's shared `onboarding@resend.dev`, which works without domain verification but has deliverability limits and doesn't look branded. When a custom domain is attached, verify it in Resend (DNS records) and switch `from` in `api/contact.js` to something like `"Honza Procházka <noreply@honzaprochazka.cz>"`.
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
- **Live URL:** `https://honza-trener.vercel.app/`. Vercel project is connected to the GitHub repo and auto-deploys on every push to `main`. Vercel auto-detects `api/*.js` as serverless functions — no `vercel.json` needed.
- **Pushing:** the user pushes via **GitHub Desktop** (authentication is set up there). They have no `gh` CLI and no Homebrew — do not try `brew install gh`. For new commits, prepare the changes and a commit message, then ask them to commit+push from GitHub Desktop.
- **Env vars in Vercel:** `RESEND_API_KEY` is set in Project → Settings → Environment Variables (all three environments). After changing env vars you must trigger a redeploy for them to take effect — the existing build keeps the old value baked in.
- **No custom domain yet.** When the real domain is attached later, search-and-replace `honza-trener.vercel.app` → new domain in `index.html`, `robots.txt`, `sitemap.xml` (one pass across the three files). Also revisit the Resend `from` address (see Contact form section).
