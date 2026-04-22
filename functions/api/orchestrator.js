import { buildProductSectionHtml, enforceLimit } from '../../api/paywall.js'
import { errorJson, json, readJsonBody } from '../_lib/http.js'

export async function onRequestPost({ request }) {
  const payload = (await readJsonBody(request)) ?? {}
  const gate = enforceLimit(payload)

  if (gate.blocked) {
    return json(gate, { status: 402 })
  }

  const command = String(payload.command ?? '').trim()
  if (!command) {
    return errorJson('A command is required.', 400)
  }

  if (command.toLowerCase().includes('create product')) {
    return json({
      success: true,
      action: 'create_product',
      productSectionHtml: buildProductSectionHtml(),
      commandsUsed: gate.nextCommandsUsed,
      plan: gate.plan
    })
  }

  return json({
    success: true,
    action: 'apply',
    commandsUsed: gate.nextCommandsUsed,
    plan: gate.plan
  })
}
