# Product Overview

## Purpose

Atlas of Answers is a collection of web games designed to help players train for trivia contests, pub quizzes, and geography-heavy knowledge rounds.

## Audience

- Mobile users are the primary product audience for interaction and layout quality.
- European trivia players are the primary audience.
- The games should still feel globally relevant and not Europe-centric.

## Current MVP

- Homepage with a grid of games
- Two playable games: `Name the Country Flag` and `Guess the Capital`
- One teaser card for the upcoming outline game
- Local-first score and preference storage
- Subtle in-game sound cues with a local mute toggle
- Offline-capable playable games after the initial asset load

## Core product decisions

- No account is required to play.
- Preferences and scores are stored in the browser with `localStorage`.
- Flag quiz country exposure is also tracked in `localStorage` so new rounds avoid repeating flags until a full country cycle has been used.
- Cookies are not the default persistence mechanism.
- Google and GitHub login are planned for cross-device sync later.
- GDPR consent and analytics are planned but not fully implemented yet.

## First game rules

### Name the Country Flag

- Uses UN member countries.
- Prioritizes countries outside Europe.
- Gives extra exposure to smaller or less familiar countries.
- Runs in rounds of 20 questions.
- Reuses as many unseen countries as possible across rounds before reshuffling into a new weighted cycle.
- Plays subtle sounds for correct answers, wrong answers, round finish, and new high scores.

### Difficulty levels

- `Level 1`: 3 options, no time limit, 1 point
- `Level 2`: 5 options, 10 seconds, 2 points
- `Level 3`: free text, no time limit, 3 points, light misspelling tolerance

### Guess the Capital

- Uses UN member countries plus the 50 US states.
- Runs in rounds of 20 questions: 18 countries and 2 states.
- Reuses as many unseen countries and states as possible across rounds before reshuffling into a new weighted cycle.
- `Level 1`: 3 options, no time limit, 1 point.
- `Level 2`: 5 options, 15 seconds, 2 points, stronger bias away from Europe.
- `Level 3`: free text, no time limit, 3 points, light misspelling tolerance plus common capital variants.

## Near-term roadmap

- Gather feedback on the homepage and first game
- Add the outline game
- Add login and score sync with Supabase
- Add privacy/consent UX
- Add analytics events after consent design is finalized
