import { spawn } from 'node:child_process'

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

const env = {
  ...process.env,
  VITE_LOCAL_PREVIEW_FRESH: '1',
}

await runCommand('npm', ['run', 'build:sitemap'], env)
await runCommand('tsc', ['-b'], env)
await runCommand('vite', ['build'], env)
