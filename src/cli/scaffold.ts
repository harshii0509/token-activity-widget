import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { ActivityWidgetData } from '../types.js'
import type { SupportedFramework, SyncSummary, WidgetSetupConfig } from './types.js'
import { ensureParent } from './project.js'

function relativeImport(fromFile: string, toFile: string) {
  const raw = path.relative(path.dirname(fromFile), toFile).replace(/\\/g, '/')
  return raw.startsWith('.') ? raw : `./${raw}`
}

function renderComponent(cwd: string, config: WidgetSetupConfig) {
  const componentAbsolute = path.join(cwd, config.outputs.componentPath)
  const componentImport = config.mode === 'import-json' && config.outputs.modulePath
    ? relativeImport(componentAbsolute, path.join(cwd, config.outputs.modulePath))
    : null

  if (config.mode === 'import-json' && componentImport) {
    return `'use client'

import { ActivityWidgetFromData } from 'token-activity-widget'
import activityData from '${componentImport.replace(/\.js$/, '')}'

export function TokenActivityGrid() {
  return <ActivityWidgetFromData data={activityData} preset="${config.preset}" />
}

export default TokenActivityGrid
`
  }

  return `'use client'

import { ActivityWidget } from 'token-activity-widget'

export function TokenActivityGrid() {
  return <ActivityWidget url="${config.outputs.fetchUrl}" preset="${config.preset}" />
}

export default TokenActivityGrid
`
}

function renderDataModule(data: ActivityWidgetData) {
  return `import type { ActivityWidgetData } from 'token-activity-widget'

const activityData: ActivityWidgetData = ${JSON.stringify(data, null, 2)}

export default activityData
`
}

function renderAgentPrompt(config: WidgetSetupConfig) {
  const placementHint = config.framework === 'next-app-router'
    ? 'Place `components/TokenActivityGrid.tsx` into the most visible signed-in or profile surface.'
    : 'Place `src/components/TokenActivityGrid.tsx` into the most visible landing or profile surface.'
  const dataHint = config.mode === 'import-json'
    ? `The generated activity data lives in \`${config.outputs.jsonPath}\` and the typed module lives in \`${config.outputs.modulePath}\`.`
    : `The generated fetch target lives at \`${config.outputs.jsonPath}\` and the widget fetches \`${config.outputs.fetchUrl}\`.`

  return `# Agent Prompt: finish my token activity grid integration

I already ran \`token-activity-widget init\` in this repo.

Project framework: ${config.framework}
Widget mode: ${config.mode}
Preset: ${config.preset}

${dataHint}
${placementHint}

Please:
1. place the generated \`TokenActivityGrid\` component into the best page for this app
2. wrap it with this app's own layout, spacing, and typography instead of adding a new card UI
3. keep the widget white-label and let the surrounding page own the chrome
4. if the current page theme needs different colors, pass \`theme\` overrides into the grid/widget component
`
}

export async function scaffoldProject(cwd: string, config: WidgetSetupConfig, packageVersion: string) {
  const componentPath = path.join(cwd, config.outputs.componentPath)
  await ensureParent(componentPath)
  await writeFile(componentPath, renderComponent(cwd, config), 'utf8')

  if (config.mode === 'fetch-url') {
    const jsonPath = path.join(cwd, config.outputs.jsonPath)
    await ensureParent(jsonPath)
    const stubData: ActivityWidgetData = {
      publicId: config.publicId,
      preset: config.preset,
      lastSyncedAt: null,
      activity: [],
    }
    await writeFile(jsonPath, `${JSON.stringify(stubData, null, 2)}\n`, 'utf8')
  } else if (config.outputs.modulePath) {
    const jsonPath = path.join(cwd, config.outputs.jsonPath)
    const modulePath = path.join(cwd, config.outputs.modulePath)
    await ensureParent(jsonPath)
    await ensureParent(modulePath)

    const stubData: ActivityWidgetData = {
      publicId: config.publicId,
      preset: config.preset,
      lastSyncedAt: null,
      activity: [],
    }
    await writeFile(jsonPath, `${JSON.stringify(stubData, null, 2)}\n`, 'utf8')
    await writeFile(modulePath, renderDataModule(stubData), 'utf8')
  }

  const promptPath = path.join(cwd, config.outputs.promptPath)
  await ensureParent(promptPath)
  await writeFile(promptPath, renderAgentPrompt(config), 'utf8')

  return {
    componentPath,
    promptPath,
    packageVersion,
  }
}

export async function writeSyncOutputs(cwd: string, summary: SyncSummary) {
  const jsonPath = path.join(cwd, summary.config.outputs.jsonPath)
  await ensureParent(jsonPath)
  await writeFile(jsonPath, `${JSON.stringify(summary.data, null, 2)}\n`, 'utf8')

  if (summary.config.mode === 'import-json' && summary.config.outputs.modulePath) {
    const modulePath = path.join(cwd, summary.config.outputs.modulePath)
    await ensureParent(modulePath)
    await writeFile(modulePath, renderDataModule(summary.data), 'utf8')
  }
}

export function frameworkLabel(framework: SupportedFramework) {
  return framework === 'next-app-router' ? 'Next.js App Router' : 'Vite + React'
}
