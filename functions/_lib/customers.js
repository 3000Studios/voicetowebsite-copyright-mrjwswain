import crypto from 'node:crypto'
import { getJson, hash, putJson } from './storage.js'

function nowIso() {
  return new Date().toISOString()
}

export function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase()
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value))
}

function buildAccessToken() {
  return crypto.randomBytes(24).toString('base64url')
}

function buildPurchaseRef(provider, offerSlug, source = 'checkout_started') {
  return `${provider}:${offerSlug}:${source}`
}

function sanitizeAccount(account) {
  if (!account) {
    return null
  }

  return {
    email: account.email,
    accountStatus: account.accountStatus ?? 'active',
    entitlements: Array.isArray(account.entitlements) ? account.entitlements : [],
    purchases: Array.isArray(account.purchases) ? account.purchases : [],
    generationCount: Number(account.generationCount ?? 0),
    lastPreviewAt: account.lastPreviewAt ?? null,
    createdAt: account.createdAt ?? null,
    updatedAt: account.updatedAt ?? null
  }
}

function emailKey(email) {
  return `customers/by-email/${hash(email)}.json`
}

function tokenKey(token) {
  return `customers/by-token/${token}.json`
}

export async function findCustomerByEmail(bucket, email) {
  const normalized = normalizeEmail(email)
  if (!bucket || !normalized) {
    return null
  }

  return getJson(bucket, emailKey(normalized))
}

export async function findCustomerByToken(bucket, token) {
  if (!bucket || !token) {
    return null
  }

  const lookup = await getJson(bucket, tokenKey(token))
  if (!lookup?.email) {
    return null
  }

  return findCustomerByEmail(bucket, lookup.email)
}

export async function upsertCustomerAccess(
  bucket,
  { email, offerSlug, provider, paymentLink, source = 'checkout_started' }
) {
  const normalized = normalizeEmail(email)
  if (!bucket || !normalized) {
    return null
  }

  const existing = (await findCustomerByEmail(bucket, normalized)) ?? null
  const accessToken = existing?.accessToken ?? buildAccessToken()
  const entitlements = new Set(existing?.entitlements ?? [])
  const purchases = Array.isArray(existing?.purchases) ? existing.purchases.slice(0, 199) : []
  const offer = String(offerSlug ?? '').trim()

  if (offer) {
    entitlements.add(offer)
    const transactionRef = buildPurchaseRef(provider ?? 'unknown', offer, source)
    if (!purchases.find((entry) => entry.transactionRef === transactionRef)) {
      purchases.unshift({
        transactionRef,
        provider: provider ?? 'unknown',
        offerSlug: offer,
        status: source,
        paymentLink: paymentLink ?? null,
        purchasedAt: nowIso()
      })
    }
  }

  const account = {
    email: normalized,
    accessToken,
    accountStatus: 'active',
    entitlements: [...entitlements],
    purchases,
    generationCount: Number(existing?.generationCount ?? 0),
    lastPreviewAt: existing?.lastPreviewAt ?? null,
    createdAt: existing?.createdAt ?? nowIso(),
    updatedAt: nowIso()
  }

  await putJson(bucket, emailKey(normalized), account)
  await putJson(bucket, tokenKey(accessToken), {
    email: normalized,
    updatedAt: nowIso()
  })

  return {
    account,
    accessToken,
    dashboardUrl: `https://voicetowebsite.com/dashboard?token=${encodeURIComponent(accessToken)}`
  }
}

export async function touchCustomerPreview(bucket, email, previewRequestId) {
  const existing = await findCustomerByEmail(bucket, email)
  if (!existing) {
    return null
  }

  const next = {
    ...existing,
    generationCount: Number(existing.generationCount ?? 0) + 1,
    lastPreviewAt: nowIso(),
    lastPreviewRequestId: previewRequestId ?? existing.lastPreviewRequestId ?? null,
    updatedAt: nowIso()
  }

  await putJson(bucket, emailKey(existing.email), next)
  await putJson(bucket, tokenKey(existing.accessToken), {
    email: existing.email,
    updatedAt: nowIso()
  })

  return sanitizeAccount(next)
}

export async function getCustomerSession(bucket, token) {
  const account = await findCustomerByToken(bucket, token)
  if (!account) {
    return null
  }

  return {
    accessToken: account.accessToken,
    dashboardUrl: `https://voicetowebsite.com/dashboard?token=${encodeURIComponent(account.accessToken)}`,
    account: sanitizeAccount(account)
  }
}

export async function requestCustomerAccess(bucket, email) {
  const account = await findCustomerByEmail(bucket, email)
  if (!account) {
    return null
  }

  return {
    accessToken: account.accessToken,
    dashboardUrl: `https://voicetowebsite.com/dashboard?token=${encodeURIComponent(account.accessToken)}`,
    account: sanitizeAccount(account)
  }
}
