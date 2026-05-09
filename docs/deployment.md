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
- The generated offline service worker stays at `/sw.js` so already-installed clients can revalidate the same URL on later refreshes.
- `public/sitemap.xml` is generated during build from `scripts/generate-sitemap.mjs`.
- Built assets use Vite content hashes.
- `index.html`, `sw.js`, and `manifest.webmanifest` are configured for revalidation instead of long-lived caching.
- `public/_headers` is the source of truth for production CSP and cache-related response headers on Cloudflare Pages.
- The production CSP must stay aligned with Cloudflare-injected scripts and app features that rely on `blob:` images or workers.
- If Cloudflare Web Analytics is enabled, include `https://cloudflareinsights.com` in CSP `connect-src` so the RUM beacon endpoint (`/cdn-cgi/rum`) is not blocked.
- If PostHog EU analytics is enabled, include `https://eu.i.posthog.com` in CSP `connect-src` for event ingestion and `https://eu-assets.i.posthog.com` in both `script-src` and `connect-src` for PostHog remote config and extension assets.
- The artist quiz preview proxy runs through a Cloudflare Pages Function, so browser CSP only needs the Apple artwork CDNs in `img-src` and `https://audio-ssl.itunes.apple.com` in `media-src`; `itunes.apple.com` is only contacted server-side.

## Release flow

1. Make and validate your changes.
2. Run one of:
   - `npm run release:patch`
   - `npm run release:minor`
   - `npm run release:major`
   - Or run `npm version <x.y.z> --no-git-tag-version` when you need to set an exact version while keeping `package.json` and `package-lock.json` aligned.
3. Push the branch and open a pull request.
4. Merge to `main`.
5. GitHub Actions deploys the new build.

## Validation commands

- `npm run lint`
- `npm test`
- `npm run build`
- `npm run build:sitemap`
- `npm run test:e2e`
- `npm run check`
- `npm run docs:check` for the staged pre-commit docs guard
- `curl -I https://triviagames.cristache.net/sw.js` after production deploys when checking a cache fix

For UI changes, verify the experience at a mobile viewport before shipping. Treat mobile layout and interaction as required validation, not optional spot-checking.

## Local function testing

- Use `npm run build` first so Pages local dev serves the current static output.
- Run `npx wrangler@latest pages dev dist --ip 0.0.0.0 --port 4173` to serve both the built app and the repo-root `functions/` directory locally.
- Open `http://127.0.0.1:4173` on desktop.
- For device testing on the same network, open `http://<your-mac-lan-ip>:4173` on the phone.
- The artist preview proxy can be checked directly with:
  - `curl "http://127.0.0.1:4173/api/artist-preview?songTitle=Believer&artistName=Imagine%20Dragons"`
- `npm run dev` does not run Cloudflare Pages Functions; use `wrangler pages dev` whenever a change depends on `/api/*`.

## Cloudflare Pages

### Workflow

- CI runs on pull requests and pushes.
- Deployment runs on pushes to `main` and `preview`.
- The production app is built in GitHub Actions before the static `dist` directory is uploaded to Cloudflare Pages.
- Cloudflare Pages Functions are deployed from the repo-root `functions/` directory alongside the static build output, using `wrangler.jsonc` as the Pages configuration source of truth.
- Client-side `VITE_*` variables must therefore be configured in GitHub Actions secrets or variables for the build step, not only in the Cloudflare Pages dashboard.
- The deploy workflow runs `wrangler pages deploy dist --project-name trivia-games --branch <branch>` so the built asset directory stays explicit for the Wrangler version currently used in CI.
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
