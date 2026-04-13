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
- `index.html` — single-page layout. Sections in order: hero → about (`#o-mne`) → benefits (`#benefity`) → for-whom → pricing (`#cenik`) → FAQ (`#faq`) → CTA/contact (`#kontakt`) → footer. Contains inline JSON-LD structured data (LocalBusiness, Person, Service+Offer, FAQPage) — keep it in sync with visible copy when editing pricing, FAQ, or contact info.
- `styles.css` — all styles. Design tokens are CSS custom properties on `:root` (colors, radius, shadow, easing). Minimalistic aesthetic: black/white/gray with a single green accent (`--accent: #14a277`). Mobile-first, single stylesheet, no preprocessor.
- `script.js` — age gate (18+, gated via `localStorage.ageVerified`), sticky nav shadow, mobile menu toggle, IntersectionObserver reveal animations (`.reveal` → `.visible`), and contact form validation with a `mailto:` fallback (no backend).

Assets:
- `assets/` is the live folder referenced by `index.html` (logo, trainer photos). `images/` is the original source dump — copy into `assets/` when adding new photos, don't reference `images/` from HTML.
- Trainer photos currently used: `assets/honza-hero.jpg` (hero) and `assets/honza-about.jpg` (also used as OG image).

SEO:
- `robots.txt` and `sitemap.xml` hardcode `https://honzaprochazka.cz/`. Same for canonical / OG URLs and all `@id`s in the JSON-LD block in `index.html`. **Before launch, replace this placeholder domain everywhere.**
- Meta description, OG tags, and JSON-LD all duplicate copy from the page — when editing pricing, FAQ answers, or contact details, update the JSON-LD block in `index.html` head as well.

## Conventions specific to this project

- Copy is in Czech. Keep tone calm, human, non-pushy per `honza-trener.md`.
- Instagram handle is `@_honza_prochazka` (note leading underscore). Email is `prochazka.coaching@gmail.com`. Location: Form Factory, Václavské náměstí, Prague.
- Pricing: 1×/week = 800 Kč, 2×/week = 700 Kč, 3×/week = 600 Kč — these appear in the pricing section AND the JSON-LD `Offer` list; update both.
- Age gate is required: the site is 18+. The modal is shown on first visit and remembered in `localStorage`. Don't remove without being asked.
- Reveal animation: any new section element that should fade in on scroll needs the `reveal` class — the IntersectionObserver in `script.js` picks it up automatically.

## Deployment

Per the user's global instructions: deploy flow is Git → GitHub → Vercel (auto-deploy). Git author email must be `mamradkebabfx@gmail.com`. Never commit or push without explicit request.
