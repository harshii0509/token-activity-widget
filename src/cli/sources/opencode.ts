import { execFile } from 'node:child_process'
import { access } from 'node:fs/promises'
import { promisify } from 'node:util'
import type { ParsedSourceResult, UsageEvent } from '../types.js'
import { openSqliteDatabase } from '../sqlite.js'

const execFileAsync = promisify(execFile)

function parseModel(rawValue: unknown) {
  if (typeof rawValue !== 'string' || !rawValue.trim()) {
    return 'unknown'
  }

  try {
    const parsed = JSON.parse(rawValue) as { id?: string; providerID?: string }
    const modelId = parsed.id?.trim() ?? ''
    const providerId = parsed.providerID?.trim() ?? ''
    if (!modelId) return providerId || 'unknown'
    return providerId && !modelId.includes('/') ? `${providerId}/${modelId}` : modelId
  } catch {
    return rawValue.trim()
  }
}

export async function discoverOpenCodeDbPath(defaultPath: string) {
  try {
    const { stdout } = await execFileAsync('opencode', ['db', 'path'], { timeout: 5000 })
    const candidate = stdout.trim()
    if (candidate) {
      await access(candidate)
      return candidate
    }
  } catch {
    // Fall back to default.
  }

  return defaultPath
}

export async function readOpenCodeHistory(sourcePath: string): Promise<ParsedSourceResult> {
  try {
    const db = await openSqliteDatabase(sourcePath)
    const statement = db.prepare(`
      select
        id,
        model,
        time_created,
        time_updated,
        tokens_input,
        tokens_output,
        tokens_reasoning,
        tokens_cache_read,
        tokens_cache_write
      from session
      order by coalesce(time_updated, time_created, 0) asc, id asc
    `)

    const events: UsageEvent[] = []
    while (statement.step()) {
      const row = statement.getAsObject() as {
        id: string
        model: string | null
        time_created: number
        time_updated: number
        tokens_input: number
        tokens_output: number
        tokens_reasoning: number
        tokens_cache_read: number
        tokens_cache_write: number
      }

      const eventTimeMs = Number(row.time_updated || row.time_created || 0)
      if (!row.id || eventTimeMs <= 0) continue

      const timestamp = new Date(eventTimeMs)
      if (Number.isNaN(timestamp.valueOf())) continue

      const inputTokens = Number(row.tokens_input || 0)
      const outputTokens = Number(row.tokens_output || 0) + Number(row.tokens_reasoning || 0)
      const cacheCreationInputTokens = Number(row.tokens_cache_write || 0)
      const cacheReadInputTokens = Number(row.tokens_cache_read || 0)
      const totalTokens = inputTokens + outputTokens + cacheCreationInputTokens + cacheReadInputTokens
      if (totalTokens <= 0) continue

      events.push({
        source: 'opencode',
        sessionId: row.id,
        timestamp: timestamp.toISOString(),
        activityDate: timestamp.toISOString().slice(0, 10),
        model: parseModel(row.model),
        inputTokens,
        outputTokens,
        cacheCreationInputTokens,
        cacheReadInputTokens,
      })
    }

    statement.free()
    db.close()

    return {
      source: 'opencode',
      path: sourcePath,
      events,
    }
  } catch (error) {
    return {
      source: 'opencode',
      path: sourcePath,
      events: [],
      skippedReason: error instanceof Error ? error.message : 'Could not read OpenCode history.',
    }
  }
}
