import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import type { ParsedSourceResult, UsageEvent } from '../types.js'

async function collectJsonlFiles(rootDir: string, found: string[] = []) {
  const entries = await readdir(rootDir, { withFileTypes: true })
  for (const entry of entries) {
    const target = path.join(rootDir, entry.name)
    if (entry.isDirectory()) {
      await collectJsonlFiles(target, found)
      continue
    }

    if (entry.isFile() && target.endsWith('.jsonl')) {
      found.push(target)
    }
  }

  return found
}

function normalizeTimestamp(rawTimestamp: unknown) {
  if (typeof rawTimestamp !== 'string' || !rawTimestamp.trim()) {
    return null
  }

  const parsed = new Date(rawTimestamp)
  if (Number.isNaN(parsed.valueOf())) {
    return null
  }

  return parsed
}

export async function readClaudeHistory(sourcePath: string): Promise<ParsedSourceResult> {
  try {
    const files = await collectJsonlFiles(sourcePath)
    const events: UsageEvent[] = []

    for (const filePath of files) {
      const contents = await readFile(filePath, 'utf8')
      for (const line of contents.split(/\r?\n/)) {
        const trimmed = line.trim()
        if (!trimmed) continue

        let parsed: Record<string, unknown>
        try {
          parsed = JSON.parse(trimmed) as Record<string, unknown>
        } catch {
          continue
        }

        if (parsed.type !== 'assistant') continue
        const message = (parsed.message ?? {}) as Record<string, unknown>
        const usage = (message.usage ?? {}) as Record<string, unknown>
        const timestamp = normalizeTimestamp(parsed.timestamp)
        const model = typeof message.model === 'string' ? message.model : 'unknown'
        const sessionId = typeof parsed.sessionId === 'string' ? parsed.sessionId : path.basename(filePath, '.jsonl')

        if (!timestamp || typeof message.stop_reason !== 'string') continue

        const inputTokens = Number(usage.input_tokens ?? 0)
        const outputTokens = Number(usage.output_tokens ?? 0)
        const cacheCreationInputTokens = Number(usage.cache_creation_input_tokens ?? 0)
        const cacheReadInputTokens = Number(usage.cache_read_input_tokens ?? 0)
        const totalTokens = inputTokens + outputTokens + cacheCreationInputTokens + cacheReadInputTokens
        if (!Number.isFinite(totalTokens) || totalTokens <= 0) continue

        events.push({
          source: 'claude',
          sessionId,
          timestamp: timestamp.toISOString(),
          activityDate: timestamp.toISOString().slice(0, 10),
          model,
          inputTokens,
          outputTokens,
          cacheCreationInputTokens,
          cacheReadInputTokens,
        })
      }
    }

    return {
      source: 'claude',
      path: sourcePath,
      events,
    }
  } catch (error) {
    return {
      source: 'claude',
      path: sourcePath,
      events: [],
      skippedReason: error instanceof Error ? error.message : 'Could not read Claude history.',
    }
  }
}
