import assert from 'node:assert/strict'
import test from 'node:test'
import { getPresetTheme } from '../dist/theme/presets.js'
import { mergeWidgetTheme } from '../dist/theme/mergeTheme.js'

test('mergeWidgetTheme preserves preset defaults when only one field is overridden', () => {
  const theme = mergeWidgetTheme('night', { text: '#ffffff' })
  const preset = getPresetTheme('night')

  assert.equal(theme.text, '#ffffff')
  assert.equal(theme.muted, preset.muted)
  assert.deepEqual(theme.activityScale, preset.activityScale)
})

test('mergeWidgetTheme lets theme overrides win over the preset', () => {
  const theme = mergeWidgetTheme('paper', {
    activityScale: ['#111111', '#222222', '#333333', '#444444', '#555555'],
    tooltipBackground: '#abcdef',
  })

  assert.equal(theme.tooltipBackground, '#abcdef')
  assert.deepEqual(theme.activityScale, ['#111111', '#222222', '#333333', '#444444', '#555555'])
})
