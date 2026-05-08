# Contributing

## Principles

- Keep the app accessible, fast, and easy to host cheaply.
- Prefer incremental changes that preserve the current product direction.
- Treat anonymous local-first play as a core requirement.

## Setup

```bash
npm install
npm run dev
```

`npm install` also configures the repo-local git hooks path so the docs-sync pre-commit check runs automatically.

Main local app URL:

- `http://localhost:5173/`

## Before opening a change

- Read [README.md](README.md) for the quick project summary.
- Read [docs/product-overview.md](docs/product-overview.md) for product rules.
- Read [docs/architecture.md](docs/architecture.md) if you are changing structure or data flow.
- Read [docs/deployment.md](docs/deployment.md) if the change affects releases, caching, CI, or hosting.

## Contribution workflow

1. Create a focused branch.
2. Make the smallest coherent change that solves the problem.
3. Add or update tests when behavior changes.
4. Run validation locally.
5. Open a pull request with a short explanation of the user-facing impact.

## Validation checklist

- `npm run check`
- `npm run test:e2e` for interactive or routing changes

## Coding expectations

- Keep files ASCII unless there is a good reason not to.
- Follow the existing feature-based structure.
- Reuse the local UI primitives in `src/components/ui` before introducing new patterns.
- Keep product copy in English for now.
- Preserve the future integration seams for auth, sync, analytics, and consent.

## Pull request guidance

- Explain what changed and why.
- Mention any product assumptions.
- Call out any follow-up work that was intentionally deferred.
- Include screenshots or short recordings for meaningful UI changes when possible.
- If the change is meant to ship, follow the release flow in [docs/deployment.md](docs/deployment.md).
