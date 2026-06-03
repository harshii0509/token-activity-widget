# `token-activity-widget`

[![npm version](https://img.shields.io/npm/v/token-activity-widget.svg)](https://www.npmjs.com/package/token-activity-widget)

React activity heatmap grid for hosted APIs and custom activity data.

Package: [npmjs.com/package/token-activity-widget](https://www.npmjs.com/package/token-activity-widget)

## What you get

- A grid-only activity heatmap you can drop into your own website chrome
- Bare `ActivityGrid` primitive for apps that already have activity data
- Direct data and hosted fetch wrappers built on the same grid surface
- Typed theme overrides with built-in presets: `arcade`, `night`, `paper`
- Month labels, weekday labels, and hover tooltip enabled by default
- Local sandbox for testing the package like a real consumer before shipping

## Requirements

- `react >= 18`
- `react-dom >= 18`
- `node >= 18` for local development and verification

## Install

```bash
npm install token-activity-widget
```

## Quick Start: Bare Grid

```tsx
import { ActivityGrid, type ActivityWidgetDay } from 'token-activity-widget'

const activity: ActivityWidgetDay[] = [
  {
    date: '2026-06-01',
    input_tokens: 1200,
    output_tokens: 800,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
    messages: 4,
    sessions: 2,
  },
]

export function SiteSection() {
  return (
    <div style={{ maxWidth: 840, padding: 16 }}>
      <ActivityGrid
        activity={activity}
        preset="night"
        className="token-grid"
      />
    </div>
  )
}
```

## Quick Start: Direct Data

```tsx
import { ActivityWidgetFromData, type ActivityWidgetData } from 'token-activity-widget'

const data: ActivityWidgetData = {
  publicId: 'demo-user',
  preset: 'arcade',
  lastSyncedAt: new Date().toISOString(),
  activity: [],
}

export function CustomWidget() {
  return (
    <ActivityWidgetFromData
      data={data}
      theme={{
        text: '#431407',
        muted: '#9a3412',
        tooltipBackground: '#431407',
        tooltipText: '#fff7ed',
        activityScale: ['#ffedd5', '#fdba74', '#fb923c', '#ea580c', '#9a3412'],
      }}
    />
  )
}
```

## Quick Start: Hosted Mode

```tsx
import { ActivityWidget } from 'token-activity-widget'

export function PortfolioWidget() {
  return (
    <ActivityWidget
      publicId="your-public-id"
      baseUrl="https://your-app.com"
      preset="night"
      theme={{
        text: '#f8fafc',
        muted: '#94a3b8',
        tooltipBackground: '#f8fafc',
        tooltipText: '#020617',
        activityScale: ['#0f172a', '#1d4ed8', '#2563eb', '#60a5fa', '#bfdbfe'],
      }}
    />
  )
}
```

`ActivityWidget` fetches from:

```txt
${baseUrl}/api/public-widget/${encodeURIComponent(publicId)}
```

Return a JSON object matching `ActivityWidgetData`. The fetch layer accepts both:

- the new minimal grid payload
- richer legacy payloads with extra profile fields, which are ignored

Minimal payload example:

```json
{
  "publicId": "demo-user",
  "preset": "night",
  "lastSyncedAt": "2026-06-04T10:00:00.000Z",
  "activity": []
}
```

## Customization

All public components support:

- `preset`
- `theme`
- `className`
- `showLabels`
- `showTooltip`

`className` is the main website-embed hook. Wrap the grid in your own section, card, layout, or typography system rather than expecting the package to provide that chrome for you.

## Theme API

```ts
type ActivityWidgetTheme = {
  text: string
  muted: string
  tooltipBackground: string
  tooltipText: string
  activityScale: [string, string, string, string, string]
}
```

Pass `theme` as a partial object. Missing fields are filled from the chosen preset.

If both `preset` and `theme` are provided, `theme` wins per field.

## Exports

- `ActivityGrid`
- `ActivityWidget`
- `ActivityWidgetFromData`
- `fetchActivityWidgetData`
- `buildActivityWidgetDataUrl`
- `getPresetTheme`
- `mergeWidgetTheme`
- `type ActivityWidgetTheme`
- `type ActivityWidgetData`
- `type ActivityWidgetDay`
- `type ActivityWidgetPreset`

## Local Sandbox

Use the sandbox when you want to test the package like a real consumer and play with it visually.

```bash
npm install
npm run sandbox:install
npm run sandbox:dev
```

Useful sandbox commands:

- `npm run sandbox:dev`: build the library, then run the sandbox
- `npm run sandbox:dev:watch`: watch the library build and run the sandbox together
- `npm run sandbox:build`: production-build the sandbox against the local package
- `npm run sandbox:smoke`: boot a local sandbox server and verify the page shell plus hosted mock API
- `npm run sandbox:preview`: preview the built sandbox locally

The sandbox includes:

- Bare `ActivityGrid` mode
- Direct-data mode
- Hosted mode backed by a local mock `/api/public-widget/:publicId` endpoint
- Preset, theme, width, label, and tooltip controls

## Validation

```bash
npm test
npm run verify
npm run verify:all
```

`verify:all` checks the published package shape and confirms the sandbox builds against the local package.

## Examples

See [`examples/`](./examples) for small hosted and direct-data starter snippets.
