# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Atlas of Answers is a static-first trivia training PWA for quiz players, with geography and music rounds. It is a client-rendered React SPA; all game state lives in `localStorage`. Anonymous play without an account is a core requirement.

## Commands

```bash
npm run dev           # Start Vite dev server at http://localhost:5173/
npm run build         # Production build (tsc + vite + sitemap + cache verify)
npm run preview       # Preview production build locally
npm run lint          # ESLint
npm test              # Unit tests (Vitest)
npm run test:watch    # Vitest watch mode
npm run test:e2e      # Playwright e2e tests (Chrome only)
npm run check         # Full validation: lint + test + build
```

Run a single unit test file:
```bash
npx vitest run src/lib/__tests__/storage.test.ts
```

Run `npm run check` before opening a PR. Run `npm run test:e2e` when browser behavior or routing changes.

## Architecture

### Feature modules

Games are self-contained under `src/features/`:
- `flag-quiz/` — Name the Country Flag
- `guess-the-capital/` — Guess the Capital
- `outline-quiz/` — Name the Country by Its Outline
- `guess-the-artist/` — Guess the Artist by Song

Each feature module owns its data, question generation, answer matching, and UI. New games must be added as separate feature modules here, not embedded in shared files.

### Key paths

| Path | Purpose |
|------|---------|
| `src/config/site.ts` | Site metadata and game catalog |
| `src/config/seo.ts` | Per-route SEO titles and descriptions |
| `src/lib/storage.ts` | Versioned `localStorage` persistence |
| `src/lib/gameplay.ts` | Shared timing constants (1s correct / 4s wrong-or-timeout delay; low-time warnings at 4–1s) |
| `src/lib/sound.ts` | Client-side sound generation |
| `src/integrations/` | No-op stubs for auth, sync, analytics, and consent — preserve these seams |
| `src/components/ui/` | Local shadcn-style UI primitives — reuse before introducing new patterns |
| `src/components/seo/route-seo.tsx` | Updates document title and meta description on route changes |

### Data flow

Each game round reserves questions from a persisted weighted deck (stored in `localStorage`) before building question objects. Rounds use the timing constants from `src/lib/gameplay.ts`; future games must do the same.

### Persistence

Versioned `localStorage` (via `src/lib/storage.ts`) stores player ID, difficulty preferences, high scores, round results, per-game deck progress, sound preference, and tracking consent. Do not replace with cookies.

### Analytics

PostHog is initialized via `src/integrations/posthog-provider.ts` when `VITE_POSTHOG_KEY` is set. Free-text answer contents are excluded from all analytics payloads. Debug: append `?__posthog_debug=true` or call `window.__atlasAnalyticsDebug.captureTestEvent()` from the browser console.

## Rules

- Mobile is the primary UX target — verify UI changes at a mobile viewport.
- Keep hosting portable between Cloudflare Pages and Vercel; avoid backend coupling.
- Keep visible copy isolated so it can be localized later.
- Outline quiz SVG path geometry must not be smoothed in the renderer.
- Do not wire login, sync, or consent until those tasks are explicitly scoped — preserve the stubs as-is.

## Docs

For product rules, see `docs/product-overview.md`. For release and cache behavior, see `docs/deployment.md`. For the artist catalog CLI, see `docs/artist-catalog-cli.md`.
