'use client'

import { ActivityGrid } from './ActivityGrid.js'
import type { ActivityWidgetData, ActivityWidgetPreset, ActivityWidgetTheme } from '../types.js'

export interface ActivityWidgetFromDataProps {
  data: ActivityWidgetData
  preset?: ActivityWidgetPreset
  theme?: Partial<ActivityWidgetTheme>
  className?: string
  showLabels?: boolean
  showTooltip?: boolean
}

export function ActivityWidgetFromData({
  data,
  preset,
  theme,
  className,
  showLabels,
  showTooltip,
}: ActivityWidgetFromDataProps) {
  return (
    <ActivityGrid
      className={className}
      activity={data.activity}
      preset={preset ?? data.preset}
      theme={theme}
      showLabels={showLabels}
      showTooltip={showTooltip}
    />
  )
}
