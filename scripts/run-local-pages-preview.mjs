import { spawn } from 'node:child_process'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const host = process.env.LOCAL_PAGES_HOST ?? '0.0.0.0'
const requestedPort = process.env.LOCAL_PAGES_PORT ?? '4173'
const wranglerVersion = process.env.LOCAL_WRANGLER_VERSION ?? '4.90.1'

const tempRoot = path.join(os.tmpdir(), 'trivia-games-pages-preview')
const wranglerHome = path.join(tempRoot, 'home')
const npmCache = path.join(tempRoot, 'npm-cache')

function prepareTempState() {
  fs.rmSync(tempRoot, { force: true, recursive: true })
  fs.mkdirSync(path.join(wranglerHome, '.wrangler'), { recursive: true })
  fs.mkdirSync(npmCache, { recursive: true })
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function findListeningPids(portNumber) {
  let stdout = ''

  try {
    stdout = execFileSync('lsof', [`-tiTCP:${portNumber}`, '-sTCP:LISTEN'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
  } catch {
    return []
  }

  return stdout
    .split('\n')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
}

async function releasePort(portNumber) {
  const initialPids = findListeningPids(portNumber)

  for (const pid of initialPids) {
    try {
      process.kill(pid, 'SIGTERM')
    } catch {
      // Ignore stale or already-exited processes.
    }
  }

  if (initialPids.length === 0) {
    return
  }

  await sleep(500)

  for (const pid of findListeningPids(portNumber)) {
    try {
      process.kill(pid, 'SIGKILL')
    } catch {
      // Ignore stale or already-exited processes.
    }
  }
}

async function resolvePreviewPort() {
  const preferredPort = Number(requestedPort)

  if (!Number.isFinite(preferredPort)) {
    throw new Error(`Invalid LOCAL_PAGES_PORT: ${requestedPort}`)
  }

  await releasePort(preferredPort)

  if (findListeningPids(preferredPort).length === 0) {
    return String(preferredPort)
  }

  const fallbackPorts = [4280, 4281, 4282, 4283, 4284]

  for (const fallbackPort of fallbackPorts) {
    if (fallbackPort === preferredPort) {
      continue
    }

    if (findListeningPids(fallbackPort).length === 0) {
      return String(fallbackPort)
    }
  }

  throw new Error(`No free preview port found. Tried ${[preferredPort, ...fallbackPorts].join(', ')}`)
}

function runCommand(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env,
      stdio: 'inherit',
    })

    child.on('error', reject)
    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`${command} exited with signal ${signal}`))
        return
      }

      if (code !== 0) {
        reject(new Error(`${command} exited with code ${code}`))
        return
      }

      resolve()
    })
  })
}

function runPersistentCommand(command, args, env) {
  const child = spawn(command, args, {
    env,
    stdio: 'inherit',
  })

  const forwardSignal = (signal) => {
    if (!child.killed) {
      child.kill(signal)
    }
  }

  process.on('SIGINT', forwardSignal)
  process.on('SIGTERM', forwardSignal)

  child.on('exit', (code, signal) => {
    process.off('SIGINT', forwardSignal)
    process.off('SIGTERM', forwardSignal)

    if (signal) {
      process.kill(process.pid, signal)
      return
    }

    process.exit(code ?? 0)
  })
}

async function main() {
  prepareTempState()
  const port = await resolvePreviewPort()

  const env = {
    ...process.env,
    HOME: wranglerHome,
    XDG_CONFIG_HOME: wranglerHome,
    npm_config_cache: npmCache,
    npm_config_yes: 'true',
    VITE_LOCAL_PREVIEW_FRESH: '1',
  }

  console.log(`Starting fresh local Pages preview at http://127.0.0.1:${port}`)

  await runCommand('npm', ['run', 'build:pages:fresh'], env)

  runPersistentCommand(
    'npx',
    [`wrangler@${wranglerVersion}`, 'pages', 'dev', 'dist', '--ip', host, '--port', port],
    env,
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
