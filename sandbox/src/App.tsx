import { useEffect, useMemo, useState } from 'react'
import {
  ActivityGrid,
  ActivityWidget,
  ActivityWidgetFromData,
  getPresetTheme,
  type ActivityWidgetPreset,
  type ActivityWidgetTheme,
} from 'token-activity-widget'
import { getSampleDefinition, sampleDefinitions } from '../data/samples'

type Mode = 'primitive' | 'direct' | 'fetched'

type ThemeDraft = {
  text: string
  muted: string
  tooltipBackground: string
  tooltipText: string
  activityScale: [string, string, string, string, string]
}

function buildThemeDraft(preset: ActivityWidgetPreset): ThemeDraft {
  const base = getPresetTheme(preset)
  return {
    text: base.text,
    muted: base.muted,
    tooltipBackground: base.tooltipBackground,
    tooltipText: base.tooltipText,
    activityScale: [...base.activityScale] as ThemeDraft['activityScale'],
  }
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

export function App() {
  const [mode, setMode] = useState<Mode>('primitive')
  const [sampleId, setSampleId] = useState(sampleDefinitions[0]?.id ?? 'demo-user')
  const [preset, setPreset] = useState<ActivityWidgetPreset>('night')
  const [width, setWidth] = useState(860)
  const [themeEnabled, setThemeEnabled] = useState(false)
  const [showLabels, setShowLabels] = useState(true)
  const [showTooltip, setShowTooltip] = useState(true)
  const [publicId, setPublicId] = useState(sampleDefinitions[0]?.id ?? 'demo-user')
  const [baseUrl, setBaseUrl] = useState('')
  const [themeDraft, setThemeDraft] = useState<ThemeDraft>(() => buildThemeDraft('night'))

  const sample = useMemo(
    () => getSampleDefinition(sampleId) ?? sampleDefinitions[0],
    [sampleId],
  )

  useEffect(() => {
    setPublicId(sample.id)
  }, [sample.id])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin)
    }
  }, [])

  useEffect(() => {
    setThemeDraft(buildThemeDraft(preset))
  }, [preset])

  const themeOverride = useMemo<Partial<ActivityWidgetTheme> | undefined>(() => {
    if (!themeEnabled) return undefined
    return {
      text: themeDraft.text,
      muted: themeDraft.muted,
      tooltipBackground: themeDraft.tooltipBackground,
      tooltipText: themeDraft.tooltipText,
      activityScale: themeDraft.activityScale,
    }
  }, [themeDraft, themeEnabled])

  const directData = useMemo(
    () => ({
      ...sample.data,
      preset,
    }),
    [preset, sample.data],
  )

  const fetchUrl = useMemo(
    () => `${trimTrailingSlash(baseUrl || 'http://localhost:4277')}/api/public-widget/${encodeURIComponent(publicId || sample.id)}`,
    [baseUrl, publicId, sample.id],
  )

  const snippet = useMemo(() => {
    const labelLine = showLabels ? '' : '\n  showLabels={false}'
    const tooltipLine = showTooltip ? '' : '\n  showTooltip={false}'
    const themeLine = themeEnabled ? '\n  theme={themeOverrides}' : ''

    if (mode === 'primitive') {
      return `import { ActivityGrid } from 'token-activity-widget'

<ActivityGrid
  activity={activity}
  preset="${preset}"${themeLine}${labelLine}${tooltipLine}
  className="token-grid"
/>`
    }

    if (mode === 'direct') {
      return `import { ActivityWidgetFromData } from 'token-activity-widget'

<ActivityWidgetFromData
  data={activityData}
  preset="${preset}"${themeLine}${labelLine}${tooltipLine}
  className="token-grid"
/>`
    }

    return `import { ActivityWidget } from 'token-activity-widget'

<ActivityWidget
  url="${fetchUrl}"
  preset="${preset}"${themeLine}${labelLine}${tooltipLine}
  className="token-grid"
/>`
  }, [fetchUrl, mode, preset, publicId, sample.id, showLabels, showTooltip, themeEnabled])

  return (
    <div className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Token Activity Grid</p>
          <h1>Embed playground for the grid-only package surface.</h1>
        </div>
        <p className="hero-copy">
          This app imports the published package by name. Use it to pressure-test the bare heatmap,
          direct-data wrapper, fetched JSON wrapper, and the small customization surface before you
          drop it into your own site chrome.
        </p>
      </header>

      <main className="layout">
        <section className="panel controls">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Controls</p>
              <h2>Shape the embed, not a built-in card.</h2>
            </div>
            <span className="status-pill">
              {mode === 'primitive' ? 'Bare grid' : mode === 'direct' ? 'Direct data' : 'Fetch URL'}
            </span>
          </div>

          <label className="field">
            <span>Render surface</span>
            <div className="segmented">
              <button type="button" data-active={mode === 'primitive'} onClick={() => setMode('primitive')}>
                ActivityGrid
              </button>
              <button type="button" data-active={mode === 'direct'} onClick={() => setMode('direct')}>
                From data
              </button>
              <button type="button" data-active={mode === 'fetched'} onClick={() => setMode('fetched')}>
                Fetch URL
              </button>
            </div>
          </label>

          <label className="field">
            <span>Sample dataset</span>
            <select value={sampleId} onChange={(event) => setSampleId(event.target.value)}>
              {sampleDefinitions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <small>{sample.description}</small>
          </label>

          <div className="grid two-up">
            <label className="field">
              <span>Preset</span>
              <select value={preset} onChange={(event) => setPreset(event.target.value as ActivityWidgetPreset)}>
                <option value="night">night</option>
                <option value="arcade">arcade</option>
                <option value="paper">paper</option>
              </select>
            </label>

            <label className="field">
              <span>Preview width</span>
              <input
                type="range"
                min="320"
                max="960"
                step="10"
                value={width}
                onChange={(event) => setWidth(Number(event.target.value))}
              />
              <small>{width}px</small>
            </label>
          </div>

          {mode === 'fetched' ? (
            <div className="grid two-up">
              <label className="field">
                <span>Base URL</span>
                <input value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} />
              </label>

              <label className="field">
                <span>Public ID</span>
                <input value={publicId} onChange={(event) => setPublicId(event.target.value)} />
                <small>Unknown ids return a live 404 from the sandbox mock API.</small>
              </label>
            </div>
          ) : null}

          <div className="grid two-up">
            <label className="toggle">
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(event) => setShowLabels(event.target.checked)}
              />
              <span>Show month and weekday labels</span>
            </label>

            <label className="toggle">
              <input
                type="checkbox"
                checked={showTooltip}
                onChange={(event) => setShowTooltip(event.target.checked)}
              />
              <span>Show built-in hover tooltip</span>
            </label>
          </div>

          <label className="toggle">
            <input
              type="checkbox"
              checked={themeEnabled}
              onChange={(event) => setThemeEnabled(event.target.checked)}
            />
            <span>Enable theme overrides</span>
          </label>

          {themeEnabled ? (
            <div className="theme-editor">
              <div className="grid two-up">
                <ColorField
                  label="Text"
                  value={themeDraft.text}
                  onChange={(value) => setThemeDraft((current) => ({ ...current, text: value }))}
                />
                <ColorField
                  label="Muted"
                  value={themeDraft.muted}
                  onChange={(value) => setThemeDraft((current) => ({ ...current, muted: value }))}
                />
                <ColorField
                  label="Tooltip bg"
                  value={themeDraft.tooltipBackground}
                  onChange={(value) => setThemeDraft((current) => ({ ...current, tooltipBackground: value }))}
                />
                <ColorField
                  label="Tooltip text"
                  value={themeDraft.tooltipText}
                  onChange={(value) => setThemeDraft((current) => ({ ...current, tooltipText: value }))}
                />
              </div>

              <div className="scale-grid">
                {themeDraft.activityScale.map((value, index) => (
                  <ColorField
                    key={index}
                    label={`Scale ${index + 1}`}
                    value={value}
                    onChange={(nextValue) =>
                      setThemeDraft((current) => {
                        const nextScale = [...current.activityScale] as ThemeDraft['activityScale']
                        nextScale[index] = nextValue
                        return { ...current, activityScale: nextScale }
                      })
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}

          <div className="notes">
            <p>
              <strong>Fetch URL note:</strong> the sandbox serves a mock
              {' '}<code>/api/public-widget/:publicId</code> endpoint locally, so this mode still uses sample data
              unless you point the widget at your own generated JSON or API URL.
            </p>
          </div>
        </section>

        <section className="panel preview">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Preview</p>
              <h2>See the exact grid surface your website would embed.</h2>
            </div>
            <span className="status-pill">{sample.label}</span>
          </div>

          <div className="preview-stage">
            <div className="preview-ruler">
              <span>{width}px wrapper</span>
              <span>{themeEnabled ? 'Custom theme' : `Preset: ${preset}`}</span>
            </div>

            <div className="widget-frame" style={{ width }}>
              {mode === 'primitive' ? (
                <ActivityGrid
                  activity={directData.activity}
                  preset={preset}
                  theme={themeOverride}
                  showLabels={showLabels}
                  showTooltip={showTooltip}
                />
              ) : mode === 'direct' ? (
                <ActivityWidgetFromData
                  data={directData}
                  preset={preset}
                  theme={themeOverride}
                  showLabels={showLabels}
                  showTooltip={showTooltip}
                />
              ) : (
                <ActivityWidget
                  url={fetchUrl}
                  preset={preset}
                  theme={themeOverride}
                  showLabels={showLabels}
                  showTooltip={showTooltip}
                />
              )}
            </div>
          </div>

          <div className="snippet-card">
            <div className="panel-kicker">Consumer snippet</div>
            <pre>{snippet}</pre>
          </div>
        </section>
      </main>
    </div>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="field color-field">
      <span>{label}</span>
      <div className="color-row">
        <input type="color" value={value} onChange={(event) => onChange(event.target.value)} />
        <input value={value} onChange={(event) => onChange(event.target.value)} />
      </div>
    </label>
  )
}
