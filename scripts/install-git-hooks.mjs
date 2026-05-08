import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

if (!fs.existsSync('.git')) {
  console.log('Skipping hook install: not running inside a git worktree.')
  process.exit(0)
}

execFileSync('git', ['config', 'core.hooksPath', '.githooks'], {
  stdio: 'ignore',
})

console.log('Configured git hooks path to .githooks')
