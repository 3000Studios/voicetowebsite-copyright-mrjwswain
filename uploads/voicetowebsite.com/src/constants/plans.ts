export const PLAN_LIMITS = {
  free: {
    name: 'Free Access',
    commands: 1,
    sites: 1,
    export: false,
    watermark: true,
    price: 0,
    description: 'Try the demo with 1 free build. Upgrade to publish and connect a custom domain.'
  },
  starter: {
    name: 'Starter',
    commands: 10,
    sites: 3,
    export: false,
    watermark: true,
    price: 15,
    description: 'For individuals. 3 sites, watermarked, standard support. Monthly or annual billing.'
  },
  pro: {
    name: 'Pro',
    commands: 50,
    sites: 15,
    export: true,
    watermark: false,
    price: 39,
    description: 'For professionals. 15 sites, custom domains, GitHub export, no watermark.'
  },
  enterprise: {
    name: 'Enterprise',
    commands: Number.MAX_SAFE_INTEGER,
    sites: Number.MAX_SAFE_INTEGER,
    export: true,
    watermark: false,
    price: 99,
    description: 'For agencies. Unlimited sites, white-label, priority support.'
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
