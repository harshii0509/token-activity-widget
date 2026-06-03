import { ActivityWidget } from '../src/index'

export default function ExampleFetchedWidget() {
  return (
    <ActivityWidget
      url="https://your-app.com/token-activity-widget.json"
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
