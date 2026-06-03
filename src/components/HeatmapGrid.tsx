import { buildWeeks, intensity, isMonthTick, monthAbbr, totalTokensForDay } from '../data/widgetData.js'
import type { ActivityWidgetDay, ActivityWidgetTheme } from '../types.js'

export function HeatmapGrid({
  activity,
  maxTokens,
  theme,
  onHover,
  showLabels = true,
}: {
  activity: ActivityWidgetDay[]
  maxTokens: number
  theme: ActivityWidgetTheme
  onHover: (value: { day: ActivityWidgetDay; rect: DOMRect } | null) => void
  showLabels?: boolean
}) {
  const weeks = buildWeeks(activity)
  const columns = showLabels ? '24px repeat(53, 13px)' : 'repeat(53, 13px)'
  const rows = showLabels ? '14px repeat(7, 13px)' : 'repeat(7, 13px)'

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: columns, gridTemplateRows: rows, gap: 3, minWidth: showLabels ? 760 : 686, width: 'max-content' }}>
        {showLabels ? <div /> : null}
        {showLabels
          ? weeks.map((week, wi) => (
              <div key={`month-${wi}`} style={{ fontSize: 10, color: theme.muted, display: 'flex', alignItems: 'center' }}>
                {week[0] && isMonthTick(week[0].date) ? monthAbbr(week[0].date) : ''}
              </div>
            ))
          : null}

        {Array.from({ length: 7 }, (_, dayIndex) => (
          <Row
            key={dayIndex}
            label={dayIndex === 1 ? 'Mon' : dayIndex === 3 ? 'Wed' : dayIndex === 5 ? 'Fri' : ''}
            cells={weeks}
            dayIndex={dayIndex}
            maxTokens={maxTokens}
            theme={theme}
            onHover={onHover}
            showLabels={showLabels}
          />
        ))}
      </div>
    </div>
  )
}

function Row({
  label,
  cells,
  dayIndex,
  maxTokens,
  theme,
  onHover,
  showLabels,
}: {
  label: string
  cells: ActivityWidgetDay[][]
  dayIndex: number
  maxTokens: number
  theme: ActivityWidgetTheme
  onHover: (value: { day: ActivityWidgetDay; rect: DOMRect } | null) => void
  showLabels: boolean
}) {
  return (
    <>
      {showLabels ? <div style={{ fontSize: 9, color: theme.muted, display: 'flex', alignItems: 'center' }}>{label}</div> : null}
      {cells.map((week, wi) => {
        const day = week[dayIndex]
        if (!day) return <div key={`empty-${dayIndex}-${wi}`} />
        return (
          <div
            key={day.date}
            aria-label={`${day.date} activity cell`}
            title={`${day.date}`}
            onMouseEnter={(event) => onHover({ day, rect: event.currentTarget.getBoundingClientRect() })}
            onMouseLeave={() => onHover(null)}
            style={{
              width: 13,
              height: 13,
              borderRadius: 3,
              cursor: totalTokensForDay(day) > 0 ? 'pointer' : 'default',
              background: theme.activityScale[intensity(totalTokensForDay(day), maxTokens)],
            }}
          />
        )
      })}
    </>
  )
}
