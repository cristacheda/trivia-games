import fs from 'node:fs'
import path from 'node:path'

const distDir = path.resolve('dist')
const headersPath = path.join(distDir, '_headers')
const indexPath = path.join(distDir, 'index.html')

function readFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing expected file: ${path.relative(process.cwd(), filePath)}`)
  }

  return fs.readFileSync(filePath, 'utf8')
}

function assertContains(content, expected, label) {
  if (!content.includes(expected)) {
    throw new Error(`Expected ${label} to contain: ${expected}`)
  }
}

const headersContent = readFile(headersPath)
const indexContent = readFile(indexPath)
const swPath = path.join(distDir, 'sw.js')

assertContains(
  headersContent,
  '/sw.js\n  Cache-Control: public, max-age=0, must-revalidate',
  'dist/_headers',
)
assertContains(
  headersContent,
  '/manifest.webmanifest\n  Cache-Control: public, max-age=0, must-revalidate',
  'dist/_headers',
)
assertContains(indexContent, '/manifest.webmanifest', 'dist/index.html')

const swContent = readFile(swPath)

assertContains(swContent, 'index.html', 'dist/sw.js')
assertContains(swContent, 'manifest.webmanifest', 'dist/sw.js')

console.log('Verified cache-sensitive artifacts for sw.js')
