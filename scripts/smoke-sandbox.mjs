import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const rootCwd = process.cwd()
const port = 4277
const origin = `http://127.0.0.1:${port}`
const child = spawn(
  'npm',
  ['--prefix', './sandbox', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
  {
    cwd: rootCwd,
    stdio: ['ignore', 'pipe', 'pipe'],
  },
)

let stdout = ''
let stderr = ''

child.stdout.on('data', (chunk) => {
  stdout += chunk.toString()
})

child.stderr.on('data', (chunk) => {
  stderr += chunk.toString()
})

function cleanup() {
  if (!child.killed) {
    child.kill('SIGTERM')
  }
}

process.on('exit', cleanup)
process.on('SIGINT', () => {
  cleanup()
  process.exit(130)
})

async function waitForServer() {
  const deadline = Date.now() + 15000

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Sandbox server exited early.\n${stdout}\n${stderr}`)
    }

    try {
      const response = await fetch(origin)
      if (response.ok) return
    } catch {}

    await delay(250)
  }

  throw new Error(`Sandbox server did not become ready in time.\n${stdout}\n${stderr}`)
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

try {
  await waitForServer()

  const pageResponse = await fetch(origin)
  const pageHtml = await pageResponse.text()

  assert(pageResponse.ok, `Expected sandbox page to load, got ${pageResponse.status}`)
  assert(pageHtml.includes('Token Activity Grid Sandbox'), 'Sandbox HTML did not include the expected title')

  const okResponse = await fetch(`${origin}/api/public-widget/demo-user`)
  const okJson = await okResponse.json()

  assert(okResponse.ok, `Expected demo-user API response to succeed, got ${okResponse.status}`)
  assert(okJson.publicId === 'demo-user', 'Hosted mock API returned the wrong public id')
  assert(Array.isArray(okJson.activity), 'Hosted mock API did not return an activity array')

  const missingResponse = await fetch(`${origin}/api/public-widget/unknown-user`)
  const missingJson = await missingResponse.json()

  assert(missingResponse.status === 404, `Expected unknown-user API response to 404, got ${missingResponse.status}`)
  assert(typeof missingJson.error === 'string' && missingJson.error.includes('Unknown public id'), 'Hosted mock API 404 body was not descriptive')

  console.log('Sandbox smoke passed.')
} finally {
  cleanup()
  await delay(200)
}
