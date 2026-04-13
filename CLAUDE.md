# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static landing page for **Honza Procházka**, a personal fitness trainer in Prague specializing in kinesiology. Vanilla HTML / CSS / JS — no build step, no framework, no package manager. Primary goal is client acquisition (booking first session). Language is Czech.

The business brief (tone, target audience, services, pricing, page structure) lives in `honza-trener.md`. When writing copy or changing structure, read that file first — it defines the tone of voice (calm, human, non-aggressive, low-pressure CTA) and explicitly lists things to avoid (overhyped fitness claims, generic marketing phrases).

## Running locally

No build. Serve the folder over HTTP (file:// will break relative paths and some features):

```
python3 -m http.server 8000
# then open http://localhost:8000
```

## Architecture

Three top-level files:
- `index.html` — single-page layout. Current section order: hero (title + trainer photo, no benefits inline) → about (`#o-mne`, text only) → benefits (`#benefity`, 4 cards) → for-whom → pricing (`#cenik`) → FAQ (`#faq`) → CTA/contact (`#kontakt`) → footer. Contains inline JSON-LD structured data (LocalBusiness, Person, Service+Offer, FAQPage) — keep it in sync with visible copy when editing pricing, FAQ, or contact info.
- `styles.css` — all styles. Design tokens are CSS custom properties on `:root` (colors, radius, shadow, easing). Minimalistic aesthetic: black/white/gray with a single green accent (`--accent: #14a277`). Mobile-first, single stylesheet, no preprocessor.
- `script.js` — age gate (18+, gated via `localStorage.ageVerified`), sticky nav shadow, mobile menu toggle, IntersectionObserver reveal animations (`.reveal` → `.visible`), and contact form AJAX submission to Web3Forms with loading/success/error states.

Assets:
- `assets/` is the live folder referenced by `index.html` (logo, trainer photos). `images/` is the original source dump — copy into `assets/` when adding new photos, don't reference `images/` from HTML.
- Trainer photos currently used: `assets/honza-hero.jpg` (hero, right column) and `assets/honza-about.jpg` (also used as OG image).

SEO:
- `robots.txt` and `sitemap.xml` hardcode `https://honzaprochazka.cz/`. Same for canonical / OG URLs and all `@id`s in the JSON-LD block in `index.html`. **Before launch, replace this placeholder domain everywhere.**
- Meta description, OG tags, and JSON-LD all duplicate copy from the page — when editing pricing, FAQ answers, or contact details, update the JSON-LD block in `index.html` head as well.

## Contact form (Web3Forms)

- Form posts to `https://api.web3forms.com/submit` via `fetch` + `FormData` (not JSON — JSON path had issues, FormData is the working version).
- Access key is hardcoded in a hidden `access_key` input in `index.html`. The destination email is configured in the Web3Forms dashboard (not in the code) — currently set to `prochazka.coaching@gmail.com`.
- Form has a honeypot field `botcheck` (hidden checkbox) and `subject` / `from_name` hidden inputs.
- **Gotcha — `form.name` trap:** accessing form fields as `form.fieldName` doesn't work for a field named `name`, because `HTMLFormElement.name` reflects the form's own `name` attribute (a string). Always use `FormData` or `form.elements.namedItem()` to read values.
- **Known issue — O2 Czech Republic ISP blocks `api.web3forms.com`** via TLS intercept (returns a `*.o2.cz` cert instead of the real one). The form will fail with "Failed to fetch" on O2 networks. Test the form only from mobile data or a non-O2 network after deployment. This is not a bug in the code.

## Conventions specific to this project

- Copy is in Czech. Keep tone calm, human, non-pushy per `honza-trener.md`.
- Instagram handle is `@_honza_prochazka` (note leading underscore). Email is `prochazka.coaching@gmail.com`. Location: Form Factory, Václavské náměstí, Prague.
- Pricing: 1×/week = 800 Kč, 2×/week = 700 Kč, 3×/week = 600 Kč — these appear in the pricing section AND the JSON-LD `Offer` list; update both. Pricing cards do not have "Vybrat" buttons (removed by design).
- Age gate is required: the site is 18+. The modal is shown on first visit and remembered in `localStorage`. Don't remove without being asked.
- Reveal animation: any new section element that should fade in on scroll needs the `reveal` class — the IntersectionObserver in `script.js` picks it up automatically.
- Featured pricing card (`.plan--featured`) has a dark background; any text/button inside it needs explicit white-on-dark overrides (already done for list items, h3, price small, and the primary button).

## Deployment

Per the user's global instructions: deploy flow is Git → GitHub → Vercel (auto-deploy). Git author email must be `mamradkebabfx@gmail.com`. Never commit or push without explicit request.

- Git repo is initialized. Remote `origin` points to `https://github.com/mamradkebabfx-design/honza-trener.git`.
- Authentication for push is not yet set up — the user has no `gh` CLI and no Homebrew. When a push is needed, guide them via GitHub Desktop or a Personal Access Token; don't try `brew install gh`.
- After Vercel deploy, the `honzaprochazka.cz` placeholder must be replaced with the real domain (or the Vercel URL) in `index.html` (canonical, OG, JSON-LD `@id`s), `robots.txt`, and `sitemap.xml`.
