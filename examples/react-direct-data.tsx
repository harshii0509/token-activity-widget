import { ActivityGrid, ActivityWidgetFromData, type ActivityWidgetData } from '../src/index'

const sampleData: ActivityWidgetData = {
  publicId: 'sample-user',
  preset: 'night',
  lastSyncedAt: '2026-06-04T10:00:00.000Z',
  activity: [
    {
      date: '2026-06-01',
      input_tokens: 1200,
      output_tokens: 800,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
      messages: 4,
      sessions: 2,
    },
  ],
}

export function ExampleDirectDataWidget() {
  return (
    <ActivityWidgetFromData
      data={sampleData}
      theme={{
        text: '#3b0764',
        muted: '#7e22ce',
        tooltipBackground: '#581c87',
        tooltipText: '#faf5ff',
        activityScale: ['#f3e8ff', '#d8b4fe', '#c084fc', '#a855f7', '#6b21a8'],
      }}
    />
  )
}

export function ExampleBareGrid() {
  return (
    <ActivityGrid
      activity={sampleData.activity}
      preset="night"
      showTooltip={false}
    />
  )
}
