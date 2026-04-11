import { z } from 'zod'

export const SiteEventSchema = z.object({
  event: z.string().min(1).max(100),
  path: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional()
})

export const LeadCaptureSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200).optional(),
  phone: z.string().max(50).optional(),
  company: z.string().max(200).optional(),
  message: z.string().max(2000).optional(),
  source: z.string().max(100).optional()
})

export const CheckoutSchema = z.object({
  offerSlug: z.string().min(1).max(100)
})

export const CommandSchema = z.object({
  command: z.string().min(1).max(5000).optional(),
  action: z.string().min(1).max(100).optional()
}).refine(data => data.command || data.action, {
  message: 'Either command or action must be provided'
})

export const StripeSuccessSchema = z.object({
  session_id: z.string().min(1)
})

export const PayPalSuccessSchema = z.object({
  token: z.string().min(1)
})
