import type { ParsedSourceResult, UsageEvent } from '../types.js'
import { openSqliteDatabase } from '../sqlite.js'

const CODEX_FIELD_PATTERNS = {
  threadId: /(?:thread\.id|thread_id)=([0-9a-f-]{8,})/,
  turnId: /turn\.id=([0-9a-f-]{8,})/,
  model: /\bmodel=([A-Za-z0-9._:-]+)/,
  inputTokens: /codex\.turn\.token_usage\.input_tokens=(\d+)/,
  cachedInputTokens: /codex\.turn\.token_usage\.cached_input_tokens=(\d+)/,
  outputTokens: /codex\.turn\.token_usage\.output_tokens=(\d+)/,
  reasoningOutputTokens: /codex\.turn\.token_usage\.reasoning_output_tokens=(\d+)/,
  totalTokens: /codex\.turn\.token_usage\.total_tokens=(\d+)/,
} as const

function matchField(pattern: RegExp, text: string, fallback = '') {
  return pattern.exec(text)?.[1] ?? fallback
}

export async function readCodexHistory(sourcePath: string): Promise<ParsedSourceResult> {
  try {
    const db = await openSqliteDatabase(sourcePath)
    const statement = db.prepare(`
      select id, ts, ts_nanos, feedback_log_body
      from logs
      where target = 'opentelemetry_sdk'
        and feedback_log_body like '%codex.turn.token_usage.input_tokens=%'
      order by id asc
    `)

    const events: UsageEvent[] = []
    while (statement.step()) {
      const row = statement.getAsObject() as {
        ts: number
        ts_nanos: number
        feedback_log_body: string | null
      }
      const body = row.feedback_log_body ?? ''
      const turnId = matchField(CODEX_FIELD_PATTERNS.turnId, body)
      const threadId = matchField(CODEX_FIELD_PATTERNS.threadId, body)
      const model = matchField(CODEX_FIELD_PATTERNS.model, body, 'unknown')
      const totalTokens = Number(matchField(CODEX_FIELD_PATTERNS.totalTokens, body, '0'))
      if (!turnId || !threadId || totalTokens <= 0) continue

      const ts = Number(row.ts ?? 0)
      const tsNanos = Number(row.ts_nanos ?? 0)
      const timestamp = new Date((ts * 1_000) + Math.floor(tsNanos / 1_000_000))
      if (Number.isNaN(timestamp.valueOf())) continue

      events.push({
        source: 'codex',
        sessionId: threadId,
        timestamp: timestamp.toISOString(),
        activityDate: timestamp.toISOString().slice(0, 10),
        model,
        inputTokens: Number(matchField(CODEX_FIELD_PATTERNS.inputTokens, body, '0')),
        outputTokens:
          Number(matchField(CODEX_FIELD_PATTERNS.outputTokens, body, '0')) +
          Number(matchField(CODEX_FIELD_PATTERNS.reasoningOutputTokens, body, '0')),
        cacheCreationInputTokens: 0,
        cacheReadInputTokens: Number(matchField(CODEX_FIELD_PATTERNS.cachedInputTokens, body, '0')),
      })
    }

    statement.free()
    db.close()

    return {
      source: 'codex',
      path: sourcePath,
      events,
    }
  } catch (error) {
    return {
      source: 'codex',
      path: sourcePath,
      events: [],
      skippedReason: error instanceof Error ? error.message : 'Could not read Codex history.',
    }
  }
}
