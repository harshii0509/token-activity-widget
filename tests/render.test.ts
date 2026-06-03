import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ActivityGrid } from '../dist/components/ActivityGrid.js'
import { ActivityWidgetFromData } from '../dist/components/ActivityWidgetFromData.js'
import { getTooltipLines } from '../dist/data/widgetData.js'
import type { ActivityWidgetData } from '../dist/types.js'

const baseData: ActivityWidgetData = {
  publicId: 'demo-user',
  preset: 'arcade',
  lastSyncedAt: null,
  activity: [],
}

test('ActivityWidgetFromData renders the grid safely with zero activity', () => {
  const html = renderToStaticMarkup(React.createElement(ActivityWidgetFromData, { data: baseData }))

  assert.match(html, /Mon/)
  assert.match(html, /Wed/)
  assert.match(html, /Fri/)
  assert.match(html, /activity cell/)
})

test('ActivityWidgetFromData strips profile chrome from the rendered output', () => {
  const html = renderToStaticMarkup(React.createElement(ActivityWidgetFromData, { data: baseData }))

  assert.doesNotMatch(html, /avatar fallback/)
  assert.doesNotMatch(html, /Personal activity/)
  assert.doesNotMatch(html, /Active days/)
  assert.doesNotMatch(html, /Streak/)
})

test('ActivityWidgetFromData stays white-label and only applies grid-relevant theme overrides', () => {
  const html = renderToStaticMarkup(
    React.createElement(ActivityWidgetFromData, {
      data: baseData,
      theme: {
        text: '#f5f5f5',
        muted: '#bdbdbd',
        tooltipBackground: '#000000',
        tooltipText: '#ffffff',
        activityScale: ['#111111', '#222222', '#333333', '#444444', '#555555'],
      },
    }),
  )

  assert.doesNotMatch(html, /Claude Leaderboard/)
  assert.match(html, /color:#f5f5f5/)
  assert.match(html, /#111111/)
})

test('ActivityGrid can render a full-year dataset without card chrome', () => {
  const activity = Array.from({ length: 365 }, (_, index) => ({
    date: new Date(Date.UTC(2026, 0, index + 1)).toISOString().slice(0, 10),
    input_tokens: index + 1,
    output_tokens: index + 2,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
    messages: 1,
    sessions: 1,
  }))

  const html = renderToStaticMarkup(React.createElement(ActivityGrid, { activity, preset: 'night' }))

  assert.match(html, /activity cell/)
  assert.doesNotMatch(html, /avatar fallback/)
})

test('tooltip helper returns tokens, messages, and sessions lines', () => {
  const lines = getTooltipLines({
    date: '2026-06-01',
    input_tokens: 1000,
    output_tokens: 500,
    cache_creation_input_tokens: 250,
    cache_read_input_tokens: 250,
    messages: 3,
    sessions: 2,
  })

  assert.deepEqual(lines, ['2,000 tokens', '3 messages', '2 sessions'])
})
