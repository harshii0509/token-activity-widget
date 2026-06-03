import { ActivityWidget } from '../src/index'

export default function ExampleHostedWidget() {
  return (
    <ActivityWidget
      publicId="your-public-id"
      baseUrl="https://your-app.com"
      preset="paper"
      theme={{
        text: '#334155',
        muted: '#64748b',
        tooltipBackground: '#0f172a',
        tooltipText: '#f8fafc',
        activityScale: ['#e2e8f0', '#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9'],
      }}
    />
  )
}
