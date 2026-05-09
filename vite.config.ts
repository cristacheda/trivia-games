import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

const packageJson = JSON.parse(
  fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string }
const appVersion = packageJson.version
const appCommitSha =
  process.env.CF_PAGES_COMMIT_SHA ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  'local'
const appBuildId = `${appVersion}-${appCommitSha.slice(0, 7)}`
const serviceWorkerFilename = 'sw.js'

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __APP_COMMIT_SHA__: JSON.stringify(appCommitSha),
    __APP_BUILD_ID__: JSON.stringify(appBuildId),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      filename: serviceWorkerFilename,
      registerType: 'autoUpdate',
      includeAssets: ['atlas.png', 'atlas-192.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Atlas of Answers',
        short_name: 'Atlas',
        description: 'A collection of polished trivia training games.',
        theme_color: '#efe4d2',
        background_color: '#f6f1ea',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'atlas-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'atlas.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        cacheId: `atlas-of-answers-${appVersion}`,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: 'index.html',
        skipWaiting: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
    css: true,
    include: [
      'src/**/__tests__/**/*.{test,spec}.{ts,tsx}',
      'src/**/*.{test,spec}.{ts,tsx}',
      'functions/**/*.{test,spec}.{ts,tsx}',
      'scripts/**/*.{test,spec}.{js,mjs}',
    ],
    exclude: ['tests/**'],
  },
})
