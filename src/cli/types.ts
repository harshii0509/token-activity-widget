import type { ActivityWidgetData, ActivityWidgetPreset } from '../types.js'

export type WidgetSetupMode = 'import-json' | 'fetch-url'

export type SupportedFramework = 'next-app-router' | 'vite-react'

export type ActivitySourceName = 'claude' | 'codex' | 'opencode'

export interface SourceConfig {
  enabled: boolean
  path: string
}

export interface WidgetSetupConfig {
  version: 1
  framework: SupportedFramework
  mode: WidgetSetupMode
  preset: ActivityWidgetPreset
  publicId: string
  sources: Record<ActivitySourceName, SourceConfig>
  outputs: {
    jsonPath: string
    componentPath: string
    modulePath?: string
    fetchUrl?: string
    promptPath: string
  }
}

export interface UsageEvent {
  source: ActivitySourceName
  sessionId: string
  timestamp: string
  activityDate: string
  model: string
  inputTokens: number
  outputTokens: number
  cacheCreationInputTokens: number
  cacheReadInputTokens: number
}

export interface ParsedSourceResult {
  source: ActivitySourceName
  path: string
  events: UsageEvent[]
  skippedReason?: string
}

export interface SyncSummary {
  config: WidgetSetupConfig
  data: ActivityWidgetData
  sources: ParsedSourceResult[]
}
