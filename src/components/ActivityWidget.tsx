'use client'

import { useEffect, useState } from 'react'
import { fetchActivityWidgetData } from '../data/fetchActivityWidgetData.js'
import { ActivityWidgetFromData } from './ActivityWidgetFromData.js'
import type { ActivityWidgetData, ActivityWidgetPreset, ActivityWidgetTheme } from '../types.js'

export interface ActivityWidgetProps {
  publicId: string
  baseUrl: string
  preset?: ActivityWidgetPreset
  theme?: Partial<ActivityWidgetTheme>
  className?: string
  showLabels?: boolean
  showTooltip?: boolean
}

export function ActivityWidget({
  publicId,
  baseUrl,
  preset,
  theme,
  className,
  showLabels,
  showTooltip,
}: ActivityWidgetProps) {
  const [data, setData] = useState<ActivityWidgetData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetchActivityWidgetData(baseUrl, publicId)
      .then((nextData) => {
        if (cancelled) return
        setData(nextData)
        setError(null)
      })
      .catch((fetchError) => {
        if (cancelled) return
        setError(fetchError instanceof Error ? fetchError.message : 'Could not load widget.')
      })

    return () => {
      cancelled = true
    }
  }, [baseUrl, publicId])

  if (error) {
    return <WidgetMessage className={className} title="Widget unavailable" body={error} />
  }

  if (!data) {
    return <WidgetMessage className={className} title="Loading activity" body="Fetching the latest activity widget..." />
  }

  return (
    <ActivityWidgetFromData
      data={data}
      preset={preset}
      theme={theme}
      className={className}
      showLabels={showLabels}
      showTooltip={showTooltip}
    />
  )
}

function WidgetMessage({
  className,
  title,
  body,
}: {
  className?: string
  title: string
  body: string
}) {
  return (
    <div
      className={className}
      style={{
        padding: 12,
        color: '#0f172a',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 800, color: '#64748b' }}>
        {title}
      </div>
      <div style={{ marginTop: 8, fontSize: 14 }}>{body}</div>
    </div>
  )
}
