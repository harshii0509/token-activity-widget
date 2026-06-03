#!/usr/bin/env node

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runInitCommand } from './commands/init.js'
import { runSyncCommand } from './commands/sync.js'

type FlagMap = Record<string, string | boolean>

function parseFlags(argv: string[]) {
  const [command = 'help', ...rest] = argv
  const flags: FlagMap = {}

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index]
    if (!token?.startsWith('--')) continue

    const [key, inlineValue] = token.slice(2).split('=', 2)
    if (inlineValue !== undefined) {
      flags[key] = inlineValue
      continue
    }

    const nextToken = rest[index + 1]
    if (nextToken && !nextToken.startsWith('--')) {
      flags[key] = nextToken
      index += 1
      continue
    }

    flags[key] = true
  }

  return { command, flags }
}

function printHelp() {
  console.log(`token-activity-widget

Commands:
  init   Detect a supported app, explain the two data modes, and scaffold setup files
  sync   Read local Claude/Codex/OpenCode history and write widget data output

Examples:
  npx token-activity-widget init
  npx token-activity-widget init --mode fetch-url
  npx token-activity-widget sync
`)
}

async function main() {
  const { command, flags } = parseFlags(process.argv.slice(2))
  const cwd = typeof flags.cwd === 'string' ? path.resolve(String(flags.cwd)) : process.cwd()
  const packageRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)))

  if (command === 'init') {
    await runInitCommand({ cwd, packageRoot, flags })
    return
  }

  if (command === 'sync') {
    await runSyncCommand({ cwd, packageRoot, flags })
    return
  }

  printHelp()
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
