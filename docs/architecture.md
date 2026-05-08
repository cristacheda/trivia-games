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
- `src/config`: metadata and game catalog configuration
- `src/integrations`: future external-service contracts and no-op implementations

## Current data flow

- Game metadata comes from `src/config/site.ts`
- Flag quiz data and weighting live under `src/features/flag-quiz`
- Capital quiz data, state/country mixing, and answer matching live under `src/features/guess-the-capital`
- Outline quiz data, state/country mixing, SVG shapes, and answer matching live under `src/features/outline-quiz`
- Flag quiz rounds reserve country codes from a persisted weighted deck before building question objects
- Capital quiz rounds reserve country and state subjects from persisted decks before building question objects
- Outline quiz rounds reserve country and state subjects from persisted decks before building question objects
- Round results are stored through `src/lib/storage.ts`
- Sound cues are generated client-side through `src/lib/sound.ts`
- Integration hooks exist, but external providers are currently no-op

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
  - app-level sound enabled preference

## Offline model

- PWA build is enabled for production
- The shipped games are intended to be playable after their initial assets are cached
- Dev mode does not force PWA caching behavior

## Planned external integrations

- Supabase for auth and sync
- Consent manager for GDPR-sensitive tracking
- Analytics provider after consent behavior is defined

## Constraints

- Keep hosting portable between Cloudflare Pages and Vercel
- Avoid backend coupling unless a task explicitly requires it
- Keep new games modular rather than embedding them into shared page files
