import type { ActivityWidgetData, ActivityWidgetDay } from '../types.js'
import type { UsageEvent, WidgetSetupConfig } from './types.js'

export function aggregateEvents(config: WidgetSetupConfig, events: UsageEvent[]): ActivityWidgetData {
  const byDate = new Map<string, ActivityWidgetDay & { sessionIds: Set<string> }>()

  for (const event of events) {
    const current = byDate.get(event.activityDate) ?? {
      date: event.activityDate,
      input_tokens: 0,
      output_tokens: 0,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
      messages: 0,
      sessions: 0,
      sessionIds: new Set<string>(),
    }

    current.input_tokens += event.inputTokens
    current.output_tokens += event.outputTokens
    current.cache_creation_input_tokens += event.cacheCreationInputTokens
    current.cache_read_input_tokens += event.cacheReadInputTokens
    current.messages += 1
    current.sessionIds.add(event.sessionId)
    current.sessions = current.sessionIds.size
    byDate.set(event.activityDate, current)
  }

  const activity = Array.from(byDate.values())
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-365)
    .map(({ sessionIds: _sessionIds, ...day }) => day)

  return {
    publicId: config.publicId,
    preset: config.preset,
    lastSyncedAt: new Date().toISOString(),
    activity,
  }
}
