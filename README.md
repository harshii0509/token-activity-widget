# `token-activity-widget`

[![npm version](https://img.shields.io/npm/v/token-activity-widget.svg)](https://www.npmjs.com/package/token-activity-widget)

White-label React activity heatmap grid plus a local sync CLI for Claude, Codex, and OpenCode usage.

Package: [npmjs.com/package/token-activity-widget](https://www.npmjs.com/package/token-activity-widget)

## What this is

- A grid-only activity heatmap you can drop into your own website chrome
- A white-label React surface: no built-in header, avatar, streak card, or profile frame
- A local CLI that reads real activity from your machine and writes normalized widget data into your app
- Two website flows:
  - `Import JSON`: simplest and private-first
  - `Fetch URL`: runtime fetch from a static JSON file or API URL

## What this is not

- It does not read local logs from the browser
- It does not ask website visitors for Claude, Codex, or OpenCode tokens
- It does not require your users to log into a separate leaderboard website

The browser package only renders data you give it. Real activity collection stays in the CLI.

## Install

```bash
npm install token-activity-widget
```

Requirements:

- `react >= 18`
- `react-dom >= 18`
- `node >= 18`

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
      <ActivityGrid activity={activity} preset="night" />
    </div>
  )
}
```

## Quick Start: Import Data Object

```tsx
import { ActivityWidgetFromData, type ActivityWidgetData } from 'token-activity-widget'

const data: ActivityWidgetData = {
  publicId: 'demo-user',
  preset: 'night',
  lastSyncedAt: new Date().toISOString(),
  activity: [],
}

export function CustomWidget() {
  return <ActivityWidgetFromData data={data} />
}
```

## Quick Start: Fetch Any JSON URL

```tsx
import { ActivityWidget } from 'token-activity-widget'

export function PortfolioWidget() {
  return (
    <ActivityWidget
      url="/token-activity-widget.json"
      preset="paper"
    />
  )
}
```

`ActivityWidget` accepts any URL that returns JSON matching `ActivityWidgetData`.

That URL can be:

- a static file like `/token-activity-widget.json`
- your own API route
- any other same-origin or allowed cross-origin JSON endpoint

The fetch layer still tolerates richer legacy payloads with extra fields, but only the grid data is used.

## Real Data Setup

The CLI is the real-data bridge.

Run this inside the website repo where you want to embed the grid:

```bash
npx token-activity-widget init
```

That command:

- detects a supported app
- explains the two setup modes in plain language
- writes `token-activity-widget.config.json`
- scaffolds a starter component
- adds a `token-activity:sync` script to your app
- writes an agent prompt you can paste into Codex or Claude for final placement/styling

Then generate real data:

```bash
npx token-activity-widget sync
```

Or after install:

```bash
npm run token-activity:sync
```

## The Two Website Flows

### 1. Import JSON

Recommended for most people.

What the user does:

1. Run `npx token-activity-widget init`
2. Let it scaffold the component and config
3. Run `npx token-activity-widget sync`
4. Import the generated component into their app page
5. Re-run sync whenever they want fresh data, then redeploy

What gets generated:

- a JSON data file
- a typed generated module for direct app imports
- a `TokenActivityGrid` component using `ActivityWidgetFromData`

### 2. Fetch URL

Best when the site should fetch the widget data at runtime.

What the user does:

1. Run `npx token-activity-widget init --mode fetch-url`
2. Let it scaffold a public JSON target and component
3. Run `npx token-activity-widget sync`
4. Render the generated component
5. Re-run sync whenever they want fresh public JSON

What gets generated:

- a public JSON file like `public/token-activity-widget.json`
- a `TokenActivityGrid` component using `ActivityWidget url="..."`

The default fetch target is a same-site static JSON file, but advanced users can later swap the URL to their own API route without changing the widget contract.

## Supported Local Sources

The CLI reads local usage history from these defaults:

- Claude: `~/.claude/projects/**/*.jsonl`
- Codex: `~/.codex/logs_2.sqlite`
- OpenCode: `~/.local/share/opencode/opencode.db`

You can override those paths in `token-activity-widget.config.json` if your setup differs.

## Framework Support

v1 scaffolding officially supports:

- Next.js App Router
- Vite + React

## Customization

All public components support:

- `preset`
- `theme`
- `className`
- `showLabels`
- `showTooltip`

This package is intentionally white-label. Wrap the grid in your own layout, typography, and brand chrome.

### Theme API

```ts
type ActivityWidgetTheme = {
  text: string
  muted: string
  tooltipBackground: string
  tooltipText: string
  activityScale: [string, string, string, string, string]
}
```

Pass `theme` as a partial object. Missing fields fall back to the chosen preset.

Built-in presets:

- `night`
- `arcade`
- `paper`

## Public API

- `ActivityGrid`
- `ActivityWidgetFromData`
- `ActivityWidget`
- `fetchActivityWidgetData`
- `getPresetTheme`
- `mergeWidgetTheme`
- `type ActivityWidgetTheme`
- `type ActivityWidgetData`
- `type ActivityWidgetDay`
- `type ActivityWidgetPreset`

## Sandbox

Use the sandbox to test the package like a real consumer:

```bash
npm install
npm run sandbox:install
npm run sandbox:dev
```

The sandbox includes:

- bare `ActivityGrid` mode
- direct-data mode
- fetched URL mode
- preset, theme, width, label, and tooltip controls
- a local mock URL for testing fetch success and error states

## Validation

```bash
npm test
npm run verify
npm run verify:all
npm run sandbox:smoke
```

`verify:all` checks the package shape and confirms the sandbox builds against the local package.

## Examples

See [`examples/`](./examples) for:

- bare grid usage
- direct-data usage
- fetched JSON URL usage
