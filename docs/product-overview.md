# Product Overview

## Purpose

Atlas of Answers is a collection of web games designed to help players train for trivia contests, pub quizzes, and geography-heavy knowledge rounds.

## Audience

- European trivia players are the primary audience.
- The games should still feel globally relevant and not Europe-centric.

## Current MVP

- Homepage with a grid of games
- One playable game: `Name the Country Flag`
- One teaser card for the upcoming outline game
- Local-first score and preference storage
- Offline-capable first game after the initial asset load

## Core product decisions

- No account is required to play.
- Preferences and scores are stored in the browser with `localStorage`.
- Cookies are not the default persistence mechanism.
- Google and GitHub login are planned for cross-device sync later.
- GDPR consent and analytics are planned but not fully implemented yet.

## First game rules

### Name the Country Flag

- Uses UN member countries.
- Prioritizes countries outside Europe.
- Gives extra exposure to smaller or less familiar countries.
- Runs in rounds of 10 questions.

### Difficulty levels

- `Level 1`: 5 options, 20 seconds, 1 point
- `Level 2`: 3 options, 10 seconds, 2 points
- `Level 3`: free text, 15 seconds, 3 points, light misspelling tolerance

## Near-term roadmap

- Gather feedback on the homepage and first game
- Add the outline game
- Add login and score sync with Supabase
- Add privacy/consent UX
- Add analytics events after consent design is finalized
