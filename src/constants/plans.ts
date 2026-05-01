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
    commandsPerCycle: 10,
    hostedSites: 3,
    canExportCode: false,
    removeWatermark: true,
    premiumSections: false,
    price: 15,
    description: 'For solo operators who need a hosted starter site, a clean handoff, and a simple launch workflow.',
  },
  pro: {
    key: "pro",
    name: 'Pro',
    commandsPerCycle: 50,
    hostedSites: 15,
    canExportCode: true,
    removeWatermark: true,
    premiumSections: true,
    price: 39,
    description: 'For consultants and small teams that need more build volume, exports, and a cleaner handoff.',
  },
  enterprise: {
    key: "enterprise",
    name: 'Enterprise',
    commandsPerCycle: Number.MAX_SAFE_INTEGER,
    hostedSites: Number.MAX_SAFE_INTEGER,
    canExportCode: true,
    removeWatermark: true,
    premiumSections: true,
    price: 99,
    description: 'For agencies and operators launching multiple client or portfolio sites from one account.',
  },
  commands: {
    key: "commands",
    name: 'Extra Commands Pack',
    commandsPerCycle: 5,
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

export const STRIPE_PAYMENT_LINKS: Record<Exclude<PlanType, 'free'>, { month: string; year?: string }> = {
  starter: {
    month: 'https://buy.stripe.com/9B65kD2Kx5mK5le8nUbAs0u',
    year: 'https://buy.stripe.com/28E5kD70N02q7tm8nUbAs0v',
  },
  pro: {
    month: 'https://buy.stripe.com/dRmfZhbh35mK2927jQbAs0w',
    year: 'https://buy.stripe.com/4gM00j3OB6qO9BudIebAs0x',
  },
  enterprise: {
    month: 'https://buy.stripe.com/bJe7sLetfcPcdRK1ZwbAs0y',
    year: 'https://buy.stripe.com/dRm00jacZ4iG9Bu0VsbAs0z',
  },
  commands: {
    month: 'https://buy.stripe.com/fZubJ12Kx02q9Bu6fMbAs0A',
  },
};
