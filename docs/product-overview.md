# Product Overview

## Purpose

Atlas of Answers is a collection of web games designed to help players train for trivia contests, pub quizzes, and geography-heavy knowledge rounds.

## Audience

- Mobile users are the primary product audience for interaction and layout quality.
- European trivia players are the primary audience.
- The games should still feel globally relevant and not Europe-centric.

## Current MVP

- Homepage with a grid of games
- Five playable games: `Name the Country Flag`, `Guess the Capital`, `Name the Country by Its Outline`, `Guess the Artist by Song`, and `Guess the Currency`
- One upcoming teaser card: `Guess the Official Language`
- Local-first score and preference storage
- Subtle in-game sound cues with a local mute toggle
- Offline-capable playable games after the initial asset load
- Timed rounds play a subtle low-time warning tone once per second at 4, 3, 2, and 1 seconds remaining

## Core product decisions

- No account is required to play.
- Preferences and scores are stored in the browser with `localStorage`.
- Flag quiz country exposure is also tracked in `localStorage` so new rounds avoid repeating flags until a full country cycle has been used.
- Cookies are not the default persistence mechanism.
- Google and GitHub login are planned for cross-device sync later.
- First-time visitors are prompted with an in-app privacy panel to decide whether optional analytics are enabled.
- Scores and gameplay progress still stay local even when optional analytics are denied.

## First game rules

### Name the Country Flag

- Uses UN member countries.
- Prioritizes countries outside Europe.
- Gives extra exposure to smaller or less familiar countries.
- Runs in rounds of 20 questions.
- Reuses as many unseen countries as possible across rounds before reshuffling into a new weighted cycle.
- Plays subtle sounds for correct answers, wrong answers, low-time warning in timed rounds, round finish, and new high scores.

### Difficulty levels

- `Level 1`: 3 options, no time limit, 1 point
- `Level 2`: 5 options, 10 seconds, 2 points
- `Level 3`: free text, no time limit, 3 points, light misspelling tolerance

### Guess the Capital

- Uses UN member countries plus the 50 US states.
- Runs in rounds of 20 questions: 18 countries and 2 states.
- Reuses as many unseen countries and states as possible across rounds before reshuffling into a new weighted cycle.
- When the prompt is a US state on multiple-choice difficulties, the answer list uses only US state capitals.
- `Level 1`: 3 options, no time limit, 1 point.
- `Level 2`: 5 options, 15 seconds, 2 points, stronger bias away from Europe.
- `Level 3`: free text, no time limit, 3 points, light misspelling tolerance plus common capital variants.

### Name the Country by Its Outline

- Uses all UN member countries plus the 50 US states.
- Runs in rounds of 20 questions: 18 countries and 2 states.
- Reuses as many unseen countries and states as possible across rounds before reshuffling into a new weighted cycle.
- `Level 1`: 3 options, no time limit, 1 point.
- `Level 2`: 5 options, 15 seconds, 2 points, stronger bias toward smaller and less familiar geography.
- `Level 3`: free text, no time limit, 3 points, light misspelling tolerance.

### Guess the Artist by Song

- Uses a curated static song catalog.
- Runs in rounds of 20 questions.
- Reuses as many unseen songs as possible across rounds before reshuffling into a new weighted cycle.
- `Level 1`: 3 options, no time limit, 1 point.
- `Level 2`: 5 options, 15 seconds, 2 points, stronger bias toward less obvious artists.
- `Level 3`: free text, no time limit, 3 points, light misspelling tolerance for artist names.
- Catalog updates skip ambiguous entries until explicitly confirmed. Current skipped examples: `Bob Sinclair`, `Florence`, and `HUNTR/X`.

### Guess the Currency

- Uses all UN member countries with currency data (193 countries; Micronesia excluded for lacking currency data).
- Prioritises countries outside Europe; higher difficulties further boost small, exotic, and less-known nations.
- Distractor options never include countries that share the same primary currency code (e.g. EUR, XOF, XCD, USD) to keep every question unambiguous.
- Runs in rounds of 20 questions.
- Reuses as many unseen countries as possible across rounds before reshuffling into a new weighted cycle.
- `Level 1`: 3 options, no time limit, 1 point. Shows full currency name and ISO code (e.g. "Romanian leu (RON)").
- `Level 2`: 5 options, 15 seconds, 2 points. Shows only the ISO code during the question; reveals the full name after the player answers.
- `Level 3`: free text, no time limit, 3 points, light misspelling tolerance for country names. Shows only the ISO code.

## Near-term roadmap

- Build the official-language game now teased on the homepage
- Add login and score sync with Supabase
- Refine privacy onboarding and consent copy
- Review PostHog event quality and expand game-specific reporting where useful
