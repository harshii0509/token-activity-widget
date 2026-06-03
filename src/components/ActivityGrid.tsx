'use client'

import { useMemo, useState } from 'react'
import { totalTokensForDay } from '../data/widgetData.js'
import { mergeWidgetTheme } from '../theme/mergeTheme.js'
import { HeatmapGrid } from './HeatmapGrid.js'
import { Tooltip } from './Tooltip.js'
import type { ActivityWidgetDay, ActivityWidgetPreset, ActivityWidgetTheme } from '../types.js'

export interface ActivityGridProps {
  activity: ActivityWidgetDay[]
  preset?: ActivityWidgetPreset
  theme?: Partial<ActivityWidgetTheme>
  className?: string
  showLabels?: boolean
  showTooltip?: boolean
}

export function ActivityGrid({
  activity,
  preset = 'night',
  theme,
  className,
  showLabels = true,
  showTooltip = true,
}: ActivityGridProps) {
  const resolvedTheme = mergeWidgetTheme(preset, theme)
  const [tooltip, setTooltip] = useState<{ day: ActivityWidgetDay; rect: DOMRect } | null>(null)
  const maxTokens = useMemo(
    () => Math.max(...activity.map(totalTokensForDay), 1),
    [activity],
  )

  function handleHover(nextTooltip: { day: ActivityWidgetDay; rect: DOMRect } | null) {
    setTooltip(showTooltip ? nextTooltip : null)
  }

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        color: resolvedTheme.text,
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        width: '100%',
      }}
    >
      <HeatmapGrid
        activity={activity}
        maxTokens={maxTokens}
        theme={resolvedTheme}
        onHover={handleHover}
        showLabels={showLabels}
      />

      {showTooltip && tooltip ? <Tooltip day={tooltip.day} rect={tooltip.rect} theme={resolvedTheme} /> : null}
    </div>
  )
}
