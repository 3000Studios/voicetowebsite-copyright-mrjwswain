import { z } from 'zod'

export const SiteEventSchema = z.object({
  type: z.string().min(1).max(100),
  path: z.string().max(500).optional(),
  sessionId: z.string().max(200).optional(),
  referrer: z.string().max(1000).optional(),
  metadata: z.record(z.unknown()).optional()
})

export const LeadCaptureSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200).optional(),
  phone: z.string().max(50).optional(),
  company: z.string().max(200).optional(),
  interest: z.string().max(200).optional(),
  notes: z.string().max(4000).optional(),
  message: z.string().max(2000).optional(),
  source: z.string().max(100).optional()
})

export const AdminLoginSchema = z.object({
  email: z.string().email(),
  passcode: z.string().min(1).max(100)
})

export const CheckoutSchema = z.object({
  offerSlug: z.string().min(1).max(100),
  customerEmail: z.string().email().optional(),
  previewRequestId: z.string().min(1).max(200).optional()
})

export const PreviewStudioSchema = z.object({
  email: z.string().email(),
  brief: z.string().min(20).max(3000),
  audience: z.string().min(2).max(200).optional(),
  websiteType: z.enum(['saas', 'local_service', 'creator', 'ecommerce']).optional(),
  styleTone: z.string().min(2).max(100).optional(),
  primaryCta: z.string().min(2).max(120).optional()
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
