import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { ActivityWidgetPreset } from '../types.js'
import type { SupportedFramework, WidgetSetupConfig, WidgetSetupMode } from './types.js'

const CONFIG_FILENAME = 'token-activity-widget.config.json'

interface PackageJsonShape {
  name?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  scripts?: Record<string, string>
}

export interface InitOptions {
  cwd: string
  framework?: SupportedFramework
  mode?: WidgetSetupMode
  preset?: ActivityWidgetPreset
  publicId?: string
  sourcePaths?: Partial<Record<'claude' | 'codex' | 'opencode', string>>
}

async function exists(targetPath: string) {
  try {
    await access(targetPath)
    return true
  } catch {
    return false
  }
}

export async function readProjectPackageJson(cwd: string) {
  const packageJsonPath = path.join(cwd, 'package.json')
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8')) as PackageJsonShape
  return { packageJsonPath, packageJson }
}

export async function detectFramework(cwd: string): Promise<SupportedFramework | null> {
  const { packageJson } = await readProjectPackageJson(cwd)
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  }

  if (allDeps.next && await exists(path.join(cwd, 'app'))) {
    return 'next-app-router'
  }

  if (allDeps.vite && allDeps.react && await exists(path.join(cwd, 'src'))) {
    return 'vite-react'
  }

  return null
}

function slugifyPublicId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'token-activity'
}

export function defaultSourcePaths(homeDir = process.env.HOME ?? '') {
  return {
    claude: path.join(homeDir, '.claude', 'projects'),
    codex: path.join(homeDir, '.codex', 'logs_2.sqlite'),
    opencode: path.join(homeDir, '.local', 'share', 'opencode', 'opencode.db'),
  }
}

export function buildDefaultConfig({
  cwd,
  framework,
  mode,
  preset,
  publicId,
  sourcePaths,
}: {
  cwd: string
  framework: SupportedFramework
  mode: WidgetSetupMode
  preset: ActivityWidgetPreset
  publicId?: string
  sourcePaths?: Partial<Record<'claude' | 'codex' | 'opencode', string>>
}): WidgetSetupConfig {
  const defaults = defaultSourcePaths()
  const resolvedPublicId = slugifyPublicId(publicId ?? path.basename(cwd))

  const outputs = framework === 'next-app-router'
    ? mode === 'import-json'
      ? {
          jsonPath: 'app/data/token-activity-widget.json',
          modulePath: 'app/data/token-activity-widget.generated.ts',
          componentPath: 'components/TokenActivityGrid.tsx',
          promptPath: 'token-activity-widget.agent-prompt.md',
        }
      : {
          jsonPath: 'public/token-activity-widget.json',
          componentPath: 'components/TokenActivityGrid.tsx',
          fetchUrl: '/token-activity-widget.json',
          promptPath: 'token-activity-widget.agent-prompt.md',
        }
    : mode === 'import-json'
      ? {
          jsonPath: 'src/data/token-activity-widget.json',
          modulePath: 'src/data/token-activity-widget.generated.ts',
          componentPath: 'src/components/TokenActivityGrid.tsx',
          promptPath: 'token-activity-widget.agent-prompt.md',
        }
      : {
          jsonPath: 'public/token-activity-widget.json',
          componentPath: 'src/components/TokenActivityGrid.tsx',
          fetchUrl: '/token-activity-widget.json',
          promptPath: 'token-activity-widget.agent-prompt.md',
        }

  return {
    version: 1,
    framework,
    mode,
    preset,
    publicId: resolvedPublicId,
    sources: {
      claude: { enabled: true, path: sourcePaths?.claude ?? defaults.claude },
      codex: { enabled: true, path: sourcePaths?.codex ?? defaults.codex },
      opencode: { enabled: true, path: sourcePaths?.opencode ?? defaults.opencode },
    },
    outputs,
  }
}

export async function writeConfig(cwd: string, config: WidgetSetupConfig) {
  const targetPath = path.join(cwd, CONFIG_FILENAME)
  await writeFile(targetPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8')
  return targetPath
}

export async function loadConfig(cwd: string) {
  const targetPath = path.join(cwd, CONFIG_FILENAME)
  const config = JSON.parse(await readFile(targetPath, 'utf8')) as WidgetSetupConfig
  return { targetPath, config }
}

export async function ensureParent(targetPath: string) {
  await mkdir(path.dirname(targetPath), { recursive: true })
}

export async function updateProjectPackageJson(cwd: string, packageVersion: string) {
  const { packageJsonPath, packageJson } = await readProjectPackageJson(cwd)
  const nextPackageJson: PackageJsonShape = {
    ...packageJson,
    dependencies: {
      ...packageJson.dependencies,
      'token-activity-widget': packageJson.dependencies?.['token-activity-widget'] ?? `^${packageVersion}`,
    },
    scripts: {
      ...packageJson.scripts,
      'token-activity:sync': packageJson.scripts?.['token-activity:sync'] ?? 'token-activity-widget sync',
    },
  }

  await writeFile(packageJsonPath, `${JSON.stringify(nextPackageJson, null, 2)}\n`, 'utf8')
}
