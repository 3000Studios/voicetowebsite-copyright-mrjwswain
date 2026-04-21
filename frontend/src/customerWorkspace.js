const KEY_PREFIX = 'voicetowebsite.customer.workspace'

function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase()
}

function storageKey(email) {
  return `${KEY_PREFIX}:${normalizeEmail(email)}`
}

function createId(prefix = 'item') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function defaultWorkspace(email) {
  return {
    email: normalizeEmail(email),
    drafts: [],
    media: [],
    previews: [],
    design: {
      headingFont: 'DM Sans',
      bodyFont: 'DM Sans',
      contentWidth: 1100,
      borderRadius: 18,
      sectionSpacing: 'normal',
      headerStyle: 'centered',
      palette: {
        primary: '#6ed8ff',
        accent: '#8bc4ff',
        background: '#06111f',
        surface: '#0f2136',
        text: '#ecf6ff',
        muted: '#9bb7cb'
      }
    },
    settings: {
      siteTitle: 'VoiceToWebsite Workspace',
      tagline: 'Voice-first website builds',
      faviconUrl: '',
      metaDescription: '',
      allowIndexing: true,
      headInjection: ''
    },
    updatedAt: null
  }
}

export function readCustomerWorkspace(email) {
  if (typeof window === 'undefined') {
    return defaultWorkspace(email)
  }

  const normalized = normalizeEmail(email)
  if (!normalized) {
    return defaultWorkspace(email)
  }

  const raw = window.localStorage.getItem(storageKey(normalized))
  if (!raw) {
    return defaultWorkspace(normalized)
  }

  try {
    const parsed = JSON.parse(raw)
    return {
      ...defaultWorkspace(normalized),
      ...parsed,
      design: {
        ...defaultWorkspace(normalized).design,
        ...(parsed.design ?? {}),
        palette: {
          ...defaultWorkspace(normalized).design.palette,
          ...(parsed.design?.palette ?? {})
        }
      },
      settings: {
        ...defaultWorkspace(normalized).settings,
        ...(parsed.settings ?? {})
      },
      drafts: Array.isArray(parsed.drafts) ? parsed.drafts : [],
      media: Array.isArray(parsed.media) ? parsed.media : [],
      previews: Array.isArray(parsed.previews) ? parsed.previews : []
    }
  } catch {
    return defaultWorkspace(normalized)
  }
}

export function saveCustomerWorkspace(email, workspace) {
  if (typeof window === 'undefined') {
    return
  }

  const normalized = normalizeEmail(email)
  if (!normalized) {
    return
  }

  window.localStorage.setItem(
    storageKey(normalized),
    JSON.stringify({
      ...workspace,
      email: normalized,
      updatedAt: new Date().toISOString()
    })
  )
}

export function updateCustomerWorkspace(email, updater) {
  const current = readCustomerWorkspace(email)
  const next = typeof updater === 'function' ? updater(current) : updater
  saveCustomerWorkspace(email, next)
  return next
}

export function addWorkspaceDraft(email, draft) {
  return updateCustomerWorkspace(email, (workspace) => ({
    ...workspace,
    drafts: [
      {
        id: createId('draft'),
        name: draft.name,
        slug: draft.slug,
        status: draft.status ?? 'Draft blueprint',
        updatedAt: new Date().toISOString()
      },
      ...(workspace.drafts ?? [])
    ].slice(0, 20)
  }))
}

export function removeWorkspaceDraft(email, draftId) {
  return updateCustomerWorkspace(email, (workspace) => ({
    ...workspace,
    drafts: (workspace.drafts ?? []).filter((item) => item.id !== draftId)
  }))
}

export function addWorkspacePreview(email, preview) {
  return updateCustomerWorkspace(email, (workspace) => ({
    ...workspace,
    previews: [
      {
        id: preview.requestId ?? createId('preview'),
        title: preview.title,
        summary: preview.summary,
        qualityScore: preview.qualityScore ?? null,
        recommendedOfferSlug: preview.recommendedOfferSlug ?? null,
        mediaAttribution: Array.isArray(preview.media?.attribution) ? preview.media.attribution : [],
        createdAt: new Date().toISOString()
      },
      ...(workspace.previews ?? []).filter((item) => item.id !== preview.requestId)
    ].slice(0, 12)
  }))
}

export function addWorkspaceMedia(email, asset) {
  return updateCustomerWorkspace(email, (workspace) => ({
    ...workspace,
    media: [
      {
        id: createId('media'),
        name: asset.name,
        type: asset.type,
        size: asset.size,
        dataUrl: asset.dataUrl,
        createdAt: new Date().toISOString()
      },
      ...(workspace.media ?? [])
    ].slice(0, 24)
  }))
}

export function removeWorkspaceMedia(email, assetId) {
  return updateCustomerWorkspace(email, (workspace) => ({
    ...workspace,
    media: (workspace.media ?? []).filter((item) => item.id !== assetId)
  }))
}
