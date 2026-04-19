import crypto from 'node:crypto'
import { readSystemDocument, writeSystemDocument } from './contentService.js'

const MAX_ROWS = 1000

function nowIso() {
  return new Date().toISOString()
}

function buildId(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`
}

function ensureArray(value) {
  return Array.isArray(value) ? value : []
}

async function readTable(fileName) {
  return readSystemDocument(fileName, { rows: [], updatedAt: null, schemaVersion: 1 })
}

async function writeTable(fileName, payload) {
  await writeSystemDocument(fileName, {
    ...payload,
    updatedAt: nowIso()
  })
}

function upsertByKey(rows, key, entry) {
  const index = rows.findIndex((row) => row?.[key] === entry?.[key])
  if (index >= 0) {
    rows[index] = { ...rows[index], ...entry }
    return rows
  }
  return [entry, ...rows]
}

export async function recordGenerationRequest(request) {
  const table = await readTable('generation_requests.json')
  const entry = {
    id: buildId('genreq'),
    requestId: request.id,
    email: request.email ?? '',
    brief: request.brief ?? '',
    websiteType: request.websiteType ?? 'saas',
    styleTone: request.styleTone ?? 'cinematic',
    audience: request.audience ?? '',
    primaryCta: request.primaryCta ?? '',
    status: request.status ?? 'preview_ready',
    createdAt: request.createdAt ?? nowIso()
  }
  const rows = upsertByKey(ensureArray(table.rows), 'requestId', entry).slice(0, MAX_ROWS)
  await writeTable('generation_requests.json', { ...table, rows })
  return entry
}

export async function recordGeneratedPage(request, previewDocument) {
  const table = await readTable('generated_pages.json')
  const entry = {
    id: buildId('genpage'),
    requestId: request.id,
    slug: request.slug,
    title: request.title,
    html: previewDocument.html,
    seoKeywords: previewDocument.seoKeywords ?? [],
    createdAt: request.createdAt ?? nowIso()
  }
  const rows = upsertByKey(ensureArray(table.rows), 'requestId', entry).slice(0, MAX_ROWS)
  await writeTable('generated_pages.json', { ...table, rows })
  return entry
}

export async function recordMediaAssets(request, media) {
  const table = await readTable('media_assets.json')
  const entry = {
    id: buildId('media'),
    requestId: request.id,
    heroVideo: media?.heroVideo ?? null,
    gallery: media?.gallery ?? [],
    attribution: media?.attribution ?? [],
    createdAt: request.createdAt ?? nowIso()
  }
  const rows = upsertByKey(ensureArray(table.rows), 'requestId', entry).slice(0, MAX_ROWS)
  await writeTable('media_assets.json', { ...table, rows })
  return entry
}

export async function recordQualityMetrics(request, quality) {
  const table = await readTable('quality_metrics.json')
  const entry = {
    id: buildId('quality'),
    requestId: request.id,
    total: quality?.total ?? null,
    metrics: quality?.metrics ?? {},
    createdAt: request.createdAt ?? nowIso()
  }
  const rows = upsertByKey(ensureArray(table.rows), 'requestId', entry).slice(0, MAX_ROWS)
  await writeTable('quality_metrics.json', { ...table, rows })
  return entry
}

