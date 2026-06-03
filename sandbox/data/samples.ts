import type { ActivityWidgetData, ActivityWidgetDay, ActivityWidgetPreset } from 'token-activity-widget'

export interface SampleDefinition {
  id: string
  label: string
  description: string
  data: ActivityWidgetData
}

function svgAvatar(letter: string, start: string, end: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none">
      <defs>
        <linearGradient id="g" x1="12" x2="84" y1="12" y2="84" gradientUnits="userSpaceOnUse">
          <stop stop-color="${start}" />
          <stop offset="1" stop-color="${end}" />
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="30" fill="url(#g)" />
      <text x="48" y="58" text-anchor="middle" font-size="42" font-weight="800" fill="white" font-family="Arial, sans-serif">${letter}</text>
    </svg>
  `.trim()

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
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

function currentStreak(activity: ActivityWidgetDay[]) {
  const active = new Set(activity.map((day) => day.date))
  const cursor = new Date()
  cursor.setHours(12, 0, 0, 0)

  let streak = 0
  while (active.has(cursor.toISOString().slice(0, 10))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function totalActiveDays(activity: ActivityWidgetDay[]) {
  return activity.filter((day) => day.messages > 0 || day.sessions > 0).length
}

function buildSample(id: string, displayName: string, preset: ActivityWidgetPreset, profile: 'busy' | 'steady' | 'quiet' | 'empty', image: string | null): ActivityWidgetData {
  const activity = buildActivity(id.length * 13, profile)
  return {
    publicId: id,
    displayName,
    image,
    preset,
    currentStreak: currentStreak(activity),
    totalActiveDays: totalActiveDays(activity),
    lastSyncedAt: new Date().toISOString(),
    activity,
  }
}

export const sampleDefinitions: SampleDefinition[] = [
  {
    id: 'demo-user',
    label: 'Busy creator',
    description: 'A dense year of activity with stronger bursts and weekends that cool off.',
    data: buildSample('demo-user', 'Harshi Rao', 'night', 'busy', svgAvatar('H', '#2563eb', '#0f172a')),
  },
  {
    id: 'steady-builder',
    label: 'Steady builder',
    description: 'A consistent working rhythm that is useful for theme and layout QA.',
    data: buildSample('steady-builder', 'Avery Chen', 'paper', 'steady', svgAvatar('A', '#f59e0b', '#7c2d12')),
  },
  {
    id: 'quiet-shipper',
    label: 'Quiet shipper',
    description: 'Sparse but non-zero activity to test lower-intensity heatmap behavior.',
    data: buildSample('quiet-shipper', 'Mina Torres', 'arcade', 'quiet', null),
  },
  {
    id: 'long-name-user',
    label: 'Long display name',
    description: 'Useful for truncation and tooltip checks when names are unusually long.',
    data: buildSample(
      'long-name-user',
      'Extremely Long Display Name For Testing Widget Layout And Truncation',
      'night',
      'steady',
      svgAvatar('L', '#7c3aed', '#1e1b4b'),
    ),
  },
  {
    id: 'zero-activity',
    label: 'Zero activity',
    description: 'Tests empty-state behavior while keeping the surrounding widget chrome visible.',
    data: buildSample('zero-activity', 'No Activity Yet', 'paper', 'empty', null),
  },
]

export function getSampleDefinition(id: string) {
  return sampleDefinitions.find((sample) => sample.id === id) ?? null
}
