# Agent Notes

Load this file first for repo-specific implementation context. Follow links for deeper product or deployment detail instead of duplicating that context in prompts.

## Load order

- Start here for repo rules and key paths.
- Read [docs/product-overview.md](docs/product-overview.md) for product rules.
- Read [docs/architecture.md](docs/architecture.md) for system structure.
- Read [docs/deployment.md](docs/deployment.md) before changing release, cache, or hosting behavior.

## Stack

- React 19
- Vite
- TypeScript
- Tailwind CSS v4
- shadcn-style local UI primitives in `src/components/ui`
- Vitest for unit tests
- Playwright for browser smoke tests
- Vite PWA for production offline support

## Repo-specific rules

- Anonymous play must work without an account.
- Mobile users are the primary UX target for layout and interaction decisions.
- Scores and preferences live in `localStorage`, not cookies.
- Login, sync, analytics, and consent are intentionally stubbed for now, not fully wired.

## Key code locations

- `src/pages/home-page.tsx`: homepage and game shelf
- `src/pages/flag-quiz-page.tsx`: page shell for the first game
- `src/features/flag-quiz/`: quiz logic, question generation, matching, and UI
- `src/lib/storage.ts`: versioned local persistence
- `src/integrations/`: future auth, sync, analytics, and consent contracts
- `src/config/site.ts`: site metadata and game catalog

## Working rules for agents

- Prefer small, focused edits over broad refactors.
- Keep docs split by purpose; avoid turning one file into a large knowledge dump.
- Preserve the static-first architecture unless the task explicitly requires backend work.
- Do not replace local storage with cookies.
- Keep visible copy isolated and easy to localize later.
- If adding a new game, build it as a separate feature module under `src/features`.

## Validation

- Run `npm run check`
- Run `npm run test:e2e` when browser behavior changes
- Verify UI changes at a mobile viewport before handoff
