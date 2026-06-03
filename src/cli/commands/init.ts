import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { ActivityWidgetPreset } from '../../types.js'
import { frameworkLabel, scaffoldProject } from '../scaffold.js'
import {
  buildDefaultConfig,
  defaultSourcePaths,
  detectFramework,
  updateProjectPackageJson,
  writeConfig,
} from '../project.js'
import type { SupportedFramework, WidgetSetupMode } from '../types.js'

function asMode(value: string | boolean | undefined): WidgetSetupMode | undefined {
  return value === 'import-json' || value === 'fetch-url' ? value : undefined
}

function asFramework(value: string | boolean | undefined): SupportedFramework | undefined {
  return value === 'next-app-router' || value === 'vite-react' ? value : undefined
}

function asPreset(value: string | boolean | undefined): ActivityWidgetPreset | undefined {
  return value === 'arcade' || value === 'night' || value === 'paper' ? value : undefined
}

async function readPackageVersion(packageRoot: string) {
  const packageJson = JSON.parse(await readFile(path.join(packageRoot, 'package.json'), 'utf8')) as { version: string }
  return packageJson.version
}

export async function runInitCommand({
  cwd,
  packageRoot,
  flags,
}: {
  cwd: string
  packageRoot: string
  flags: Record<string, string | boolean>
}) {
  const detectedFramework = await detectFramework(cwd)
  const framework = asFramework(flags.framework) ?? detectedFramework
  if (!framework) {
    throw new Error('Could not detect a supported project. v1 officially scaffolds Next.js App Router and Vite + React projects.')
  }

  const mode = asMode(flags.mode) ?? 'import-json'
  const preset = asPreset(flags.preset) ?? 'night'
  const defaults = defaultSourcePaths()

  console.log('token-activity-widget setup')
  console.log('')
  console.log('Two data flows are supported:')
  console.log('- Import JSON: simplest and private-first. Sync writes generated activity data into your repo.')
  console.log('- Fetch URL: sync writes a public JSON file, and the widget fetches it at runtime.')
  if (!flags.mode) {
    console.log('')
    console.log('No mode was passed, so setup is using Import JSON by default. Use --mode fetch-url if you want the fetch-based version.')
  }

  const config = buildDefaultConfig({
    cwd,
    framework,
    mode,
    preset,
    publicId: typeof flags['public-id'] === 'string' ? flags['public-id'] : undefined,
    sourcePaths: {
      claude: typeof flags['claude-path'] === 'string' ? flags['claude-path'] : defaults.claude,
      codex: typeof flags['codex-path'] === 'string' ? flags['codex-path'] : defaults.codex,
      opencode: typeof flags['opencode-path'] === 'string' ? flags['opencode-path'] : defaults.opencode,
    },
  })

  const packageVersion = await readPackageVersion(packageRoot)
  await writeConfig(cwd, config)
  await updateProjectPackageJson(cwd, packageVersion)
  await scaffoldProject(cwd, config, packageVersion)

  console.log('')
  console.log(`Detected framework: ${frameworkLabel(framework)}`)
  console.log(`Selected mode: ${mode}`)
  console.log(`Preset: ${preset}`)
  console.log('')
  console.log('Generated:')
  console.log(`- token-activity-widget.config.json`)
  console.log(`- ${config.outputs.componentPath}`)
  console.log(`- ${config.outputs.jsonPath}`)
  if (config.outputs.modulePath) {
    console.log(`- ${config.outputs.modulePath}`)
  }
  console.log(`- ${config.outputs.promptPath}`)
  console.log('')
  console.log('Next steps:')
  console.log('- run your package manager install so the new dependency and script are available')
  console.log('- run `token-activity-widget sync` or `npm run token-activity:sync` to generate real data')
  console.log(`- paste the agent prompt from ${config.outputs.promptPath} into Codex or Claude if you want help placing the widget in your app`)
}
