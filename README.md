# `token-activity-widget`

[![npm version](https://img.shields.io/npm/v/token-activity-widget.svg)](https://www.npmjs.com/package/token-activity-widget)

React activity heatmap widget for hosted APIs and custom activity data.

Package: [npmjs.com/package/token-activity-widget](https://www.npmjs.com/package/token-activity-widget)

## What you get

- Direct data mode for apps, dashboards, and personal sites
- Hosted fetch mode for any API that returns the widget payload shape
- Typed theme overrides with built-in presets: `arcade`, `night`, `paper`
- Interactive yearly heatmap with tooltip details for tokens, messages, and sessions
- Local sandbox for trying the package like a real consumer before shipping it

## Requirements

- `react >= 18`
- `react-dom >= 18`
- `node >= 18` for local development and verification

## Install

```bash
npm install token-activity-widget
```

## Quick Start: Direct Data

```tsx
import { ActivityWidgetFromData, type ActivityWidgetData } from 'token-activity-widget'

const data: ActivityWidgetData = {
  publicId: 'demo-user',
  displayName: 'Harshi',
  image: null,
  preset: 'arcade',
  currentStreak: 12,
  totalActiveDays: 98,
  lastSyncedAt: new Date().toISOString(),
  activity: [],
}

export function CustomWidget() {
  return (
    <ActivityWidgetFromData
      data={data}
      theme={{
        frame: '#fff7ed',
        text: '#431407',
        muted: '#9a3412',
        chipBackground: '#ffffff',
        chipBorder: '#fdba74',
        tooltipBackground: '#431407',
        tooltipText: '#fff7ed',
        avatarBackground: '#fed7aa',
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
        frame: '#0b1020',
        text: '#f8fafc',
        muted: '#94a3b8',
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

Return a JSON object matching `ActivityWidgetData`.

## Theme API

```ts
type ActivityWidgetTheme = {
  frame: string
  text: string
  muted: string
  chipBackground: string
  chipBorder: string
  tooltipBackground: string
  tooltipText: string
  avatarBackground: string
  activityScale: [string, string, string, string, string]
}
```

Pass `theme` as a partial object. Missing fields are filled from the chosen preset.

If both `preset` and `theme` are provided, `theme` wins per field.

## Exports

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

- Direct data mode
- Hosted mode backed by a local mock `/api/public-widget/:publicId` endpoint
- Preset and theme controls
- Width controls and multiple sample datasets

## Validation

```bash
npm test
npm run verify
npm run verify:all
```

`verify:all` checks the published package shape and confirms the sandbox builds against the local package.

## Examples

See [`examples/`](./examples) for small hosted and direct-data starter snippets.
