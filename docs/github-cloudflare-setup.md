# GitHub And Cloudflare Setup

Use this file for one-time repository and deployment setup. For ongoing release behavior, use [deployment.md](deployment.md).

## GitHub repository setup

### Actions

- Ensure GitHub Actions is enabled for the repository.
- Confirm the default branch is `main`.
- Protect `main` with required pull requests and required status checks before shipping.
- Prefer SHA-pinned or policy-restricted GitHub Actions where possible.

### Secrets

Add these repository secrets in GitHub:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Path:

- GitHub repository
- `Settings`
- `Secrets and variables`
- `Actions`

### Pull requests

- The repository includes `.github/pull_request_template.md`.
- CI runs automatically from `.github/workflows/ci.yml`.
- Enable secret scanning, push protection, and Dependabot security updates for the public repository.

## Cloudflare setup

### Pages project

Create or confirm a Cloudflare Pages project named:

- `trivia-games`

### Domain

Attach the production domain:

- `triviagames.cristache.net`

### Preview domain

Attach the preview domain:

- `triviagames-preview.cristache.net`

After the first successful deployment from the `preview` branch:

1. Open the `trivia-games` Pages project.
2. Add the custom domain `triviagames-preview.cristache.net`.
3. In Cloudflare DNS, point that hostname to the Pages branch alias target:
   - `preview.trivia-games.pages.dev`

This follows Cloudflare's branch-alias custom domain model for Pages preview branches.

### API token

Create a Cloudflare API token with only the permissions needed to deploy the target Pages project and purge the target zone cache if you use the purge step.

### Privacy-sensitive hosting features

- If the app uses opt-in-only analytics, disable any host-injected analytics product that runs before the app can evaluate player consent.

### Account ID

Copy the Cloudflare account ID for the account that owns the Pages project and add it to GitHub as `CLOUDFLARE_ACCOUNT_ID`.

## Deployment path

1. Push a branch.
2. Open a pull request.
3. Let CI pass.
4. Push to `preview` if you want to test on the preview environment.
5. Merge to `main` when the change is ready for production.
6. GitHub Actions runs `.github/workflows/deploy-cloudflare-pages.yml`.
7. Cloudflare Pages receives the built `dist` folder and the repo-root `functions/` directory defined by `wrangler.jsonc`.

## Local Pages testing

- Build the app with `npm run build`.
- Start local Pages + Functions with `npx wrangler@latest pages dev dist --ip 0.0.0.0 --port 4173`.
- Use `http://127.0.0.1:4173` locally, or `http://<your-mac-lan-ip>:4173` from a phone on the same network.
- This is required for testing repo-root `functions/`; plain `npm run dev` only runs Vite and will not serve the Pages proxy endpoints.

## If the Pages project name changes

Update:

- `.github/workflows/deploy-cloudflare-pages.yml`

## If you switch to Vercel

Use:

- `vercel.json` for SPA rewrites and cache headers
- [deployment.md](deployment.md) for versioning and release behavior
