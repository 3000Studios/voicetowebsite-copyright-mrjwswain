export const PLAN_LIMITS = {
  free: {
    name: 'Free Access',
    commands: 5,
    sites: 1,
    export: false,
    watermark: true,
    price: 0,
    description: 'Initial access for testing neural vocal frequencies.'
  },
  starter: {
    name: 'Neural Starter',
    commands: 25,
    sites: 3,
    export: false,
    watermark: true,
    price: 9.99,
    description: 'Subscription — 30 days of access. Billed every 31 days. Build and publish up to 3 sites.'
  },
  pro: {
    name: 'Neural Pro',
    commands: 100,
    sites: 10,
    export: true,
    watermark: false,
    price: 19.99,
    description: 'Subscription — 30 days of access. Billed every 31 days. Build, export, and publish up to 10 sites.'
  },
  boss: {
    name: 'Boss Package',
    commands: Number.MAX_SAFE_INTEGER,
    sites: Number.MAX_SAFE_INTEGER,
    export: true,
    watermark: false,
    price: 49.99,
    description: 'Subscription — 30 days of access. Billed every 31 days. Unlimited builds + unlimited sites.'
  },
  commands: {
    name: 'Extra Commands Pack',
    commands: 5,
    sites: 0,
    export: false,
    watermark: false,
    price: 2.99,
    description: 'One-time — adds 5 more commands instantly. Repeat anytime.'
  },
};

export type PlanType = keyof typeof PLAN_LIMITS;
