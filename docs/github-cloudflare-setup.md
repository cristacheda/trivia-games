# GitHub And Cloudflare Setup

Use this file for one-time repository and deployment setup. For ongoing release behavior, use [deployment.md](deployment.md).

## GitHub repository setup

### Actions

- Ensure GitHub Actions is enabled for the repository.
- Confirm the default branch is `main`.

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

Create a Cloudflare API token with permissions sufficient to deploy Pages projects for the target account.

### Account ID

Copy the Cloudflare account ID for the account that owns the Pages project and add it to GitHub as `CLOUDFLARE_ACCOUNT_ID`.

## Deployment path

1. Push a branch.
2. Open a pull request.
3. Let CI pass.
4. Push to `preview` if you want to test on the preview environment.
5. Merge to `main` when the change is ready for production.
6. GitHub Actions runs `.github/workflows/deploy-cloudflare-pages.yml`.
7. Cloudflare Pages receives the built `dist` folder.

## If the Pages project name changes

Update:

- `.github/workflows/deploy-cloudflare-pages.yml`

## If you switch to Vercel

Use:

- `vercel.json` for SPA rewrites and cache headers
- [deployment.md](deployment.md) for versioning and release behavior
