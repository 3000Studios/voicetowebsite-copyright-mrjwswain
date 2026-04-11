import React from 'react'

const presets = [
  {
    label: 'Landing page',
    command: {
      action: 'create_landing_page',
      topic: 'AI automation tools',
      goal: 'generate leads',
      autoDeploy: false
    }
  },
  {
    label: 'Blog post',
    command: {
      action: 'create_blog_post',
      topic: 'AI-powered conversion optimization',
      length: 'medium',
      autoDeploy: false
    }
  },
  {
    label: 'Feature section',
    command: {
      action: 'generate_feature_section',
      product: 'Platform Studio',
      topic: 'conversion-driven publishing',
      autoDeploy: false
    }
  },
  {
    label: 'Image set',
    command: {
      action: 'generate_images',
      query: 'AI command center dashboard',
      count: 1,
      autoDeploy: false
    }
  },
  {
    label: 'Traffic cycle',
    command: {
      action: 'run_traffic_cycle',
      count: 2,
      includeImages: true,
      autoDeploy: false
    }
  }
]

export default function CommandConsole({
  commandText,
  onCommandTextChange,
  onRunCommand,
  busy,
  lastResult
}) {
  return (
    <section className="admin-card">
      <div className="admin-card__header">
        <div>
          <span className="eyebrow">AI Console</span>
          <h2>Command router input</h2>
        </div>
        <div className="preset-row">
          {presets.map((preset) => (
            <button
              key={preset.label}
              className="pill-button"
              type="button"
              onClick={() => onCommandTextChange(JSON.stringify(preset.command, null, 2))}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
      <textarea
        className="code-editor"
        spellCheck="false"
        value={commandText}
        onChange={(event) => onCommandTextChange(event.target.value)}
      />
      <div className="admin-actions">
        <button className="button button--primary" type="button" onClick={onRunCommand} disabled={busy}>
          {busy ? 'Running...' : 'Run command'}
        </button>
      </div>
      {lastResult ? <pre className="result-panel">{JSON.stringify(lastResult, null, 2)}</pre> : null}
    </section>
  )
}
