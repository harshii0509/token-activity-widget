import { access } from 'node:fs/promises'
import { aggregateEvents } from '../aggregate.js'
import { loadConfig } from '../project.js'
import { writeSyncOutputs } from '../scaffold.js'
import { readClaudeHistory } from '../sources/claude.js'
import { readCodexHistory } from '../sources/codex.js'
import { readOpenCodeHistory } from '../sources/opencode.js'
import type { ParsedSourceResult, SyncSummary } from '../types.js'

async function exists(targetPath: string) {
  try {
    await access(targetPath)
    return true
  } catch {
    return false
  }
}

export async function runSyncCommand({
  cwd,
  flags,
}: {
  cwd: string
  packageRoot: string
  flags: Record<string, string | boolean>
}) {
  const { config } = await loadConfig(cwd)
  const results: ParsedSourceResult[] = []

  if (config.sources.claude.enabled) {
    if (await exists(config.sources.claude.path)) {
      results.push(await readClaudeHistory(config.sources.claude.path))
    } else {
      results.push({
        source: 'claude',
        path: config.sources.claude.path,
        events: [],
        skippedReason: 'Claude history path not found.',
      })
    }
  }

  if (config.sources.codex.enabled) {
    if (await exists(config.sources.codex.path)) {
      results.push(await readCodexHistory(config.sources.codex.path))
    } else {
      results.push({
        source: 'codex',
        path: config.sources.codex.path,
        events: [],
        skippedReason: 'Codex history database not found.',
      })
    }
  }

  if (config.sources.opencode.enabled) {
    if (await exists(config.sources.opencode.path)) {
      results.push(await readOpenCodeHistory(config.sources.opencode.path))
    } else {
      results.push({
        source: 'opencode',
        path: config.sources.opencode.path,
        events: [],
        skippedReason: 'OpenCode history database not found.',
      })
    }
  }

  const data = aggregateEvents(
    config,
    results.flatMap((result) => result.events),
  )

  const summary: SyncSummary = {
    config,
    data,
    sources: results,
  }

  if (!flags['dry-run']) {
    await writeSyncOutputs(cwd, summary)
  }

  console.log(JSON.stringify({
    mode: config.mode,
    output: config.outputs.jsonPath,
    activity_days: data.activity.length,
    source_counts: results.map((result) => ({
      source: result.source,
      path: result.path,
      events: result.events.length,
      skipped: result.skippedReason ?? null,
    })),
  }, null, 2))
}
