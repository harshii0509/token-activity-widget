import type { ActivityWidgetPreset, ActivityWidgetTheme } from '../types.js'

const PRESET_THEMES: Record<ActivityWidgetPreset, ActivityWidgetTheme> = {
  arcade: {
    text: '#212121',
    muted: '#5a6480',
    tooltipBackground: '#111827',
    tooltipText: '#f8fafc',
    activityScale: ['#deeaf5', 'rgba(166,211,69,0.2)', 'rgba(166,211,69,0.4)', 'rgba(166,211,69,0.7)', '#a6d345'],
  },
  night: {
    text: '#f8fafc',
    muted: '#cbd5e1',
    tooltipBackground: '#f8fafc',
    tooltipText: '#020617',
    activityScale: ['rgba(30,41,59,0.88)', 'rgba(34,211,238,0.18)', 'rgba(34,211,238,0.35)', 'rgba(34,211,238,0.68)', '#a5f3fc'],
  },
  paper: {
    text: '#292524',
    muted: '#78716c',
    tooltipBackground: '#292524',
    tooltipText: '#fffbeb',
    activityScale: ['#e7e5e4', 'rgba(217,119,6,0.18)', 'rgba(217,119,6,0.34)', 'rgba(180,83,9,0.68)', '#92400e'],
  },
}

export function getPresetTheme(preset: ActivityWidgetPreset): ActivityWidgetTheme {
  return PRESET_THEMES[preset]
}
