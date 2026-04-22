export const LIMITS = {
  free: 5,
  pro: 100,
  elite: Number.POSITIVE_INFINITY
}

export function normalizePlan(value) {
  const plan = String(value ?? 'free').trim().toLowerCase()
  return Object.prototype.hasOwnProperty.call(LIMITS, plan) ? plan : 'free'
}

export function enforceLimit(user = {}) {
  const plan = normalizePlan(user.plan)
  const commandsUsed = Number(user.commandsUsed ?? 0)
  const allowed = LIMITS[plan]

  if (commandsUsed >= allowed) {
    return {
      blocked: true,
      error: 'PAYWALL_TRIGGERED',
      message: 'Free limit reached',
      upgrade: '/pricing.html',
      commandsUsed,
      plan
    }
  }

  return {
    blocked: false,
    commandsUsed,
    nextCommandsUsed: commandsUsed + 1,
    plan
  }
}

export function buildProductSectionHtml({
  title = 'Product',
  price = '$49',
  ctaHref = '/checkout.html',
  ctaLabel = 'Buy Now'
} = {}) {
  return `
    <section class="vtw-product-section">
      <h2>${title}</h2>
      <p>${price}</p>
      <a href="${ctaHref}"><button>${ctaLabel}</button></a>
    </section>
  `.trim()
}
