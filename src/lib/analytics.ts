type EventName =
  // Conversion events
  | "page_view"
  | "cta_clicked"
  | "hero_cta_clicked"
  | "pricing_cta_clicked"
  | "upgrade_clicked"
  | "checkout_started"
  | "checkout_completed"
  | "checkout_cancelled"
  // Generation events
  | "site_generation_initiated"
  | "site_generation_success"
  | "site_generation_failed"
  | "preview_created"
  | "voice_recording_started"
  | "voice_recording_completed"
  // Engagement events
  | "pricing_viewed"
  | "features_viewed"
  | "faq_interacted"
  | "template_selected"
  | "demo_watched"
  // User lifecycle
  | "user_signed_up"
  | "user_logged_in"
  | "user_onboarding_started"
  | "user_onboarding_completed"
  | "user_churned"
  | "subscription_renewed"
  | "subscription_cancelled"
  // A/B testing
  | "experiment_viewed"
  | "experiment_converted";

interface EventProperties {
  [key: string]: string | number | boolean | null | undefined;
}

type GtagFn = (command: "event" | "config" | "js" | "set", ...args: unknown[]) => void;
declare global {
  interface Window {
    gtag?: GtagFn;
    dataLayer?: unknown[];
  }
}

export const PLAN_PRICE_USD: Record<string, number> = {
  starter: 9.99,
  pro: 19.99,
  enterprise: 49.99,
  commands: 2.99,
};

export const trackEvent = (name: EventName, properties?: EventProperties) => {
  try {
    if (import.meta.env.DEV) {
      console.log(`[Analytics] ${name}`, properties);
    }
    window.dispatchEvent(
      new CustomEvent("analytics_event", { detail: { name, properties } }),
    );
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", name, properties || {});
    }
  } catch (err) {
    console.warn("Analytics tracking failed", err);
  }
};

export const trackPurchase = (params: {
  transactionId: string;
  plan: string;
  cadence?: "month" | "year";
  value?: number;
}) => {
  try {
    const planPrice = PLAN_PRICE_USD[params.plan] || 0;
    const value =
      typeof params.value === "number"
        ? params.value
        : params.cadence === "year"
          ? Math.round(planPrice * 12 * 0.8 * 100) / 100
          : planPrice;
    const payload = {
      transaction_id: params.transactionId,
      value,
      currency: "USD",
      items: [
        {
          item_id: params.plan,
          item_name: `VoiceToWebsite ${params.plan}`,
          item_category: params.cadence || "month",
          price: value,
          quantity: 1,
        },
      ],
    };
    if (import.meta.env.DEV) console.log("[Analytics] purchase", payload);
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "purchase", payload);
    }
    window.dispatchEvent(new CustomEvent("analytics_event", { detail: { name: "purchase", properties: payload } }));
  } catch (err) {
    console.warn("Purchase tracking failed", err);
  }
};
