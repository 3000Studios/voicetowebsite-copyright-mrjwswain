export interface Env {}

type PreviewCopyRequest = {
  prompt?: string;
  siteName?: string;
  businessType?: string;
  requestedStyle?: string;
};

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {}),
    },
  });
}

function pickBusinessType(prompt: string, hintedType?: string) {
  if (hintedType) return hintedType.toLowerCase();
  const text = prompt.toLowerCase();
  if (text.includes("salon") || text.includes("beauty")) return "salon";
  if (text.includes("gym") || text.includes("fitness")) return "gym";
  if (text.includes("coffee") || text.includes("cafe")) return "coffee";
  if (text.includes("restaurant") || text.includes("food")) return "restaurant";
  if (text.includes("law")) return "law";
  if (text.includes("real estate")) return "real-estate";
  return "business";
}

function pickToneLabel(style: string) {
  const text = style.toLowerCase();
  if (text.includes("luxury")) return "luxury";
  if (text.includes("minimal")) return "minimal";
  if (text.includes("bold")) return "bold";
  if (text.includes("warm")) return "warm";
  return "modern";
}

function buildCopy(siteName: string, businessType: string, tone: string) {
  const presets: Record<string, { hero: string; subhead: string; valueTitle: string; valueBody: string; cta: string; features: string[] }> = {
    salon: {
      hero: `${siteName} — Signature Beauty Experiences`,
      subhead: `A ${tone} salon landing page designed to turn first-time visitors into loyal clients.`,
      valueTitle: "Beauty Services That Sell Themselves",
      valueBody: "Showcase premium services, stylist expertise, and social proof in a structure built for bookings.",
      cta: "Book Your Appointment",
      features: ["Service menu", "Stylist spotlight", "Before/after gallery", "Booking call-to-action"],
    },
    gym: {
      hero: `${siteName} — Train Hard. Progress Faster.`,
      subhead: `A ${tone} fitness page built for trials, memberships, and class signups.`,
      valueTitle: "Conversion-First Fitness Layout",
      valueBody: "Lead with class schedules, coach credibility, and urgency offers that move visitors into action.",
      cta: "Start Your Membership",
      features: ["Programs and classes", "Trainer highlights", "Membership tiers", "Lead capture form"],
    },
    coffee: {
      hero: `${siteName} — Fresh Roasts, Crafted Daily`,
      subhead: `A ${tone} coffee brand experience with rich visuals and ordering-focused flow.`,
      valueTitle: "Menu + Story + Action",
      valueBody: "Blend product storytelling with menu highlights so customers browse less and order faster.",
      cta: "Order Now",
      features: ["Featured drinks", "Brand story", "Location and hours", "Order button"],
    },
    restaurant: {
      hero: `${siteName} — Elevated Dining Starts Here`,
      subhead: `A ${tone} restaurant page built to convert traffic into reservations.`,
      valueTitle: "Reservation-Oriented Sections",
      valueBody: "Present signature dishes, atmosphere, and trust markers that make booking the next step.",
      cta: "Reserve a Table",
      features: ["Signature menu", "Photo gallery", "Reservation action", "Social proof"],
    },
    "real-estate": {
      hero: `${siteName} — Properties That Move`,
      subhead: `A ${tone} real-estate layout crafted for listing inquiries and scheduled viewings.`,
      valueTitle: "Listings That Drive Leads",
      valueBody: "Feature high-intent listings, neighborhood context, and simple inquiry paths for faster close cycles.",
      cta: "Schedule a Tour",
      features: ["Featured listings", "Neighborhood highlights", "Agent profile", "Lead form"],
    },
    law: {
      hero: `${siteName} — Trusted Legal Guidance`,
      subhead: `A ${tone} legal services page focused on authority, clarity, and consultation requests.`,
      valueTitle: "Trust and Credibility First",
      valueBody: "Organize services, outcomes, and attorney credentials to reduce friction before consultation.",
      cta: "Request Consultation",
      features: ["Practice areas", "Attorney bios", "Client outcomes", "Consultation form"],
    },
    business: {
      hero: `${siteName} — Built for Growth`,
      subhead: `A ${tone} landing page generated from your prompt with custom brand-ready structure.`,
      valueTitle: "Prompt-to-Page Conversion Layout",
      valueBody: "Every section is generated for your topic, with clear hierarchy, media, and action-focused copy.",
      cta: "Launch This Website",
      features: ["Custom hero", "Topic-specific sections", "Brand-ready style", "Action CTA"],
    },
  };

  return presets[businessType] || presets.business;
}

export const onRequestPost = async (context: { request: Request }) => {
  try {
    const body = (await context.request.json()) as PreviewCopyRequest;
    const prompt = (body.prompt || "").trim();
    const siteName = (body.siteName || "").trim() || "Custom Website";
    const businessType = pickBusinessType(prompt, body.businessType);
    const tone = pickToneLabel(body.requestedStyle || prompt);
    const copy = buildCopy(siteName, businessType, tone);

    return json({
      siteName,
      businessType,
      tone,
      heroHeadline: copy.hero,
      heroSubhead: copy.subhead,
      valueHeading: copy.valueTitle,
      valueBody: copy.valueBody,
      ctaLabel: copy.cta,
      featureBullets: copy.features,
      sections: [
        { key: "hero", heading: copy.hero, body: copy.subhead },
        { key: "value", heading: copy.valueTitle, body: copy.valueBody },
      ],
    });
  } catch {
    return json({ error: "Invalid preview-copy payload." }, { status: 400 });
  }
};
