import assert from 'node:assert/strict'
import test from 'node:test'
import { fetchActivityWidgetData } from '../dist/data/fetchActivityWidgetData.js'

const minimalPayload = {
  preset: 'arcade',
  activity: [],
}

const richerLegacyPayload = {
  publicId: 'demo',
  displayName: 'Demo User',
  image: null,
  preset: 'arcade',
  currentStreak: 4,
  totalActiveDays: 12,
  lastSyncedAt: '2026-06-04T10:00:00.000Z',
  activity: [],
}

test('fetchActivityWidgetData parses minimal grid payloads', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () =>
    new Response(JSON.stringify(minimalPayload), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }) as typeof fetch

  try {
    const result = await fetchActivityWidgetData('https://leaderboard.example.com/widget.json')
    assert.equal(result.preset, 'arcade')
    assert.deepEqual(result.activity, [])
    assert.equal(result.publicId, undefined)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('fetchActivityWidgetData tolerates richer legacy payloads and ignores extra fields', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () =>
    new Response(JSON.stringify(richerLegacyPayload), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }) as typeof fetch

  try {
    const result = await fetchActivityWidgetData('https://leaderboard.example.com/api/widget/demo')
    assert.equal(result.publicId, 'demo')
    assert.equal(result.lastSyncedAt, '2026-06-04T10:00:00.000Z')
    assert.deepEqual(result.activity, [])
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('fetchActivityWidgetData surfaces json api errors', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: 'Widget not found' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    }) as typeof fetch

  try {
    await assert.rejects(
      () => fetchActivityWidgetData('https://leaderboard.example.com/api/widget/missing'),
      /Widget not found/,
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('fetchActivityWidgetData surfaces malformed json cleanly', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () =>
    new Response('{"broken"', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }) as typeof fetch

  try {
    await assert.rejects(
      () => fetchActivityWidgetData('https://leaderboard.example.com/widget.json'),
      /invalid JSON/i,
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})
