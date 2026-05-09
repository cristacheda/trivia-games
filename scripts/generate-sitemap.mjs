import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const packageJsonPath = path.join(repoRoot, 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

const baseUrl = process.env.VITE_APP_BASE_URL || 'https://triviagames.cristache.net'
const normalizedBaseUrl = baseUrl.replace(/\/$/, '')
const generatedAt = new Date().toISOString()

const routes = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/games/flag-quiz', changefreq: 'weekly', priority: '0.9' },
  { path: '/games/guess-the-capital', changefreq: 'weekly', priority: '0.9' },
  { path: '/games/outline-quiz', changefreq: 'weekly', priority: '0.9' },
]

const urls = routes
  .map(
    (route) => `  <url>\n    <loc>${normalizedBaseUrl}${route.path}</loc>\n    <lastmod>${generatedAt}</lastmod>\n    <changefreq>${route.changefreq}</changefreq>\n    <priority>${route.priority}</priority>\n  </url>`,
  )
  .join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`

const outputPath = path.join(repoRoot, 'public', 'sitemap.xml')
fs.writeFileSync(outputPath, xml, 'utf8')

console.log(`Generated sitemap for ${packageJson.name} at ${outputPath}`)
