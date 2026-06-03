import { useEffect, useMemo, useState } from 'react'
import {
  ActivityWidget,
  ActivityWidgetFromData,
  getPresetTheme,
  type ActivityWidgetPreset,
  type ActivityWidgetTheme,
} from 'token-activity-widget'
import { getSampleDefinition, sampleDefinitions } from '../data/samples'

type Mode = 'direct' | 'hosted'

type ThemeDraft = {
  frame: string
  text: string
  muted: string
  chipBorder: string
  tooltipBackground: string
  tooltipText: string
  avatarBackground: string
  activityScale: [string, string, string, string, string]
}

function buildThemeDraft(preset: ActivityWidgetPreset): ThemeDraft {
  const base = getPresetTheme(preset)
  return {
    frame: base.frame,
    text: base.text,
    muted: base.muted,
    chipBorder: base.chipBorder,
    tooltipBackground: base.tooltipBackground,
    tooltipText: base.tooltipText,
    avatarBackground: base.avatarBackground,
    activityScale: [...base.activityScale] as ThemeDraft['activityScale'],
  }
}

export function App() {
  const [mode, setMode] = useState<Mode>('direct')
  const [sampleId, setSampleId] = useState(sampleDefinitions[0]?.id ?? 'demo-user')
  const [preset, setPreset] = useState<ActivityWidgetPreset>('night')
  const [width, setWidth] = useState(860)
  const [themeEnabled, setThemeEnabled] = useState(false)
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
      frame: themeDraft.frame,
      text: themeDraft.text,
      muted: themeDraft.muted,
      chipBorder: themeDraft.chipBorder,
      tooltipBackground: themeDraft.tooltipBackground,
      tooltipText: themeDraft.tooltipText,
      avatarBackground: themeDraft.avatarBackground,
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

  const snippet = useMemo(() => {
    if (mode === 'direct') {
      return `import { ActivityWidgetFromData } from 'token-activity-widget'

<ActivityWidgetFromData
  data={sampleData}
  preset="${preset}"${themeEnabled ? '\n  theme={themeOverrides}' : ''}
/>`
    }

    return `import { ActivityWidget } from 'token-activity-widget'

<ActivityWidget
  publicId="${publicId || sample.id}"
  baseUrl="${baseUrl || 'http://localhost:4177'}"
  preset="${preset}"${themeEnabled ? '\n  theme={themeOverrides}' : ''}
/>`
  }, [baseUrl, mode, preset, publicId, sample.id, themeEnabled])

  return (
    <div className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Token Activity Widget</p>
          <h1>Local consumer sandbox for install DX, real rendering, and hosted API testing.</h1>
        </div>
        <p className="hero-copy">
          This app imports the package by name, not by copied source code. Use it to test direct-data mode,
          hosted fetch mode, theme overrides, layout pressure, and sample payloads before you ship.
        </p>
      </header>

      <main className="layout">
        <section className="panel controls">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Controls</p>
              <h2>Try the package like a real consumer.</h2>
            </div>
            <span className="status-pill">{mode === 'direct' ? 'Direct data' : 'Hosted fetch'}</span>
          </div>

          <label className="field">
            <span>Render mode</span>
            <div className="segmented">
              <button type="button" data-active={mode === 'direct'} onClick={() => setMode('direct')}>
                Direct data
              </button>
              <button type="button" data-active={mode === 'hosted'} onClick={() => setMode('hosted')}>
                Hosted fetch
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

          {mode === 'hosted' ? (
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
              <div className="grid three-up">
                <ColorField
                  label="Frame"
                  value={themeDraft.frame}
                  onChange={(value) => setThemeDraft((current) => ({ ...current, frame: value }))}
                />
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
                  label="Chip border"
                  value={themeDraft.chipBorder}
                  onChange={(value) => setThemeDraft((current) => ({ ...current, chipBorder: value }))}
                />
                <ColorField
                  label="Tooltip bg"
                  value={themeDraft.tooltipBackground}
                  onChange={(value) => setThemeDraft((current) => ({ ...current, tooltipBackground: value }))}
                />
                <ColorField
                  label="Avatar bg"
                  value={themeDraft.avatarBackground}
                  onChange={(value) => setThemeDraft((current) => ({ ...current, avatarBackground: value }))}
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
              <strong>Hosted mode note:</strong> the sandbox serves
              {' '}<code>/api/public-widget/:publicId</code> locally, so you can test fetch loading, success, and error states
              without a second app.
            </p>
          </div>
        </section>

        <section className="panel preview">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Preview</p>
              <h2>Stress the real widget surface.</h2>
            </div>
            <span className="status-pill">{sample.label}</span>
          </div>

          <div className="preview-stage">
            <div className="preview-ruler">
              <span>{width}px canvas</span>
              <span>{themeEnabled ? 'Custom theme' : `Preset: ${preset}`}</span>
            </div>

            <div className="widget-frame" style={{ width }}>
              {mode === 'direct' ? (
                <ActivityWidgetFromData data={directData} preset={preset} theme={themeOverride} />
              ) : (
                <ActivityWidget publicId={publicId || sample.id} baseUrl={baseUrl} preset={preset} theme={themeOverride} />
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
