# Design

This document describes the current design direction of Atlas of Answers as it exists in this repository. It is a product-and-implementation guide for contributors who need to extend the app without drifting away from the existing experience.

For deeper detail, use the source docs alongside this file:

- `AGENTS.md` for repo rules and validation
- `docs/product-overview.md` for game rules and roadmap
- `docs/architecture.md` for system structure and data flow
- `docs/deployment.md` for release and cache behavior

## Product intent

Atlas of Answers is a static-first collection of trivia training games built for repeat play on mobile devices. It is designed to feel fast, lightweight, and immediately usable without requiring an account.

The current product emphasizes:

- fast entry into a round
- repeatable practice with local progress
- a polished mobile-first interface
- offline-capable play after initial asset caching
- a growing shelf of self-contained trivia games

The product should help players prepare for pub quizzes, trivia contests, and geography-heavy knowledge rounds without feeling like a classroom tool.

## Design principles

### 1. Mobile-first before desktop polish

Mobile users are the primary audience. New layouts, controls, and game flows should be judged on phone usability first:

- thumb-friendly tap targets
- clear visual hierarchy on narrow screens
- short vertical flows with minimal dead space
- no dependence on hover or precise cursor interactions

Desktop support matters, but it should not drive the initial interaction model.

### 2. Anonymous play by default

A player should be able to land on the site and start a game immediately. Accounts, sync, and external identity are future enhancements, not current dependencies.

Implications:

- no auth gates in the core loop
- no required onboarding before first play
- local progress must remain functional even without consent or login

### 3. Static-first architecture

The app should remain deployable as a static site with lightweight edge augmentation only where clearly needed. The existing artist preview proxy is an exception, not a precedent for general backend expansion.

Implications:

- prefer local datasets and deterministic round generation
- avoid server-backed state for core gameplay
- keep hosting portable between Cloudflare Pages and Vercel

### 4. Repetition without boredom

Each game is designed for repeated short sessions. Persistent deck progress in `localStorage` reduces obvious repetition and makes the app feel more intentional than a naive random quiz generator.

Implications:

- question pools should be consumed in weighted cycles
- harder difficulties should shift toward less obvious material
- repeated rounds should preserve novelty as long as possible

### 5. Clear, localizable copy

Visible copy should stay isolated and easy to revise later. Avoid burying player-facing text inside deeply coupled logic where future localization becomes expensive.

## Experience design

### Homepage

The homepage is a game shelf, not a marketing site. Its job is to:

- establish the tone quickly
- surface playable games immediately
- highlight newly launched games
- show enough score context to encourage return play

The hero should stay lightweight and aspirational. The shelf should remain the primary call to action.

### Game loop

Across all games, the expected loop is:

1. Choose a game.
2. Pick or reuse a difficulty.
3. Play a short round of 20 questions.
4. Receive immediate feedback and score updates.
5. Start another round quickly.

This loop should remain consistent enough that new games feel familiar, while each feature module still owns its own question logic and presentation.

### Feedback and pacing

The app uses subtle feedback rather than loud arcade-style effects:

- lightweight sound cues
- brief correct-answer transitions
- longer reveal windows for wrong or timed-out answers
- restrained celebratory moments such as high-score feedback

Shared pacing rules should continue to live in common utilities when they are intended to be global product behavior.

### Privacy and trust

Privacy messaging should remain simple and explicit. Optional analytics are off until the player opts in. Gameplay progress and scores remain local regardless of that choice.

This is part of the product design, not just a compliance detail.

## Information architecture

The repository is organized around feature ownership:

- `src/pages`: route-level screens and page shells
- `src/features`: per-game logic, data, matching, and UI
- `src/components`: shared UI and app layout
- `src/lib`: shared browser utilities and persistence
- `src/config`: app metadata, catalog, SEO, and build config
- `src/integrations`: external-service contracts and current no-op or optional providers

New games should be added as separate modules under `src/features`, then connected into the catalog and routing layer. Avoid embedding large game-specific logic directly into shared page files.

## Current feature set

The current playable catalog includes:

- Name the Country Flag
- Guess the Capital
- Name the Country by Its Outline
- Guess the Artist by Song
- Guess the Currency
- Guess the Cocktail

The current teased game is:

- Guess the Official Language

Each playable game follows the same broad design contract:

- three difficulty levels
- 20-question rounds
- local score persistence
- persistent deck progress to reduce repetition
- offline-capable core flow after assets are cached

## Visual direction

The current UI direction is soft, light, and editorial rather than dark, neon, or heavily gamified.

Key characteristics:

- bright surfaces and gentle gradients
- serif-forward headings paired with clean utility text
- rounded cards and soft borders
- restrained accent color usage
- enough polish to feel premium without looking corporate

Future UI changes should preserve that character unless the product direction is deliberately reset.

## State and persistence design

Local persistence is a core feature, not an implementation accident.

The app stores:

- local player identity
- difficulty preferences
- per-game high scores
- recent results
- weighted deck progress for each game
- sound preference
- tracking consent

Rules:

- use `localStorage`, not cookies, for this state
- preserve versioned migrations through `src/lib/storage.ts`
- treat non-repeating deck progress as product behavior, not disposable cache

## Offline design

Offline support is part of the product promise for shipped games. After initial asset load, playable routes should continue working without network access.

Design implications:

- favor local assets and bundled datasets
- avoid runtime dependencies for core question generation
- treat media dependencies carefully, especially for image-heavy or preview-based games
- verify offline behavior when a UI or routing change could affect caching or asset lookup

## Analytics and integrations

Analytics, auth, sync, and consent integrations are intentionally decoupled from the core game loop.

Current stance:

- analytics are optional and consent-gated
- auth and sync are planned but stubbed
- the app must remain fully usable without external services

This boundary should stay firm unless a change explicitly requires product-level expansion.

## Contributor guidance

When extending the project:

- prefer small, focused edits over broad refactors
- keep game-specific logic inside the relevant feature module
- preserve the shared round structure unless there is a strong product reason to diverge
- validate mobile behavior for visible UI changes
- avoid introducing backend coupling for problems that can be solved statically
- keep docs split by purpose instead of turning this file into a catch-all spec

## Design checklist for new work

Before shipping a feature or UI change, check:

- Does it still work well on a phone-sized viewport?
- Can a new player start playing without an account?
- Does it preserve local-first progress and preferences?
- Does it fit the existing visual tone?
- Does it keep gameplay functional offline after initial caching?
- Is game-specific behavior isolated to the right feature module?
- Does it avoid unnecessary server dependence?

If the answer to any of these is no, the change likely needs to be re-scoped or justified more explicitly.
