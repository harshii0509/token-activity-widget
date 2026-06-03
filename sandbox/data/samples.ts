import type { ActivityWidgetData, ActivityWidgetDay, ActivityWidgetPreset } from 'token-activity-widget'

export interface SampleDefinition {
  id: string
  label: string
  description: string
  data: ActivityWidgetData
}

function makeActivityDay(date: Date, weight: number): ActivityWidgetDay {
  const tokens = Math.max(0, Math.round(weight))
  return {
    date: date.toISOString().slice(0, 10),
    input_tokens: tokens * 90,
    output_tokens: tokens * 55,
    cache_creation_input_tokens: tokens > 4 ? tokens * 12 : 0,
    cache_read_input_tokens: tokens > 2 ? tokens * 16 : 0,
    messages: Math.max(0, Math.round(tokens / 2)),
    sessions: Math.max(0, Math.round(tokens / 4)),
  }
}

function buildActivity(seed: number, profile: 'busy' | 'steady' | 'quiet' | 'empty') {
  if (profile === 'empty') return []

  const days: ActivityWidgetDay[] = []
  const today = new Date()

  for (let offset = 364; offset >= 0; offset -= 1) {
    const date = new Date(today)
    date.setHours(12, 0, 0, 0)
    date.setDate(date.getDate() - offset)

    const rhythm = Math.sin((offset + seed) / 9) * 2.2 + Math.cos((offset + seed) / 17) * 1.4
    const weekdayBoost = [0.3, 1, 1.2, 1.1, 1.4, 0.9, 0.45][date.getDay()] ?? 1

    let weight = 0

    if (profile === 'busy') {
      weight = 7 + rhythm + weekdayBoost * 2.2 + ((offset + seed) % 23 === 0 ? 6 : 0)
    } else if (profile === 'steady') {
      weight = 4.8 + rhythm * 0.9 + weekdayBoost * 1.4
    } else {
      weight = 1.6 + rhythm * 0.7 + weekdayBoost * 0.8
    }

    if ((offset + seed) % 19 === 0 || (offset + seed) % 37 === 0) {
      weight = 0
    }

    const day = makeActivityDay(date, Math.max(0, weight))
    if (day.input_tokens + day.output_tokens + day.cache_creation_input_tokens + day.cache_read_input_tokens > 0) {
      days.push(day)
    }
  }

  return days
}

function buildSample(id: string, preset: ActivityWidgetPreset, profile: 'busy' | 'steady' | 'quiet' | 'empty'): ActivityWidgetData {
  return {
    publicId: id,
    preset,
    lastSyncedAt: new Date().toISOString(),
    activity: buildActivity(id.length * 13, profile),
  }
}

export const sampleDefinitions: SampleDefinition[] = [
  {
    id: 'demo-user',
    label: 'Busy creator',
    description: 'A dense year of activity with stronger bursts and weekends that cool off.',
    data: buildSample('demo-user', 'night', 'busy'),
  },
  {
    id: 'steady-builder',
    label: 'Steady builder',
    description: 'A consistent working rhythm that is useful for theme and width QA.',
    data: buildSample('steady-builder', 'paper', 'steady'),
  },
  {
    id: 'quiet-shipper',
    label: 'Quiet shipper',
    description: 'Sparse but non-zero activity to test lower-intensity heatmap behavior.',
    data: buildSample('quiet-shipper', 'arcade', 'quiet'),
  },
  {
    id: 'zero-activity',
    label: 'Zero activity',
    description: 'Tests the empty grid state without relying on profile chrome.',
    data: buildSample('zero-activity', 'paper', 'empty'),
  },
]

export function getSampleDefinition(id: string) {
  return sampleDefinitions.find((sample) => sample.id === id) ?? null
}
