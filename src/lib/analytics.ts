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

export const trackEvent = (name: EventName, properties?: EventProperties) => {
  try {
    // 1. Log to console in development
    if (import.meta.env.DEV) {
      console.log(`[Analytics] ${name}`, properties);
    }

    // 2. Dispatch custom event for browser-based observers
    window.dispatchEvent(
      new CustomEvent("analytics_event", { detail: { name, properties } }),
    );

    // 3. Placeholder for future third-party integrations (GA4, Meta, etc.)
    // if (window.gtag) window.gtag('event', name, properties);
  } catch (err) {
    console.warn("Analytics tracking failed", err);
  }
};
