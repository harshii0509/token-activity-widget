import { ActivityWidgetFromData } from '../src/index'
import activityData from './app/data/token-activity-widget.generated'

export default function ExampleGeneratedDataWidget() {
  return (
    <ActivityWidgetFromData
      data={activityData}
      preset="night"
      showTooltip={false}
    />
  )
}
