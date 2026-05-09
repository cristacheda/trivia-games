# Deployment

This file covers release flow, versioning, cache busting, and deployment behavior. For one-time dashboard setup, use [docs/github-cloudflare-setup.md](github-cloudflare-setup.md).

## Goals

- Deploy automatically from GitHub
- Keep the app portable between Cloudflare Pages and Vercel
- Make cache busting predictable when a new version ships

## Versioning and cache busting

- The app version comes from `package.json`.
- Each build also exposes the current commit SHA.
- The PWA cache id includes the app version.
- The generated offline service worker filename includes the current build id.
- `public/sw.js` is kept as a compatibility worker that unregisters stale legacy service workers and clears old app caches.
- Built assets use Vite content hashes.
- `index.html`, `sw.js`, `sw-*.js`, and `manifest.webmanifest` are configured for revalidation instead of long-lived caching.
- `public/_headers` is the source of truth for production CSP and cache-related response headers on Cloudflare Pages.
- The production CSP must stay aligned with Cloudflare-injected scripts and app features that rely on `blob:` images or workers.
- If Cloudflare Web Analytics is enabled, include `https://cloudflareinsights.com` in CSP `connect-src` so the RUM beacon endpoint (`/cdn-cgi/rum`) is not blocked.

## Release flow

1. Make and validate your changes.
2. Run one of:
   - `npm run release:patch`
   - `npm run release:minor`
   - `npm run release:major`
3. Push the branch and open a pull request.
4. Merge to `main`.
5. GitHub Actions deploys the new build.

## Validation commands

- `npm run lint`
- `npm test`
- `npm run build`
- `npm run test:e2e`
- `npm run check`
- `npm run docs:check` for the staged pre-commit docs guard
- `curl -I https://triviagames.cristache.net/sw.js` after production deploys when checking a cache fix

For UI changes, verify the experience at a mobile viewport before shipping. Treat mobile layout and interaction as required validation, not optional spot-checking.

## Cloudflare Pages

### Workflow

- CI runs on pull requests and pushes.
- Deployment runs on pushes to `main` and `preview`.
- The deploy workflow uploads the `dist` directory to the Cloudflare Pages project named `trivia-games`.
- Production deploys can optionally purge the root HTML, compatibility service worker, and manifest when `CLOUDFLARE_ZONE_ID` is available in GitHub Actions secrets.
- `main` is the production branch.
- `preview` is the long-lived preview branch.

### Branch behavior

- Pushes to `main` deploy the production site.
- Pushes to `preview` deploy a Pages preview branch deployment.
- The workflow uses the current GitHub branch name as the Pages branch value.

## Vercel fallback

- `vercel.json` is included for SPA rewrites and cache headers.
- The app can be deployed as a static site if you need to move away from Cloudflare Pages.

## Route handling

- `public/_redirects` supports SPA route fallback on platforms that honor that file.
- `vercel.json` provides the same behavior for Vercel.
