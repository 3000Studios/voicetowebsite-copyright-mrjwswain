export const PLAN_LIMITS = {
  free: {
    name: 'Free Access',
    commands: 1,
    sites: 1,
    export: false,
    watermark: true,
    price: 0,
    description: 'Try the demo with one free build before moving into a paid hosted delivery plan.',
  },
  starter: {
    name: 'Starter',
    commands: 10,
    sites: 3,
    export: false,
    watermark: true,
    price: 15,
    description: 'For solo operators who need a hosted starter site and a simple launch workflow.',
  },
  pro: {
    name: 'Pro',
    commands: 50,
    sites: 15,
    export: true,
    watermark: false,
    price: 39,
    description: 'For consultants and small teams that need more build volume, exports, and a cleaner handoff.',
  },
  enterprise: {
    name: 'Enterprise',
    commands: Number.MAX_SAFE_INTEGER,
    sites: Number.MAX_SAFE_INTEGER,
    export: true,
    watermark: false,
    price: 99,
    description: 'For agencies and operators launching multiple client or portfolio sites from one account.',
  },
  commands: {
    name: 'Extra Commands Pack',
    commands: 5,
    sites: 0,
    export: false,
    watermark: false,
    price: 2.99,
    description: 'One-time add-on for existing users who need more commands without changing plans.',
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

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
