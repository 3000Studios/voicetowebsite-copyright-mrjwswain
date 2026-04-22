import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import BrandWireframe from '../components/BrandWireframe.jsx'
import WebsitePreviewStudio from '../components/WebsitePreviewStudio.jsx'
import { clearCustomerSession, readCustomerSession, saveCustomerSession } from '../src/customerSession.js'
import {
  addWorkspaceDraft,
  addWorkspaceMedia,
  addWorkspacePreview,
  readCustomerWorkspace,
  removeWorkspaceDraft,
  removeWorkspaceMedia,
  saveCustomerWorkspace
} from '../src/customerWorkspace.js'
import { pageLookup, theme } from '../src/siteData.js'
import { SITE_DISPLAY_NAME, SITE_DOMAIN, SITE_URL } from '../src/siteMeta.js'
import { getCustomerSession, requestCustomerDashboardAccess } from '../src/siteApi.js'

const PANEL_ORDER = ['dashboard', 'generator', 'pages', 'design', 'media', 'settings']
const PANEL_LABELS = { dashboard: 'Dashboard', generator: 'Generator', pages: 'Pages', design: 'Design', media: 'Media', settings: 'Settings' }

function isValidEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '').trim()) }
function slugFromName(name) {
  const normalized = String(name ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return normalized ? `/${normalized}` : `/draft-${Date.now()}`
}
function formatDate(value) {
  if (!value) return 'Not yet'
  try { return new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) } catch { return value }
}
function formatRelative(value) {
  if (!value) return 'No activity yet'
  const date = new Date(value)
  const diff = Date.now() - date.getTime()
  const minutes = Math.max(1, Math.round(diff / 60000))
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}
function titleCase(value) { return String(value ?? '').replace(/[-_]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) }
function toPageEntries() {
  return Object.entries(pageLookup).filter(([slug]) => !['theme', 'homepage'].includes(slug)).map(([slug, page]) => ({
    id: `live-${slug}`,
    name: page.title ?? page.headline ?? titleCase(slug),
    slug: slug === 'pricing' ? '/pricing' : slug === 'contact' ? '/contact' : `/${slug}`,
    status: 'Live page',
    updatedAt: page.updatedAt ?? null
  }))
}
function Toast({ state }) {
  return <div className={`dashboard-toast${state.visible ? ' dashboard-toast--visible' : ''}`} style={{ '--toast-color': state.color }}>{state.message}</div>
}

export default function CustomerDashboardPage() {
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [session, setSession] = useState(null)
  const [activePanel, setActivePanel] = useState('dashboard')
  const [workspace, setWorkspace] = useState(null)
  const [toast, setToast] = useState({ visible: false, message: '', color: '#6ed8ff' })
  const [newDraftName, setNewDraftName] = useState('')
  const [settingsDraft, setSettingsDraft] = useState(null)
  const [designDraft, setDesignDraft] = useState(null)
  const fileInputRef = useRef(null)
  const toastTimerRef = useRef(null)
  const livePages = useMemo(() => toPageEntries(), [])
  const account = session?.account ?? null
  const resolvedEmail = account?.email ?? ''

  useEffect(() => () => { if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current) }, [])

  useEffect(() => {
    async function load() {
      try {
        setBusy(true)
        setError('')
        const tokenFromUrl = searchParams.get('token')
        const saved = readCustomerSession()
        const token = tokenFromUrl || saved?.accessToken || ''
        if (!token) { setSession(null); return }
        const response = await getCustomerSession(token)
        const nextSession = { accessToken: response.accessToken, dashboardUrl: response.dashboardUrl, account: response.account }
        saveCustomerSession(nextSession)
        setSession(nextSession)
      } catch (nextError) {
        setSession(null)
        setError(nextError.message)
      } finally { setBusy(false) }
    }
    load()
  }, [searchParams])

  useEffect(() => {
    if (!resolvedEmail) return
    const nextWorkspace = readCustomerWorkspace(resolvedEmail)
    setWorkspace(nextWorkspace)
    setSettingsDraft(nextWorkspace.settings)
    setDesignDraft(nextWorkspace.design)
  }, [resolvedEmail])

  function showToast(message, color = '#6ed8ff') {
    setToast({ visible: true, message, color })
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    toastTimerRef.current = window.setTimeout(() => setToast((current) => ({ ...current, visible: false })), 2200)
  }

  async function handleAccessRequest(event) {
    event.preventDefault()
    try {
      setError('')
      const normalizedEmail = email.trim().toLowerCase()
      if (!isValidEmail(normalizedEmail)) throw new Error('Enter the checkout email used for your plan.')
      setBusy(true)
      const response = await requestCustomerDashboardAccess(normalizedEmail)
      const nextSession = { accessToken: response.accessToken, dashboardUrl: response.dashboardUrl, account: response.account }
      saveCustomerSession(nextSession)
      setSession(nextSession)
    } catch (nextError) {
      setError(nextError.message)
    } finally { setBusy(false) }
  }

  function handleSignOut() {
    clearCustomerSession()
    setSession(null)
    setWorkspace(null)
    showToast('Signed out', '#9bb7cb')
  }
  function persistWorkspace(nextWorkspace, successMessage) {
    if (!resolvedEmail) return
    saveCustomerWorkspace(resolvedEmail, nextWorkspace)
    setWorkspace(nextWorkspace)
    if (successMessage) showToast(successMessage, '#37d39a')
  }
  function handleAddDraft() {
    const name = newDraftName.trim()
    if (!name || !resolvedEmail) return
    const nextWorkspace = addWorkspaceDraft(resolvedEmail, { name, slug: slugFromName(name) })
    setWorkspace(nextWorkspace)
    setNewDraftName('')
    showToast('Draft page saved', '#37d39a')
  }
  function handleRemoveDraft(draftId) {
    if (!resolvedEmail) return
    const nextWorkspace = removeWorkspaceDraft(resolvedEmail, draftId)
    setWorkspace(nextWorkspace)
    showToast('Draft removed', '#ff7a95')
  }
  async function handleMediaUpload(event) {
    const file = event.target.files?.[0]
    if (!file || !resolvedEmail) return
    const reader = new FileReader()
    reader.onload = () => {
      const nextWorkspace = addWorkspaceMedia(resolvedEmail, { name: file.name, type: file.type, size: file.size, dataUrl: String(reader.result ?? '') })
      setWorkspace(nextWorkspace)
      showToast('Media added to your workspace', '#37d39a')
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }
  function handleRemoveMedia(assetId) {
    if (!resolvedEmail) return
    const nextWorkspace = removeWorkspaceMedia(resolvedEmail, assetId)
    setWorkspace(nextWorkspace)
    showToast('Media removed', '#ff7a95')
  }
  function handleSettingsSave() { if (workspace && settingsDraft) persistWorkspace({ ...workspace, settings: settingsDraft }, 'Workspace settings saved') }
  function handleDesignSave() { if (workspace && designDraft) persistWorkspace({ ...workspace, design: designDraft }, 'Brand defaults saved') }
  function openSitePreview() { window.open(SITE_URL, '_blank', 'noopener,noreferrer'); showToast('Live site opened', '#6ed8ff') }
  function openDashboardUrl() { if (!session?.dashboardUrl) return; navigator.clipboard?.writeText(session.dashboardUrl).catch(() => {}); showToast('Dashboard link copied', '#8bc4ff') }
  function handlePublishState() { window.open(SITE_URL, '_blank', 'noopener,noreferrer'); showToast(`Production is live on ${SITE_DOMAIN}`, '#37d39a') }

  const stats = [
    { label: 'Pages', value: String(livePages.length + (workspace?.drafts?.length ?? 0)), detail: `${workspace?.drafts?.length ?? 0} workspace drafts` },
    { label: 'Previews', value: String(account?.generationCount ?? 0), detail: account?.lastPreviewAt ? formatRelative(account.lastPreviewAt) : 'No generated previews yet' },
    { label: 'Media', value: String((workspace?.media?.length ?? 0) + (workspace?.previews?.[0]?.mediaAttribution?.length ?? 0)), detail: `${workspace?.media?.length ?? 0} uploaded assets` },
    { label: 'Plans', value: String(account?.entitlements?.length ?? 0), detail: account?.entitlements?.length ? 'Active access entitlements' : 'No active entitlements' }
  ]

  const recentEntries = [
    ...(workspace?.previews ?? []).map((preview) => ({ id: preview.id, title: preview.title, status: preview.qualityScore ? `Quality ${preview.qualityScore}` : 'Generated', updatedAt: preview.createdAt, action: 'Open generator' })),
    ...livePages.slice(0, 4).map((page) => ({ id: page.id, title: page.name, status: page.status, updatedAt: page.updatedAt, action: 'View live page', href: page.slug }))
  ].slice(0, 6)

  if (!session) {
    return (
      <div className="stack-xl page-remix">
        <section className="section-card centered-card page-remix__hero">
          <div>
            <span className="eyebrow">Customer dashboard</span>
            <h1>Open your generator workspace</h1>
            <p className="section-intro">Enter the checkout email used for your paid plan to load your dashboard, workspace settings, and saved previews.</p>
          </div>
          <form className="preview-form" onSubmit={handleAccessRequest} noValidate style={{ width: 'min(460px, 100%)' }}>
            <label className="field"><span>Checkout email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" /></label>
            <div className="hero__actions">
              <button className="button button--primary" type="submit" disabled={busy}>{busy ? 'Opening...' : 'Open dashboard'}</button>
              <Link className="button button--ghost" to="/pricing">View plans</Link>
            </div>
            {error ? <p className="form-error">{error}</p> : null}
          </form>
        </section>
      </div>
    )
  }

  return (
    <div className="customer-dashboard customer-dashboard--premium">
      <Toast state={toast} />
      <aside className="customer-dashboard__sidebar">
        <div className="customer-dashboard__brand">
          <div className="customer-dashboard__brand-mark"><BrandWireframe size={28} /></div>
          <div>
            <strong>Site Studio</strong>
            <span>{SITE_DISPLAY_NAME}</span>
            <small>Voice synthesis terminal</small>
          </div>
        </div>
        <nav className="customer-dashboard__nav" aria-label="Dashboard navigation">
          {PANEL_ORDER.map((panel) => (
            <button key={panel} type="button" className={`customer-dashboard__nav-item${activePanel === panel ? ' customer-dashboard__nav-item--active' : ''}`} onClick={() => setActivePanel(panel)}>{PANEL_LABELS[panel]}</button>
          ))}
        </nav>
        <div className="customer-dashboard__account">
          <div className="customer-dashboard__avatar">{account.email.slice(0, 2).toUpperCase()}</div>
          <div><strong>{account.email}</strong><span>{account.entitlements?.length ? `${account.entitlements.length} active plan${account.entitlements.length === 1 ? '' : 's'}` : 'Workspace access'}</span></div>
        </div>
      </aside>

      <div className="customer-dashboard__content">
        <header className="customer-dashboard__header customer-dashboard__header--premium">
          <div>
            <span className="eyebrow">Voice builder command</span>
            <h1>{PANEL_LABELS[activePanel]}</h1>
            <p className="section-intro">{activePanel === 'dashboard' ? 'Manage your VoiceToWebsite workspace, customer access, and generated assets.' : `Control your ${PANEL_LABELS[activePanel].toLowerCase()} without leaving the live site.`}</p>
            <div className="customer-dashboard__protocols">
              <span>Operator: {account.email}</span>
              <span>Entitlements: {account.entitlements?.length ?? 0}</span>
              <span>Site: {SITE_DOMAIN}</span>
            </div>
          </div>
          <div className="hero__actions">
            <button className="button button--ghost" type="button" onClick={openSitePreview}>Preview site</button>
            <button className="button button--primary" type="button" onClick={handlePublishState}>Live production</button>
          </div>
        </header>

        {activePanel === 'dashboard' ? <div className="customer-dashboard__panel">
          <section className="customer-dashboard__stats">{stats.map((stat) => <article key={stat.label} className="customer-dashboard__stat"><span>{stat.label}</span><strong>{stat.value}</strong><p>{stat.detail}</p></article>)}</section>
          <section className="customer-dashboard__section">
            <div className="section-heading section-heading--open"><div><span className="eyebrow">Quick actions</span><h2>Use the dashboard like a real customer workspace</h2></div></div>
            <div className="customer-dashboard__action-grid">
              <button type="button" className="customer-dashboard__action" onClick={() => setActivePanel('generator')}><strong>Open generator</strong><span>Build a new site preview with your saved access.</span></button>
              <button type="button" className="customer-dashboard__action" onClick={() => setActivePanel('pages')}><strong>Plan pages</strong><span>Save page blueprints and review live routes.</span></button>
              <button type="button" className="customer-dashboard__action" onClick={() => setActivePanel('media')}><strong>Upload media</strong><span>Add brand images directly into this workspace.</span></button>
              <button type="button" className="customer-dashboard__action" onClick={() => setActivePanel('design')}><strong>Brand profile</strong><span>Store palette and typography defaults for future builds.</span></button>
              <button type="button" className="customer-dashboard__action" onClick={openDashboardUrl}><strong>Copy access link</strong><span>Copy the secure dashboard URL tied to your account.</span></button>
            </div>
          </section>
          <section className="customer-dashboard__section customer-dashboard__section--split">
            <div className="customer-dashboard__surface customer-dashboard__surface--accent">
              <span className="eyebrow">Recent workspace activity</span><h2>Pages, previews, and live routes</h2>
              <div className="customer-dashboard__rows">{recentEntries.map((entry) => <div key={entry.id} className="customer-dashboard__row"><div><strong>{entry.title}</strong><span>{entry.status}</span></div><div className="customer-dashboard__row-meta"><span>{formatRelative(entry.updatedAt)}</span>{entry.href ? <Link className="button button--ghost" to={entry.href}>Open</Link> : <button type="button" className="button button--ghost" onClick={() => setActivePanel('generator')}>{entry.action}</button>}</div></div>)}</div>
            </div>
            <div className="customer-dashboard__surface customer-dashboard__surface--accent">
              <span className="eyebrow">Account record</span><h2>Entitlements and purchase log</h2>
              <div className="tag-row">{(account.entitlements ?? []).map((item) => <span key={item} className="tag">{titleCase(item)}</span>)}</div>
              <div className="customer-dashboard__purchase-list">{(account.purchases ?? []).slice(0, 6).map((purchase) => <div key={purchase.transactionRef} className="customer-dashboard__purchase"><div><strong>{titleCase(purchase.offerSlug)}</strong><span>{purchase.provider.toUpperCase()} · {purchase.status.replaceAll('_', ' ')}</span></div><span>{formatDate(purchase.purchasedAt)}</span></div>)}</div>
              <div className="hero__actions"><button className="button button--ghost" type="button" onClick={handleSignOut}>Sign out</button></div>
            </div>
          </section>
        </div> : null}

        {activePanel === 'generator' ? <div className="customer-dashboard__panel"><WebsitePreviewStudio accountEmail={account.email} unrestricted onPreviewReady={(preview) => { if (!resolvedEmail) return; const nextWorkspace = addWorkspacePreview(resolvedEmail, preview); setWorkspace(nextWorkspace); showToast('Preview saved to your dashboard', '#37d39a') }} /></div> : null}

        {activePanel === 'pages' ? <div className="customer-dashboard__panel"><section className="customer-dashboard__section customer-dashboard__section--split"><div className="customer-dashboard__surface"><span className="eyebrow">Live pages</span><h2>Routes currently published on the site</h2><div className="customer-dashboard__rows">{livePages.map((page) => <div key={page.id} className="customer-dashboard__row"><div><strong>{page.name}</strong><span>{page.slug}</span></div><div className="customer-dashboard__row-meta"><span>{page.updatedAt ? formatDate(page.updatedAt) : 'Live now'}</span><Link className="button button--ghost" to={page.slug}>View</Link></div></div>)}</div></div><div className="customer-dashboard__surface"><span className="eyebrow">Workspace page drafts</span><h2>Save page ideas before building them</h2><div className="customer-dashboard__form-row"><input type="text" value={newDraftName} onChange={(event) => setNewDraftName(event.target.value)} placeholder="Example: Roofing financing page" /><button className="button button--primary" type="button" onClick={handleAddDraft}>Add draft</button></div><div className="customer-dashboard__rows">{(workspace?.drafts ?? []).map((draft) => <div key={draft.id} className="customer-dashboard__row"><div><strong>{draft.name}</strong><span>{draft.slug} · {draft.status}</span></div><div className="customer-dashboard__row-meta"><span>{formatRelative(draft.updatedAt)}</span><button className="button button--ghost" type="button" onClick={() => handleRemoveDraft(draft.id)}>Remove</button></div></div>)}{!workspace?.drafts?.length ? <p className="field-note">No workspace drafts yet. Add a page idea and it will stay saved to this dashboard.</p> : null}</div></div></section></div> : null}

        {activePanel === 'design' ? <div className="customer-dashboard__panel"><section className="customer-dashboard__section customer-dashboard__section--split"><div className="customer-dashboard__surface"><span className="eyebrow">Typography and layout</span><h2>Brand defaults for generated sites</h2><div className="customer-dashboard__settings-grid"><label className="field"><span>Heading font</span><select value={designDraft?.headingFont ?? 'DM Sans'} onChange={(event) => setDesignDraft((current) => ({ ...current, headingFont: event.target.value }))}><option>DM Sans</option><option>Inter</option><option>Space Grotesk</option><option>Playfair Display</option></select></label><label className="field"><span>Body font</span><select value={designDraft?.bodyFont ?? 'DM Sans'} onChange={(event) => setDesignDraft((current) => ({ ...current, bodyFont: event.target.value }))}><option>DM Sans</option><option>Inter</option><option>System UI</option></select></label><label className="field"><span>Content width</span><input type="range" min="960" max="1440" step="20" value={designDraft?.contentWidth ?? 1100} onChange={(event) => setDesignDraft((current) => ({ ...current, contentWidth: Number(event.target.value) }))} /><span className="field-note">{designDraft?.contentWidth ?? 1100}px</span></label><label className="field"><span>Border radius</span><input type="range" min="0" max="28" step="1" value={designDraft?.borderRadius ?? 18} onChange={(event) => setDesignDraft((current) => ({ ...current, borderRadius: Number(event.target.value) }))} /><span className="field-note">{designDraft?.borderRadius ?? 18}px</span></label></div></div><div className="customer-dashboard__surface"><span className="eyebrow">Brand palette</span><h2>Theme values matched to VoiceToWebsite</h2><div className="customer-dashboard__palette">{[['primary', 'Primary'], ['accent', 'Accent'], ['background', 'Background'], ['surface', 'Surface'], ['text', 'Text'], ['muted', 'Muted']].map(([key, label]) => <label key={key} className="customer-dashboard__color-field"><span>{label}</span><input type="color" value={designDraft?.palette?.[key] ?? theme.palette?.accent ?? '#6ed8ff'} onChange={(event) => setDesignDraft((current) => ({ ...current, palette: { ...(current?.palette ?? {}), [key]: event.target.value } }))} /></label>)}</div><div className="hero__actions"><button className="button button--primary" type="button" onClick={handleDesignSave}>Save brand defaults</button></div></div></section></div> : null}

        {activePanel === 'media' ? <div className="customer-dashboard__panel"><section className="customer-dashboard__section"><div className="section-heading section-heading--open"><div><span className="eyebrow">Workspace media</span><h2>Upload brand assets and review preview credits</h2></div><div className="hero__actions"><input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleMediaUpload} /><button className="button button--primary" type="button" onClick={() => fileInputRef.current?.click()}>Upload image</button></div></div><div className="customer-dashboard__media-grid">{(workspace?.media ?? []).map((asset) => <article key={asset.id} className="customer-dashboard__media-card"><div className="customer-dashboard__media-preview"><img src={asset.dataUrl} alt={asset.name} /></div><div className="customer-dashboard__media-copy"><strong>{asset.name}</strong><span>{Math.round(asset.size / 1024)} KB</span></div><button className="button button--ghost" type="button" onClick={() => handleRemoveMedia(asset.id)}>Remove</button></article>)}{(workspace?.previews?.[0]?.mediaAttribution ?? []).map((item, index) => <article key={`${item.url}-${index}`} className="customer-dashboard__media-card customer-dashboard__media-card--credit"><div className="customer-dashboard__media-preview customer-dashboard__media-preview--credit"><BrandWireframe size={22} /></div><div className="customer-dashboard__media-copy"><strong>{item.provider}</strong><span>Used in the latest generated preview</span></div><a className="button button--ghost" href={item.pageUrl ?? item.url} target="_blank" rel="noreferrer">Open source</a></article>)}</div></section></div> : null}

        {activePanel === 'settings' ? <div className="customer-dashboard__panel"><section className="customer-dashboard__section customer-dashboard__section--split"><div className="customer-dashboard__surface"><span className="eyebrow">Workspace settings</span><h2>Defaults applied to future generated builds</h2><div className="customer-dashboard__settings-grid"><label className="field"><span>Site title</span><input type="text" value={settingsDraft?.siteTitle ?? ''} onChange={(event) => setSettingsDraft((current) => ({ ...current, siteTitle: event.target.value }))} /></label><label className="field"><span>Tagline</span><input type="text" value={settingsDraft?.tagline ?? ''} onChange={(event) => setSettingsDraft((current) => ({ ...current, tagline: event.target.value }))} /></label><label className="field"><span>Favicon URL</span><input type="url" value={settingsDraft?.faviconUrl ?? ''} onChange={(event) => setSettingsDraft((current) => ({ ...current, faviconUrl: event.target.value }))} placeholder="https://..." /></label><label className="field field--full"><span>Meta description</span><textarea rows={3} value={settingsDraft?.metaDescription ?? ''} onChange={(event) => setSettingsDraft((current) => ({ ...current, metaDescription: event.target.value }))} /></label><label className="field field--full"><span>Head injection</span><textarea rows={4} value={settingsDraft?.headInjection ?? ''} onChange={(event) => setSettingsDraft((current) => ({ ...current, headInjection: event.target.value }))} placeholder="<!-- Analytics or verification tags -->" /></label></div></div><div className="customer-dashboard__surface"><span className="eyebrow">Operational controls</span><h2>Account actions</h2><div className="customer-dashboard__rows"><div className="customer-dashboard__row"><div><strong>Search indexing</strong><span>{settingsDraft?.allowIndexing ? 'Allowed for generated builds' : 'Disabled for generated builds'}</span></div><button className={`customer-dashboard__toggle${settingsDraft?.allowIndexing ? ' customer-dashboard__toggle--active' : ''}`} type="button" onClick={() => setSettingsDraft((current) => ({ ...current, allowIndexing: !current.allowIndexing }))}><span /></button></div><div className="customer-dashboard__row"><div><strong>Dashboard URL</strong><span>{session.dashboardUrl}</span></div><button className="button button--ghost" type="button" onClick={openDashboardUrl}>Copy</button></div><div className="customer-dashboard__row"><div><strong>Sign out of this browser</strong><span>Clears the saved dashboard token from local storage.</span></div><button className="button button--ghost" type="button" onClick={handleSignOut}>Sign out</button></div></div><div className="hero__actions"><button className="button button--primary" type="button" onClick={handleSettingsSave}>Save settings</button></div></div></section></div> : null}
      </div>
    </div>
  )
}
