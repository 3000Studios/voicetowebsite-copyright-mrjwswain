export type PlanType = "free" | "starter" | "pro" | "enterprise" | "commands";

export interface PlanEntitlements {
  key: PlanType;
  name: string;
  description: string;
  price: number;
  commandsPerCycle: number;
  hostedSites: number;
  canExportCode: boolean;
  removeWatermark: boolean;
  premiumSections: boolean;
}

export const PLAN_ENTITLEMENTS: Record<PlanType, PlanEntitlements> = {
  free: {
    key: "free",
    name: 'Free Access',
    commandsPerCycle: 1,
    hostedSites: 1,
    canExportCode: false,
    removeWatermark: false,
    premiumSections: false,
    price: 0,
    description: 'Try the demo with one free build before moving into a paid hosted delivery plan.',
  },
  starter: {
    key: "starter",
    name: 'Starter',
    commandsPerCycle: 50,
    hostedSites: 3,
    canExportCode: false,
    removeWatermark: true,
    premiumSections: false,
    price: 9.99,
    description: 'Solo operators: hosted starter site, 50 monthly commands, and a simple launch workflow.',
  },
  pro: {
    key: "pro",
    name: 'Pro',
    commandsPerCycle: 150,
    hostedSites: 15,
    canExportCode: true,
    removeWatermark: true,
    premiumSections: true,
    price: 19.99,
    description: 'Consultants and small teams: more build volume, exports, premium sections, and a cleaner handoff.',
  },
  enterprise: {
    key: "enterprise",
    name: 'Elite',
    commandsPerCycle: 500,
    hostedSites: 50,
    canExportCode: true,
    removeWatermark: true,
    premiumSections: true,
    price: 49.99,
    description: 'Agencies and operators launching multiple client or portfolio sites with 500 monthly commands.',
  },
  commands: {
    key: "commands",
    name: 'More Commands',
    commandsPerCycle: 25,
    hostedSites: 0,
    canExportCode: false,
    removeWatermark: false,
    premiumSections: false,
    price: 2.99,
    description: 'One-time add-on for existing users who need more commands without changing plans.',
  },
} as const;

export const PLAN_LIMITS = PLAN_ENTITLEMENTS;

export const isUnlimited = (value: number) => value === Number.MAX_SAFE_INTEGER;

// DISABLED 2026-05-15. These were pre-created Stripe Payment Links at OLD prices
// ($39 Pro / $99 Enterprise). The dynamic /api/create-checkout-session was
// silently falling back to them and overcharging customers. The dynamic flow now
// uses inline price_data at the locked $9.99/$19.99/$49.99 amounts. If the
// dynamic flow ever fails we want a real error, not a wrong-price charge.
export const STRIPE_PAYMENT_LINKS: Record<Exclude<PlanType, 'free'>, { month: string; year?: string }> = {
  starter: { month: '', year: '' },
  pro: { month: '', year: '' },
  enterprise: { month: '', year: '' },
  commands: { month: '' },
};
