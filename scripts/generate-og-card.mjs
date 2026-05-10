import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const outputDir = path.join(repoRoot, 'public', 'social')
const outputPath = path.join(outputDir, 'atlas-of-answers-og.png')

const frauncesUrl = pathToFileURL(
  path.join(
    repoRoot,
    'node_modules',
    '@fontsource',
    'fraunces',
    'files',
    'fraunces-latin-600-normal.woff2',
  ),
).href

const sourceSansRegularUrl = pathToFileURL(
  path.join(
    repoRoot,
    'node_modules',
    '@fontsource',
    'source-sans-3',
    'files',
    'source-sans-3-latin-400-normal.woff2',
  ),
).href

const sourceSansSemiboldUrl = pathToFileURL(
  path.join(
    repoRoot,
    'node_modules',
    '@fontsource',
    'source-sans-3',
    'files',
    'source-sans-3-latin-600-normal.woff2',
  ),
).href

const iconPaths = {
  geography:
    'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c4.96 0 9-4.03 9-9s-4.04-9-9-9Zm0 0c2.2 2.4 3.4 5.66 3.4 9S14.2 18.6 12 21m0-18C9.8 5.4 8.6 8.66 8.6 12s1.2 6.6 3.4 9m-8-9h16M5.2 7.5h13.6M5.2 16.5h13.6',
  flags: 'M5 20V4m0 0h9l-1.4 2.8L14 10H5m0-6v6',
  music:
    'M15 4v10.2a2.8 2.8 0 1 1-2-2.68V6.7l-5 1.1v8.4a2.8 2.8 0 1 1-2-2.68V6.2L15 4Z',
  currency:
    'M12 4v16m4-12.5c-.8-1.2-2.3-2-4-2-2.49 0-4.5 1.34-4.5 3s2.01 3 4.5 3 4.5 1.34 4.5 3-2.01 3-4.5 3c-1.7 0-3.2-.7-4-2',
  cocktails:
    'M6 4h12l-4.7 5.3v5.1L15.5 18v1h-7v-1l2.2-3.6V9.3L6 4Zm2.5 0 3.8 4.2L16 4',
  languages:
    'M4 6h8m-4 0c0 4.4-1.6 7.8-4.8 10M8 6c1.1 2.6 3 5 5.8 7M14 6h6m-3 0c0 4.1 1.3 7.4 4 10m-7.5-2h7',
}

function iconSvg(pathData) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${pathData}" pathLength="1" /></svg>`
}

async function buildHtml() {
  const atlasLogoBase64 = await fs.readFile(
    path.join(repoRoot, 'public', 'atlas.png'),
    'base64',
  )

  return String.raw`
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>
      @font-face {
        font-family: "Fraunces";
        src: url("${frauncesUrl}") format("woff2");
        font-style: normal;
        font-weight: 600;
      }

      @font-face {
        font-family: "Source Sans 3";
        src: url("${sourceSansRegularUrl}") format("woff2");
        font-style: normal;
        font-weight: 400;
      }

      @font-face {
        font-family: "Source Sans 3";
        src: url("${sourceSansSemiboldUrl}") format("woff2");
        font-style: normal;
        font-weight: 600;
      }

      :root {
        --bg-start: #f7fcf7;
        --bg-mid: #edf6ee;
        --bg-end: #e7f2e8;
        --primary: #1f7a45;
        --primary-soft: rgba(31, 122, 69, 0.1);
        --text: #13261b;
        --muted: #415448;
        --accent: #c38a2e;
        --card-border: rgba(19, 38, 27, 0.09);
        --card-bg: rgba(255, 255, 255, 0.66);
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        width: 1200px;
        height: 630px;
        overflow: hidden;
      }

      body {
        font-family: "Source Sans 3", sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(69, 154, 103, 0.18), transparent 30%),
          radial-gradient(circle at top right, rgba(191, 219, 198, 0.48), transparent 28%),
          radial-gradient(circle at 50% 100%, rgba(132, 193, 152, 0.16), transparent 42%),
          linear-gradient(160deg, rgba(246, 252, 247, 0.98) 0%, rgba(229, 245, 235, 0.92) 56%, rgba(212, 236, 220, 0.86) 100%);
        position: relative;
      }

      body::before {
        content: "";
        position: absolute;
        inset: 26px;
        border-radius: 36px;
        background:
          linear-gradient(160deg, rgba(255, 255, 255, 0.52), rgba(255, 255, 255, 0.14));
        border: 1px solid rgba(255, 255, 255, 0.56);
        box-shadow:
          0 20px 50px rgba(31, 122, 69, 0.08),
          inset 0 1px 0 rgba(255, 255, 255, 0.7);
      }

      .canvas {
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-columns: 1.45fr 0.95fr;
        gap: 28px;
        width: 100%;
        height: 100%;
        padding: 72px;
      }

      .copy {
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-width: 0;
      }

      .brand {
        display: inline-flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 26px;
      }

      .brand-mark {
        width: 72px;
        height: 72px;
        border-radius: 22px;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.88);
        border: 1px solid rgba(19, 38, 27, 0.07);
        box-shadow:
          0 14px 28px rgba(31, 122, 69, 0.14),
          inset 0 1px 0 rgba(255, 255, 255, 0.82);
      }

      .brand-mark img {
        width: 100%;
        height: 100%;
        display: block;
      }

      .brand-name {
        font-family: "Fraunces", serif;
        font-size: 34px;
        line-height: 1;
        letter-spacing: -0.03em;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        width: fit-content;
        margin-bottom: 24px;
        padding: 10px 16px;
        border-radius: 999px;
        background: rgba(31, 122, 69, 0.12);
        color: var(--primary);
        font-size: 16px;
        font-weight: 600;
        letter-spacing: 0.01em;
      }

      h1 {
        margin: 0;
        max-width: 620px;
        font-family: "Fraunces", serif;
        font-size: 72px;
        line-height: 0.96;
        letter-spacing: -0.045em;
        text-wrap: balance;
      }

      .support {
        max-width: 590px;
        margin: 24px 0 0;
        color: var(--muted);
        font-size: 27px;
        line-height: 1.22;
      }

      .tiles {
        position: relative;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        align-content: center;
        gap: 18px;
        padding: 34px 10px 20px 0;
      }

      .tiles::before {
        content: "";
        position: absolute;
        inset: 42px 26px 22px 12px;
        border-radius: 34px;
        background:
          radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.65), transparent 34%),
          radial-gradient(circle at 75% 80%, rgba(195, 138, 46, 0.1), transparent 20%);
        filter: blur(2px);
      }

      .column {
        position: relative;
        display: grid;
        gap: 18px;
      }

      .column--offset {
        padding-top: 42px;
      }

      .tile {
        position: relative;
        border-radius: 28px;
        border: 1px solid var(--card-border);
        background: var(--card-bg);
        backdrop-filter: blur(14px);
        padding: 20px 18px 18px;
        box-shadow:
          0 18px 34px rgba(31, 122, 69, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.86);
      }

      .tile:nth-child(2n) {
        transform: translateY(8px);
      }

      .tile svg {
        width: 30px;
        height: 30px;
        display: block;
        color: var(--primary);
      }

      .tile path {
        fill: none;
        stroke: currentColor;
        stroke-width: 1.7;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .tile-label {
        margin-top: 16px;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--muted);
      }

      .spark {
        position: absolute;
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: rgba(195, 138, 46, 0.28);
        box-shadow: 0 0 0 8px rgba(195, 138, 46, 0.08);
      }

      .spark--one {
        top: 94px;
        right: 62px;
      }

      .spark--two {
        bottom: 72px;
        left: 16px;
        width: 12px;
        height: 12px;
      }
    </style>
  </head>
  <body>
    <main class="canvas">
      <section class="copy">
        <div class="brand">
          <div class="brand-mark">
            <img alt="" src="data:image/png;base64,${atlasLogoBase64}" />
          </div>
          <div class="brand-name">Atlas of Answers</div>
        </div>

        <div class="badge">Modern trivia practice</div>
        <h1>Train like you're about to walk into the next quiz final.</h1>
        <p class="support">
          Fast, elegant trivia rounds for flags, capitals, outlines, music,
          currency, cocktails, and more.
        </p>
      </section>

      <section class="tiles" aria-hidden="true">
        <div class="spark spark--one"></div>
        <div class="spark spark--two"></div>
        <div class="column">
          <article class="tile">
            ${iconSvg(iconPaths.geography)}
            <div class="tile-label">Geography</div>
          </article>
          <article class="tile">
            ${iconSvg(iconPaths.flags)}
            <div class="tile-label">Flags</div>
          </article>
          <article class="tile">
            ${iconSvg(iconPaths.cocktails)}
            <div class="tile-label">Cocktails</div>
          </article>
        </div>

        <div class="column column--offset">
          <article class="tile">
            ${iconSvg(iconPaths.music)}
            <div class="tile-label">Music</div>
          </article>
          <article class="tile">
            ${iconSvg(iconPaths.currency)}
            <div class="tile-label">Currency</div>
          </article>
          <article class="tile">
            ${iconSvg(iconPaths.languages)}
            <div class="tile-label">Languages</div>
          </article>
        </div>
      </section>
    </main>
  </body>
</html>
`
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true })
  const html = await buildHtml()

  const browser = await chromium.launch()
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  })

  await page.setContent(html, { waitUntil: 'load' })
  await page.screenshot({
    path: outputPath,
    type: 'png',
  })

  await browser.close()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
