/**
 * Unified Environment Variable Manager
 * Handles all credential retrieval across Vite, Worker runtime, and static context
 * Loaded FIRST in all pages to prevent silent failures
 */

window.VTW_ENV = window.VTW_ENV || {};

/**
 * Get PayPal Client ID from any source
 * Priority: Vite build > Worker runtime > Static data attribute > localStorage fallback
 */
export function getPayPalClientId() {
  // 1. Vite build-time variable (React apps)
  if (
    typeof import.meta !== "undefined" &&
    import.meta.env?.VITE_PAYPAL_CLIENT_ID
  ) {
    const id = String(import.meta.env.VITE_PAYPAL_CLIENT_ID).trim();
    if (id && !id.startsWith("__")) {
      window.VTW_ENV.paypalClientId = id;
      return id;
    }
  }

  // 2. Worker runtime injection (all pages)
  if (window.__ENV?.PAYPAL_CLIENT_ID_PROD || window.__ENV?.PAYPAL_CLIENT_ID) {
    const id = String(
      window.__ENV.PAYPAL_CLIENT_ID_PROD || window.__ENV.PAYPAL_CLIENT_ID
    ).trim();
    if (id && !id.startsWith("__")) {
      window.VTW_ENV.paypalClientId = id;
      return id;
    }
  }

  // 3. Data attribute in meta tag
  const meta = document.querySelector("meta[data-paypal-client]");
  if (meta?.dataset?.paypalClient) {
    const id = String(meta.dataset.paypalClient).trim();
    if (id && !id.startsWith("__")) {
      window.VTW_ENV.paypalClientId = id;
      return id;
    }
  }

  // 4. LocalStorage fallback (dev/debugging)
  const cached = localStorage.getItem("vtw_paypal_client_id");
  if (cached) {
    window.VTW_ENV.paypalClientId = cached;
    return cached;
  }

  return null;
}

/**
 * Get Stripe Publishable Key from any source
 */
export function getStripePublishableKey() {
  // 1. Vite build-time variable (React apps)
  if (
    typeof import.meta !== "undefined" &&
    import.meta.env?.VITE_STRIPE_PUBLISHABLE_KEY
  ) {
    const key = String(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY).trim();
    if (key && !key.startsWith("__") && key.startsWith("pk_")) {
      window.VTW_ENV.stripePublishableKey = key;
      return key;
    }
  }

  // 2. Worker runtime injection
  if (window.__ENV?.STRIPE_PUBLISHABLE_KEY) {
    const key = String(window.__ENV.STRIPE_PUBLISHABLE_KEY).trim();
    if (key && !key.startsWith("__") && key.startsWith("pk_")) {
      window.VTW_ENV.stripePublishableKey = key;
      return key;
    }
  }

  // 3. Data attribute in meta tag
  const meta = document.querySelector("meta[data-stripe-pk]");
  if (meta?.dataset?.stripePk) {
    const key = String(meta.dataset.stripePk).trim();
    if (key && key.startsWith("pk_")) {
      window.VTW_ENV.stripePublishableKey = key;
      return key;
    }
  }

  // 4. LocalStorage fallback
  const cached = localStorage.getItem("vtw_stripe_pk");
  if (cached && cached.startsWith("pk_")) {
    window.VTW_ENV.stripePublishableKey = cached;
    return cached;
  }

  return null;
}

/**
 * Get PayPal Payment Link for a specific tier
 */
export function getPayPalLink(tier = "starter") {
  const tier_key = String(tier).toLowerCase();

  // 1. Worker injection
  if (window.__ENV?.[`PAYPAL_PAYMENT_LINK_${tier_key.toUpperCase()}`]) {
    return String(
      window.__ENV[`PAYPAL_PAYMENT_LINK_${tier_key.toUpperCase()}`]
    ).trim();
  }

  // 2. Vite build-time
  if (typeof import.meta !== "undefined") {
    const key = `VITE_PAYPAL_PAYMENT_LINK_${tier_key.toUpperCase()}`;
    if (import.meta.env?.[key]) {
      return String(import.meta.env[key]).trim();
    }
  }

  return null;
}

/**
 * Get Stripe Payment Link for a specific tier
 */
export function getStripeLink(tier = "starter") {
  const tier_key = String(tier).toLowerCase();

  // 1. Worker injection
  if (window.__ENV?.[`STRIPE_PAYMENT_LINK_${tier_key.toUpperCase()}`]) {
    return String(
      window.__ENV[`STRIPE_PAYMENT_LINK_${tier_key.toUpperCase()}`]
    ).trim();
  }

  // 2. Vite build-time
  if (typeof import.meta !== "undefined") {
    const key = `VITE_STRIPE_PAYMENT_LINK_${tier_key.toUpperCase()}`;
    if (import.meta.env?.[key]) {
      return String(import.meta.env[key]).trim();
    }
  }

  return null;
}

/**
 * Get Stripe Buy Button ID for a specific tier
 */
export function getStripeBuyButtonId(tier = "starter") {
  const tier_key = String(tier).toLowerCase();

  // 1. Worker injection
  if (window.__ENV?.[`STRIPE_BUY_BUTTON_ID_${tier_key.toUpperCase()}`]) {
    return String(
      window.__ENV[`STRIPE_BUY_BUTTON_ID_${tier_key.toUpperCase()}`]
    ).trim();
  }

  // 2. Vite build-time
  if (typeof import.meta !== "undefined") {
    const key = `VITE_STRIPE_BUY_BUTTON_ID_${tier_key.toUpperCase()}`;
    if (import.meta.env?.[key]) {
      return String(import.meta.env[key]).trim();
    }
  }

  return null;
}

/**
 * Validate all credentials are loaded
 * Returns object with status of each service
 */
export function validateCredentials() {
  return {
    paypal: {
      clientId: !!getPayPalClientId(),
      timestamp: new Date().toISOString(),
    },
    stripe: {
      publishableKey: !!getStripePublishableKey(),
      timestamp: new Date().toISOString(),
    },
    ready: !!(getPayPalClientId() || getStripePublishableKey()),
  };
}

/**
 * Initialize environment early (call this in page <head>)
 */
export function initializeEnvironment() {
  const validated = validateCredentials();
  window.VTW_ENV.validated = validated;

  // Log to console in dev
  if (!import.meta?.env?.PROD) {
    console.log("[VTW_ENV] Initialized:", validated);
  }

  // Dispatch event for others to listen
  window.dispatchEvent(new CustomEvent("vtw-env-ready", { detail: validated }));

  return validated;
}

// Auto-initialize on load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeEnvironment);
} else {
  initializeEnvironment();
}
