import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { promisify } from 'node:util'
import { pathToFileURL } from 'node:url'
import initSqlJs from 'sql.js'

const execFileAsync = promisify(execFile)
const require = createRequire(import.meta.url)
const cliPath = path.resolve(process.cwd(), 'dist/cli/bin.js')

async function withTempDir(run: (tempDir: string) => Promise<void>) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'token-activity-widget-'))
  try {
    await run(tempDir)
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}

async function runCli(args: string[], cwd: string) {
  return execFileAsync('node', [cliPath, ...args], { cwd })
}

async function createProject(tempDir: string, kind: 'next' | 'vite') {
  if (kind === 'next') {
    await mkdir(path.join(tempDir, 'app'), { recursive: true })
    await writeFile(
      path.join(tempDir, 'package.json'),
      `${JSON.stringify({
        name: 'demo-next-app',
        private: true,
        dependencies: {
          next: '15.0.0',
          react: '19.0.0',
          'react-dom': '19.0.0',
        },
      }, null, 2)}\n`,
      'utf8',
    )
    return
  }

  await mkdir(path.join(tempDir, 'src'), { recursive: true })
  await writeFile(
    path.join(tempDir, 'package.json'),
    `${JSON.stringify({
      name: 'demo-vite-app',
      private: true,
      dependencies: {
        react: '19.0.0',
        'react-dom': '19.0.0',
      },
      devDependencies: {
        vite: '5.4.11',
      },
    }, null, 2)}\n`,
    'utf8',
  )
}

async function loadSqlJs() {
  const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm')
  return initSqlJs({
    locateFile: () => pathToFileURL(wasmPath).href,
  })
}

async function writeSqliteDb(dbPath: string, statements: string[]) {
  const SQL = await loadSqlJs()
  const db = new SQL.Database()
  for (const statement of statements) {
    db.run(statement)
  }
  const binary = db.export()
  db.close()
  await mkdir(path.dirname(dbPath), { recursive: true })
  await writeFile(dbPath, Buffer.from(binary))
}

async function writeFixtureSources(tempDir: string) {
  const claudePath = path.join(tempDir, 'sources', 'claude', 'projects', 'demo')
  const codexPath = path.join(tempDir, 'sources', 'codex', 'logs_2.sqlite')
  const opencodePath = path.join(tempDir, 'sources', 'opencode', 'opencode.db')

  await mkdir(claudePath, { recursive: true })
  await writeFile(
    path.join(claudePath, 'session.jsonl'),
    `${JSON.stringify({
      type: 'assistant',
      sessionId: 'claude-session-1',
      timestamp: '2025-06-03T08:00:00.000Z',
      message: {
        id: 'claude-msg-1',
        model: 'claude-opus-4',
        stop_reason: 'end_turn',
        usage: {
          input_tokens: 120,
          output_tokens: 80,
          cache_creation_input_tokens: 5,
          cache_read_input_tokens: 10,
        },
      },
    })}\n`,
    'utf8',
  )

  await writeSqliteDb(codexPath, [
    `CREATE TABLE logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER NOT NULL,
      ts_nanos INTEGER NOT NULL,
      target TEXT NOT NULL,
      feedback_log_body TEXT
    );`,
    `INSERT INTO logs (ts, ts_nanos, target, feedback_log_body) VALUES (
      1748937600,
      0,
      'opentelemetry_sdk',
      'session_loop{thread_id=019e89df-8fb9-7a62-94fa-356e8a412941}:submission_dispatch{codex.op="user_input"}:turn{thread.id=019e89df-8fb9-7a62-94fa-356e8a412941 turn.id=019e89df-943c-7532-8086-45116761efa4 model=gpt-5.4-mini codex.turn.token_usage.input_tokens=17455 codex.turn.token_usage.cached_input_tokens=1536 codex.turn.token_usage.output_tokens=61 codex.turn.token_usage.reasoning_output_tokens=40 codex.turn.token_usage.total_tokens=17516}'
    );`,
  ])

  await writeSqliteDb(opencodePath, [
    `CREATE TABLE session (
      id TEXT PRIMARY KEY,
      model TEXT,
      time_created INTEGER NOT NULL,
      time_updated INTEGER NOT NULL,
      tokens_input INTEGER NOT NULL DEFAULT 0,
      tokens_output INTEGER NOT NULL DEFAULT 0,
      tokens_reasoning INTEGER NOT NULL DEFAULT 0,
      tokens_cache_read INTEGER NOT NULL DEFAULT 0,
      tokens_cache_write INTEGER NOT NULL DEFAULT 0
    );`,
    `INSERT INTO session (
      id,
      model,
      time_created,
      time_updated,
      tokens_input,
      tokens_output,
      tokens_reasoning,
      tokens_cache_read,
      tokens_cache_write
    ) VALUES (
      'opencode-session-1',
      '{"id":"claude-sonnet-4","providerID":"anthropic"}',
      1748937600000,
      1748941200000,
      210,
      90,
      30,
      15,
      6
    );`,
  ])

  return {
    claudePath: path.join(tempDir, 'sources', 'claude', 'projects'),
    codexPath,
    opencodePath,
  }
}

test('init scaffolds a Next.js import-json project', async () => {
  await withTempDir(async (tempDir) => {
    await createProject(tempDir, 'next')
    await runCli(['init', '--cwd', tempDir], tempDir)

    const config = JSON.parse(await readFile(path.join(tempDir, 'token-activity-widget.config.json'), 'utf8')) as {
      mode: string
      framework: string
      outputs: { componentPath: string; modulePath?: string }
    }
    const component = await readFile(path.join(tempDir, 'components', 'TokenActivityGrid.tsx'), 'utf8')
    const packageJson = JSON.parse(await readFile(path.join(tempDir, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
      scripts?: Record<string, string>
    }

    assert.equal(config.framework, 'next-app-router')
    assert.equal(config.mode, 'import-json')
    assert.equal(config.outputs.modulePath, 'app/data/token-activity-widget.generated.ts')
    assert.match(component, /ActivityWidgetFromData/)
    assert.match(component, /\.\.\/app\/data\/token-activity-widget\.generated/)
    assert.equal(packageJson.dependencies?.['token-activity-widget'], '^0.2.0')
    assert.equal(packageJson.scripts?.['token-activity:sync'], 'token-activity-widget sync')
  })
})

test('init scaffolds a Vite fetch-url project', async () => {
  await withTempDir(async (tempDir) => {
    await createProject(tempDir, 'vite')
    await runCli(['init', '--cwd', tempDir, '--mode', 'fetch-url'], tempDir)

    const config = JSON.parse(await readFile(path.join(tempDir, 'token-activity-widget.config.json'), 'utf8')) as {
      mode: string
      framework: string
      outputs: { jsonPath: string; fetchUrl?: string }
    }
    const component = await readFile(path.join(tempDir, 'src', 'components', 'TokenActivityGrid.tsx'), 'utf8')

    assert.equal(config.framework, 'vite-react')
    assert.equal(config.mode, 'fetch-url')
    assert.equal(config.outputs.jsonPath, 'public/token-activity-widget.json')
    assert.equal(config.outputs.fetchUrl, '/token-activity-widget.json')
    assert.match(component, /ActivityWidget/)
    assert.match(component, /url="\/token-activity-widget\.json"/)
  })
})

test('sync aggregates Claude, Codex, and OpenCode history into widget output', async () => {
  await withTempDir(async (tempDir) => {
    await createProject(tempDir, 'next')
    const fixturePaths = await writeFixtureSources(tempDir)

    await runCli([
      'init',
      '--cwd',
      tempDir,
      '--claude-path',
      fixturePaths.claudePath,
      '--codex-path',
      fixturePaths.codexPath,
      '--opencode-path',
      fixturePaths.opencodePath,
    ], tempDir)

    const result = await runCli(['sync', '--cwd', tempDir], tempDir)
    const summary = JSON.parse(result.stdout) as {
      activity_days: number
      source_counts: Array<{ source: string; events: number }>
    }
    const output = JSON.parse(await readFile(path.join(tempDir, 'app', 'data', 'token-activity-widget.json'), 'utf8')) as {
      activity: Array<{
        date: string
        input_tokens: number
        output_tokens: number
        cache_creation_input_tokens: number
        cache_read_input_tokens: number
        messages: number
        sessions: number
      }>
    }
    const generatedModule = await readFile(path.join(tempDir, 'app', 'data', 'token-activity-widget.generated.ts'), 'utf8')

    assert.equal(summary.activity_days, 1)
    assert.deepEqual(
      summary.source_counts.map((entry) => [entry.source, entry.events]),
      [
        ['claude', 1],
        ['codex', 1],
        ['opencode', 1],
      ],
    )
    assert.equal(output.activity.length, 1)
    assert.deepEqual(output.activity[0], {
      date: '2025-06-03',
      input_tokens: 17785,
      output_tokens: 301,
      cache_creation_input_tokens: 11,
      cache_read_input_tokens: 1561,
      messages: 3,
      sessions: 3,
    })
    assert.match(generatedModule, /const activityData: ActivityWidgetData =/)
    assert.match(generatedModule, /17785/)
  })
})
