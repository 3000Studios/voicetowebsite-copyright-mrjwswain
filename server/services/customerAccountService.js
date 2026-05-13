import crypto from 'node:crypto'
import { readSystemDocument, writeSystemDocument } from './contentService.js'

const DEFAULT_CUSTOMER_ACCOUNTS = {
  accounts: [],
  updatedAt: null
}

function nowIso() {
  return new Date().toISOString()
}

function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase()
}

function buildInviteToken() {
  return crypto.randomBytes(24).toString('base64url')
}

export async function provisionCustomerAccountFromPayment(payment) {
  const email = normalizeEmail(payment?.customerEmail)
  if (!email) {
    return null
  }

  const payload = await readSystemDocument('customer-accounts.json', DEFAULT_CUSTOMER_ACCOUNTS)
  const accounts = payload.accounts ?? []
  const existingIndex = accounts.findIndex((entry) => normalizeEmail(entry.email) === email)
  const entitlement = String(payment.offerSlug ?? '').trim()
  const transactionRef = `${payment.provider ?? 'unknown'}:${payment.transactionId ?? 'unknown'}`

  if (existingIndex >= 0) {
    const account = accounts[existingIndex]
    const entitlements = new Set(account.entitlements ?? [])
    if (entitlement) {
      entitlements.add(entitlement)
    }
    const purchases = Array.isArray(account.purchases) ? account.purchases : []
    if (!purchases.find((entry) => entry.transactionRef === transactionRef)) {
      purchases.unshift({
        transactionRef,
        provider: payment.provider ?? 'unknown',
        offerSlug: entitlement || null,
        amountCents: payment.amountCents ?? 0,
        currency: payment.currency ?? 'usd',
        purchasedAt: nowIso()
      })
    }

    accounts[existingIndex] = {
      ...account,
      entitlements: [...entitlements],
      purchases: purchases.slice(0, 200),
      updatedAt: nowIso()
    }
  } else {
    accounts.unshift({
      email,
      accountStatus: 'invited',
      inviteToken: buildInviteToken(),
      entitlements: entitlement ? [entitlement] : [],
      purchases: [
        {
          transactionRef,
          provider: payment.provider ?? 'unknown',
          offerSlug: entitlement || null,
          amountCents: payment.amountCents ?? 0,
          currency: payment.currency ?? 'usd',
          purchasedAt: nowIso()
        }
      ],
      createdAt: nowIso(),
      updatedAt: nowIso()
    })
  }

  await writeSystemDocument('customer-accounts.json', {
    accounts: accounts.slice(0, 5000),
    updatedAt: nowIso()
  })

  return {
    email,
    accountStatus: existingIndex >= 0 ? 'updated' : 'invited'
  }
}
