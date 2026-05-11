# Architecture Notes

## App shape

- Static-first single-page app
- Client-rendered React routes
- Feature-based organization for game modules
- Production PWA support for offline-capable games

## Directory intent

- `src/pages`: route-level screens
- `src/features`: self-contained game logic and UI per game
- `src/components`: shared UI and layout components
- `src/lib`: shared utilities and persistence
- `src/lib/storage.ts`: lightweight app-state reads, writes, and React hooks for stats/preferences
- `src/lib/storage-decks.ts`: game-specific deck validation, reservation, and question-bank-backed persistence helpers
- `src/config`: metadata and game catalog configuration
- `src/integrations`: future external-service contracts and no-op implementations
- `src/components/seo`: route-aware document metadata updates

## Current data flow

- Game metadata comes from `src/config/site.ts`
- The homepage sorts `src/config/site.ts` entries with `isNew` first, and `src/components/game-card.tsx` renders a `New!` badge for ready games flagged that way
- `src/components/game-card.tsx` uses a full-height flex card layout so homepage CTA buttons stay anchored inside each card regardless of optional footer content
- Route-level SEO metadata (title and meta description) comes from `src/config/seo.ts`
- Flag quiz data and weighting live under `src/features/flag-quiz`
- Capital quiz data, state/country mixing, and answer matching live under `src/features/guess-the-capital`
- Outline quiz data, state/country mixing, SVG shapes, and answer matching live under `src/features/outline-quiz`
- Artist quiz data, song weighting, and answer matching live under `src/features/guess-the-artist`
- Currency quiz data, country weighting, and answer matching live under `src/features/guess-the-currency`
- Cocktail quiz data, popularity tiers, image paths, and answer matching live under `src/features/guess-the-cocktail`; images are static files in `public/cocktails/` downloaded at catalog-build time by `scripts/cocktail-catalog-cli.mjs`
- Outline quiz rendering preserves the raw bundled SVG path geometry instead of smoothing corners in the renderer
- Flag quiz rounds reserve country codes from a persisted weighted deck before building question objects
- Flag images are sourced from `flag-icons` (npm) as raw SVG strings bundled at build time via `import.meta.glob`; `src/components/country-flag.tsx` renders them directly as `<img>` elements via blob URLs — no canvas rasterization
- Capital quiz rounds reserve country and state subjects from persisted decks before building question objects
- Outline quiz rounds reserve country and state subjects from persisted decks before building question objects
- Artist quiz rounds reserve songs from a persisted deck before building question objects
- Currency quiz rounds reserve country codes from a persisted weighted deck before building question objects
- Cocktail quiz rounds reserve cocktails from two independent persisted decks — a regular deck (popular + common) and an obscure deck — guaranteeing exactly 1 obscure cocktail per round across all difficulties
- Currency quiz distractor options exclude countries that share the same primary currency code to prevent ambiguous multiple-choice questions (e.g. EUR shared by 25 countries, XOF by 8)
- Currency quiz level 1 shows the full currency name and ISO code; level 2 shows only the ISO code during the question then reveals the full name after the player answers; level 3 shows only the ISO code
- Question transition timing is shared through `src/lib/gameplay.ts`; future games should reuse those constants so wrong and timeout answers keep the global 5-second reveal delay
- Current global defaults are `1000ms` after correct answers and `4000ms` after wrong or timeout outcomes
- Timed low-time warning dispatch is also shared through `src/lib/gameplay.ts` and triggers once per second at 4, 3, 2, and 1 seconds remaining
- The homepage and shared app shell read only the lightweight app-state layer from `src/lib/storage.ts`; game routes import `src/lib/storage-decks.ts` when they need question-bank-backed deck logic
- Round results and preferences are stored through `src/lib/storage.ts`
- Sound cues are generated client-side through `src/lib/sound.ts`
- Analytics runs through `src/integrations`, while auth and score sync providers remain no-op placeholders
- The header logo uses the smaller `public/atlas.webp` asset for the live shell, while the larger PNG icons remain available for PWA install surfaces
- The browser document title and description meta tag are updated on route changes by `src/components/seo/route-seo.tsx`
- `src/components/layout/app-shell.tsx` owns the page-height shell, including the top inset around the app chrome and the footer flush alignment at the bottom edge

## Persistence

- Uses versioned `localStorage`
- Stores:
  - local player id
  - last selected difficulty per game
  - per-game high score
  - most recent round result
  - flag quiz country deck progress for cross-run non-repeating play
  - capital quiz country/state deck progress for cross-run non-repeating play
  - outline quiz country/state deck progress for cross-run non-repeating play
  - artist quiz song deck progress for cross-run non-repeating play
  - currency quiz country deck progress for cross-run non-repeating play
  - cocktail quiz dual-deck progress (separate regular and obscure pointers) for cross-run non-repeating play
  - app-level sound enabled preference
  - app-level tracking consent preference

## Offline model

- PWA build is enabled for production
- The shipped games are intended to be playable offline after their initial assets are cached
- Dev mode does not force PWA caching behavior

## Planned external integrations

- Supabase for auth and sync
- Consent manager for GDPR-sensitive tracking
- Additional analytics destinations if the product outgrows the current PostHog setup

## Current analytics

- PostHog is initialized through `src/integrations/posthog-provider.ts` when `VITE_POSTHOG_KEY` is set.
- The PostHog client is loaded lazily after the existing token and consent gates pass, so analytics code stays off the homepage startup path until tracking is actually allowed.
- SPA pageviews are emitted from the shared app shell instead of relying on PostHog automatic pageviews.
- PostHog pageleave capture is always enabled so Web Analytics bounce and session duration stay accurate regardless of pageview capture settings.
- Custom game analytics include game views, difficulty selection, round start, question answers, round completion, homepage game-entry clicks, and high-score beats.
- Free-text answer contents are intentionally excluded from analytics payloads.
- Consent gating is implemented through a local in-app privacy control that auto-opens on first visit while consent is still unknown.
- Optional analytics remain off until the player explicitly allows them.
- For verification, `?__posthog_debug=true` enables PostHog debug logging, and `window.__atlasAnalyticsDebug.captureTestEvent()` can send a manual test event from the browser console.

## Constraints

- Keep hosting portable between Cloudflare Pages and Vercel
- Avoid backend coupling unless a task explicitly requires it
- Keep new games modular rather than embedding them into shared page files
