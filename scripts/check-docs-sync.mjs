import { execFileSync } from 'node:child_process'

const DOC_FILES = new Set([
  'README.md',
  'AGENTS.md',
  'CONTRIBUTING.md',
  '.github/pull_request_template.md',
])

const DOC_PREFIXES = ['docs/']
const APP_PREFIXES = [
  'src/',
  'public/',
  '.github/workflows/',
]
const APP_EXACT_FILES = new Set([
  'package.json',
  'package-lock.json',
  'vite.config.ts',
  'playwright.config.ts',
  'vercel.json',
  'components.json',
  'index.html',
  '.env.example',
])
const NON_PRODUCT_PREFIXES = ['tests/', 'scripts/']
const NON_PRODUCT_EXACT_FILES = new Set([
  '.gitignore',
  '.gitattributes',
])

function runGitDiff(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8' })
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  } catch (error) {
    console.error('Failed to inspect git diff for docs sync check.')
    throw error
  }
}

function hasRevision(revision) {
  try {
    execFileSync('git', ['rev-parse', '--verify', revision], {
      encoding: 'utf8',
      stdio: 'ignore',
    })
    return true
  } catch {
    return false
  }
}

function parseChangedFiles() {
  const againstIndex = process.argv.indexOf('--against')

  if (process.argv.includes('--staged')) {
    return runGitDiff(['diff', '--name-only', '--cached', '--diff-filter=ACMR'])
  }

  if (againstIndex !== -1) {
    const range = process.argv[againstIndex + 1]
    if (!range) {
      throw new Error('Missing git diff range after --against')
    }

    return runGitDiff(['diff', '--name-only', '--diff-filter=ACMR', range])
  }

  if (!hasRevision('HEAD~1')) {
    return runGitDiff(['ls-files'])
  }

  return runGitDiff(['diff', '--name-only', '--diff-filter=ACMR', 'HEAD~1...HEAD'])
}

function matchesPrefix(filePath, prefixes) {
  return prefixes.some((prefix) => filePath.startsWith(prefix))
}

function isDocFile(filePath) {
  return DOC_FILES.has(filePath) || matchesPrefix(filePath, DOC_PREFIXES)
}

function isNonProductChange(filePath) {
  return (
    NON_PRODUCT_EXACT_FILES.has(filePath) ||
    matchesPrefix(filePath, NON_PRODUCT_PREFIXES)
  )
}

function isAppChange(filePath) {
  return (
    APP_EXACT_FILES.has(filePath) ||
    matchesPrefix(filePath, APP_PREFIXES)
  )
}

const changedFiles = parseChangedFiles()
const docChanges = changedFiles.filter(isDocFile)
const appChanges = changedFiles.filter(
  (filePath) => isAppChange(filePath) && !isNonProductChange(filePath),
)

if (appChanges.length === 0) {
  console.log('Docs sync check skipped: no product-impacting files changed.')
  process.exit(0)
}

if (docChanges.length > 0) {
  console.log('Docs sync check passed.')
  process.exit(0)
}

console.error('Docs sync check failed.')
console.error('')
console.error(
  'Product-impacting files changed, but no documentation files were updated.',
)
console.error('')
console.error('Changed app files:')
for (const filePath of appChanges) {
  console.error(`- ${filePath}`)
}
console.error('')
console.error('Update at least one relevant documentation file, such as:')
console.error('- README.md')
console.error('- AGENTS.md')
console.error('- CONTRIBUTING.md')
console.error('- docs/product-overview.md')
console.error('- docs/architecture.md')
console.error('- docs/deployment.md')
console.error('- docs/github-cloudflare-setup.md')
console.error('- .github/pull_request_template.md')
process.exit(1)
