import { spawnSync } from 'node:child_process'

const mode = process.argv[2]
const explicitFiles = process.argv.slice(3)
const isDryRun = process.env.ATLAS_TEST_DRY_RUN === '1'

const PLAYWRIGHT_SMOKE_SPEC = 'tests/smoke.spec.ts'
const PLAYWRIGHT_FULL_SPECS = [
  PLAYWRIGHT_SMOKE_SPEC,
  'tests/flag-quiz.spec.ts',
  'tests/guess-the-capital.spec.ts',
  'tests/outline-quiz.spec.ts',
  'tests/shared-gameplay.spec.ts',
]
const PLAYWRIGHT_STORAGE_SPECS = [
  'tests/flag-quiz.spec.ts',
  'tests/guess-the-capital.spec.ts',
  'tests/outline-quiz.spec.ts',
  'tests/shared-gameplay.spec.ts',
]
const OFFLINE_SENSITIVE_PATTERNS = [
  /^vite\.config\.ts$/,
  /^playwright(\.offline)?\.config\.ts$/,
  /^public\/_headers$/,
  /^public\/manifest.*$/,
  /^docs\/deployment\.md$/,
  /^scripts\/generate-sitemap\.mjs$/,
  /^scripts\/verify-cache-artifacts\.mjs$/,
  /^\.github\/workflows\/deploy-cloudflare-pages\.yml$/,
  /^wrangler\.jsonc$/,
  /^vercel\.json$/,
]
const IGNORED_PATTERNS = [
  /^docs\/(?!deployment\.md$).+/,
  /^\.github\/pull_request_template\.md$/,
]

function printUsageAndExit() {
  console.error('Usage: node scripts/run-changed-tests.mjs <unit|all> [file ...]')
  process.exit(1)
}

if (!['unit', 'all'].includes(mode)) {
  printUsageAndExit()
}

function normalizePath(file) {
  return file.replaceAll('\\', '/')
}

function isIgnoredFile(file) {
  return IGNORED_PATTERNS.some((pattern) => pattern.test(file))
}

function runCommand(command, args) {
  console.log(`> ${[command, ...args].join(' ')}`)

  if (isDryRun) {
    return
  }

  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function getGitOutput(args) {
  const result = spawnSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
  })

  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args.join(' ')} failed`)
  }

  return result.stdout.trim()
}

function parseChangedFilesFromEnv() {
  const raw = process.env.ATLAS_CHANGED_FILES?.trim()

  if (!raw) {
    return null
  }

  return raw
    .split(/\r?\n|,/)
    .map((file) => normalizePath(file.trim()))
    .filter(Boolean)
}

function getCiRange() {
  const baseRef = process.env.GITHUB_BASE_REF

  if (baseRef) {
    const mergeBase = getGitOutput(['merge-base', `origin/${baseRef}`, 'HEAD'])
    return `${mergeBase}...HEAD`
  }

  const before = process.env.GITHUB_EVENT_BEFORE
  const sha = process.env.GITHUB_SHA

  if (before && sha && before !== '0000000000000000000000000000000000000000') {
    return `${before}...${sha}`
  }

  return null
}

function getChangedFiles() {
  const envFiles = parseChangedFilesFromEnv()

  if (envFiles) {
    return {
      files: envFiles,
      source: 'ATLAS_CHANGED_FILES',
      emptySafeFallback: false,
    }
  }

  try {
    const range = process.env.CI ? getCiRange() : null
    const diffArgs = range
      ? ['diff', '--name-only', '--diff-filter=ACMR', range]
      : ['diff', '--name-only', '--diff-filter=ACMR', 'HEAD']
    const tracked = getGitOutput(diffArgs)
      .split('\n')
      .map((file) => normalizePath(file.trim()))
      .filter(Boolean)
    const untracked = process.env.CI
      ? []
      : getGitOutput(['ls-files', '--others', '--exclude-standard'])
          .split('\n')
          .map((file) => normalizePath(file.trim()))
          .filter(Boolean)

    return {
      files: [...new Set([...tracked, ...untracked])],
      source: range ?? 'HEAD + untracked',
      emptySafeFallback: true,
    }
  } catch (error) {
    console.warn(`Unable to resolve changed files from git: ${error.message}`)
    return {
      files: [],
      source: 'git unavailable',
      emptySafeFallback: true,
    }
  }
}

function runVitestRelated(files) {
  runCommand('npx', ['vitest', 'related', ...files])
}

function runVitestChanged() {
  const since = process.env.CI ? getCiRange()?.split('...')[0] : null
  const args = ['vitest', '--changed']

  if (since) {
    args.push(since)
  }

  runCommand('npx', args)
}

function addSpecs(target, specs) {
  for (const spec of specs) {
    target.add(spec)
  }
}

function classifyChangedFiles(files) {
  const state = {
    fullUnit: false,
    runOffline: false,
    unitRelatedFiles: new Set(),
    e2eSpecs: new Set(),
  }

  for (const rawFile of files) {
    const file = normalizePath(rawFile)

    if (isIgnoredFile(file)) {
      continue
    }

    if (OFFLINE_SENSITIVE_PATTERNS.some((pattern) => pattern.test(file))) {
      state.runOffline = true
      state.fullUnit = true
      addSpecs(state.e2eSpecs, PLAYWRIGHT_FULL_SPECS)
      continue
    }

    if (file.startsWith('src/features/flag-quiz/')) {
      state.unitRelatedFiles.add(file)
      addSpecs(state.e2eSpecs, [
        PLAYWRIGHT_SMOKE_SPEC,
        'tests/flag-quiz.spec.ts',
        'tests/shared-gameplay.spec.ts',
      ])
      continue
    }

    if (file.startsWith('src/features/guess-the-capital/')) {
      state.unitRelatedFiles.add(file)
      addSpecs(state.e2eSpecs, [
        PLAYWRIGHT_SMOKE_SPEC,
        'tests/guess-the-capital.spec.ts',
        'tests/shared-gameplay.spec.ts',
      ])
      continue
    }

    if (file.startsWith('src/features/outline-quiz/')) {
      state.unitRelatedFiles.add(file)
      addSpecs(state.e2eSpecs, [
        PLAYWRIGHT_SMOKE_SPEC,
        'tests/outline-quiz.spec.ts',
        'tests/shared-gameplay.spec.ts',
      ])
      continue
    }

    if (
      file === 'src/lib/storage.ts' ||
      file === 'src/lib/__tests__/storage.test.ts'
    ) {
      state.unitRelatedFiles.add(file)
      addSpecs(state.e2eSpecs, PLAYWRIGHT_STORAGE_SPECS)
      continue
    }

    if (
      file === 'src/lib/gameplay.ts' ||
      file === 'src/lib/__tests__/gameplay.test.ts'
    ) {
      state.unitRelatedFiles.add(file)
      addSpecs(state.e2eSpecs, ['tests/shared-gameplay.spec.ts'])
      continue
    }

    if (
      file.startsWith('src/components/layout/') ||
      file === 'src/pages/home-page.tsx' ||
      file === 'src/config/site.ts' ||
      file === 'src/components/game-card.tsx'
    ) {
      state.unitRelatedFiles.add(file)
      addSpecs(state.e2eSpecs, [PLAYWRIGHT_SMOKE_SPEC])
      continue
    }

    if (
      file === 'src/App.tsx' ||
      file === 'src/main.tsx' ||
      file.startsWith('src/app/') ||
      file.startsWith('src/components/ui/')
    ) {
      state.fullUnit = true
      addSpecs(state.e2eSpecs, [PLAYWRIGHT_SMOKE_SPEC])
      continue
    }

    if (file === 'tests/helpers.ts') {
      addSpecs(state.e2eSpecs, PLAYWRIGHT_FULL_SPECS)
      continue
    }

    if (PLAYWRIGHT_FULL_SPECS.includes(file)) {
      addSpecs(state.e2eSpecs, [file])
      continue
    }

    if (file === 'tests/offline.spec.ts') {
      state.runOffline = true
      continue
    }

    if (
      file.endsWith('.ts') ||
      file.endsWith('.tsx') ||
      file.endsWith('.js') ||
      file.endsWith('.mjs')
    ) {
      state.fullUnit = true
      addSpecs(state.e2eSpecs, [PLAYWRIGHT_SMOKE_SPEC])
      continue
    }
  }

  return state
}

function runUnitMode() {
  if (explicitFiles.length > 0) {
    console.log(`Changed-unit mode using explicit files: ${explicitFiles.join(', ')}`)
    runVitestRelated(explicitFiles.map(normalizePath))
    return
  }

  console.log('Changed-unit mode using Vitest changed-file detection')
  runVitestChanged()
}

function runAllMode() {
  const { files, source, emptySafeFallback } = getChangedFiles()
  const normalizedFiles = [...new Set(files.map(normalizePath))]

  console.log(`Changed files source: ${source}`)
  if (normalizedFiles.length > 0) {
    console.log('Changed files:')
    for (const file of normalizedFiles) {
      console.log(`- ${file}`)
    }
  } else {
    console.log('No changed files detected.')
  }

  if (normalizedFiles.length === 0 && emptySafeFallback) {
    console.log('Falling back to full unit tests and smoke E2E.')
    runCommand('npm', ['run', 'test:unit'])
    runCommand('npm', ['run', 'test:e2e:smoke'])
    return
  }

  const selection = classifyChangedFiles(normalizedFiles)
  const unitRelatedFiles = [...selection.unitRelatedFiles]
  const e2eSpecs = [...selection.e2eSpecs]

  const selectedCommands = []

  if (selection.fullUnit) {
    selectedCommands.push('npm run test:unit')
  } else if (unitRelatedFiles.length > 0) {
    selectedCommands.push(`npx vitest related ${unitRelatedFiles.join(' ')}`)
  }

  if (e2eSpecs.length > 0) {
    selectedCommands.push(`npx playwright test ${e2eSpecs.join(' ')}`)
  }

  if (selection.runOffline) {
    selectedCommands.push('npm run test:e2e:offline')
  }

  if (selectedCommands.length === 0) {
    console.log('No relevant tests selected for the changed files.')
    return
  }

  console.log('Selected test commands:')
  for (const command of selectedCommands) {
    console.log(`- ${command}`)
  }

  if (selection.fullUnit) {
    runCommand('npm', ['run', 'test:unit'])
  } else if (unitRelatedFiles.length > 0) {
    runVitestRelated(unitRelatedFiles)
  }

  if (e2eSpecs.length > 0) {
    runCommand('npx', ['playwright', 'test', ...e2eSpecs])
  }

  if (selection.runOffline) {
    runCommand('npm', ['run', 'test:e2e:offline'])
  }
}

if (mode === 'unit') {
  runUnitMode()
} else {
  runAllMode()
}
