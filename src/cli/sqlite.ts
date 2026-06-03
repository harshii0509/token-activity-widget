import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import initSqlJs from 'sql.js'

const require = createRequire(import.meta.url)

let sqlPromise: Promise<Awaited<ReturnType<typeof initSqlJs>>> | null = null

async function loadSqlJs() {
  if (!sqlPromise) {
    const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm')
    sqlPromise = initSqlJs({
      locateFile: () => pathToFileURL(wasmPath).href,
    })
  }

  return sqlPromise
}

export async function openSqliteDatabase(dbPath: string) {
  const SQL = await loadSqlJs()
  const data = await readFile(dbPath)
  return new SQL.Database(new Uint8Array(data))
}
