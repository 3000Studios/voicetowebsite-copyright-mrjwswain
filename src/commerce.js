const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || (window.__ENV && window.__ENV.PAYPAL_CLIENT_ID);
const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || (window.__ENV && window.__ENV.STRIPE_PUBLISHABLE_KEY);

export const checkCredentials = () => {
  if (!PAYPAL_CLIENT_ID) {
    console.warn("VITE_PAYPAL_CLIENT_ID is missing in .env and window.__ENV");
  }
  if (!STRIPE_PK) {
    console.warn("VITE_STRIPE_PUBLISHABLE_KEY is missing in .env and window.__ENV");
  }
};

export const handleStripePurchase = async (product, amount, redirectUrl) => {
  if (!STRIPE_PK) {
    throw new Error("Stripe is not configured (missing VITE_STRIPE_PUBLISHABLE_KEY).");
  }
  if (!window.Stripe) {
    throw new Error("Stripe SDK not loaded. Add https://js.stripe.com/v3 to the page.");
  }

  // This assumes a backend endpoint exists to create a session.
  // Since we don't have a guaranteed backend for this new app,
  // we might just alert or mock it.
  // However, existing store.html uses /api/stripe/checkout.
  try {
    const stripe = window.Stripe(STRIPE_PK);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        product,
        label: product,
        source: "appstore",
        successUrl: redirectUrl,
      }),
    });
    const data = await res.json();
    if (!data.sessionId) throw new Error("No session");
    await stripe.redirectToCheckout({ sessionId: data.sessionId });
  } catch (err) {
    console.error(err);
    throw err;
  }
};

const getPayPalLink = (sku, env) => {
  const map = {
    "project-planning-hub": env.PAYPAL_PAYMENT_LINK_PROJECT_PLANNING_HUB,
    "ai-web-forge-pro": env.PAYPAL_PAYMENT_LINK_WEB_FORGE,
    "ai-drive": env.PAYPAL_PAYMENT_LINK_AI_DRIVE,
    "google-ai-prompts": env.PAYPAL_PAYMENT_LINK_GOOGLE_PROMPTS,
    starter: env.PAYPAL_PAYMENT_LINK_STARTER,
    growth: env.PAYPAL_PAYMENT_LINK_GROWTH,
    enterprise: env.PAYPAL_PAYMENT_LINK_ENTERPRISE,
    lifetime: env.PAYPAL_PAYMENT_LINK_LIFETIME,
  };
  return map[sku] || null;
};

export const handlePayPalPurchase = async (sku, displayName, amount, redirectUrl) => {
  const env = window.__ENV || {};
  const link = getPayPalLink(String(sku || "").toLowerCase(), env);

  if (link) {
    window.location.href = link;
    return;
  }

  // Load SDK dynamically if not present
  if (!window.paypal_sdk_promise) {
    window.paypal_sdk_promise = (async () => {
      const script = document.createElement("script");
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&components=buttons,card-fields`;
      script.async = true;
      document.head.appendChild(script);
      return new Promise((resolve, reject) => {
        script.onload = () => resolve(window.paypal);
        script.onerror = () => reject(new Error("Failed to load PayPal SDK"));
      });
    })();
  }

  try {
    await window.paypal_sdk_promise;
  } catch (err) {
    alert("Could not load PayPal. Please try again or use another method.");
    return;
  }

  const overlayId = "vtw-paypal-overlay";
  const containerId = "vtw-paypal-buttons";

  const existing = document.getElementById(overlayId);
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = overlayId;
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.zIndex = "9999";
  overlay.style.background = "rgba(0,0,0,0.72)";
  overlay.style.backdropFilter = "blur(10px)";
  overlay.style.display = "grid";
  overlay.style.placeItems = "center";
  overlay.innerHTML = `
      <div style="width:min(520px,92vw); border:1px solid rgba(255,255,255,0.12); background:rgba(8,12,20,0.92); border-radius:16px; padding:18px;">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px;">
          <div style="font-weight:800; letter-spacing:0.14em; font-size:12px; text-transform:uppercase; color:rgba(255,255,255,0.78);">
            PayPal Checkout
          </div>
          <button id="vtw-paypal-close" style="border:1px solid rgba(255,255,255,0.16); background:rgba(255,255,255,0.06); color:white; border-radius:999px; width:34px; height:34px; cursor:pointer;">✕</button>
        </div>
        <div style="display:flex; justify-content:space-between; gap:12px; margin-bottom:10px; color:rgba(255,255,255,0.8); font-family:system-ui;">
          <div>${displayName || sku}</div>
          <div style="font-weight:700;">$${Number(amount).toFixed(2)}</div>
        </div>
        <div id="${containerId}"></div>
        <div style="margin-top:10px; font-size:12px; color:rgba(255,255,255,0.55); font-family:system-ui;">
          You will be redirected after capture.
        </div>
      </div>
    `;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  overlay.querySelector("#vtw-paypal-close")?.addEventListener("click", close);

  const returnUrl = (() => {
    try {
      const u = new URL(String(redirectUrl || ""), window.location.origin);
      if (u.protocol !== "http:" && u.protocol !== "https:") return window.location.href;
      return u.href;
    } catch (_) {
      return window.location.href;
    }
  })();

  try {
    // Generate client token for v6 (actually v5/latest standard Buttons but with server-side createOrder)
    // The user mentioned v6 SDK which uses createInstance, but standard Buttons also work fine with server-side createOrder.
    // Let's stick to the Buttons API as it's more stable for this use case, but ensure the SDK is loaded.

    window.paypal
      .Buttons({
        style: { layout: "vertical", color: "gold", shape: "rect", label: "paypal" },
        createOrder: async () => {
          const res = await fetch("/api/paypal/order/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sku: String(sku || "")
                .trim()
                .toLowerCase(),
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data?.id) {
            throw new Error(String(data?.error || "PayPal order create failed."));
          }
          return data.id;
        },
        onApprove: async (data) => {
          try {
            const res = await fetch("/api/paypal/order/capture", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: data?.orderID,
                sku: String(sku || "")
                  .trim()
                  .toLowerCase(),
              }),
            });
            const cap = await res.json().catch(() => ({}));
            if (!res.ok || !cap?.ok) throw new Error(String(cap?.error || "PayPal capture failed."));
            close();
            window.location.href = returnUrl;
          } catch (err) {
            console.error(err);
            alert("PayPal capture failed.");
          }
        },
        onError: (err) => {
          console.error("PayPal error", err);
          alert("PayPal checkout failed.");
        },
      })
      .render(`#${containerId}`);
  } catch (err) {
    console.error("PayPal Buttons init error", err);
    alert("Failed to initialize PayPal.");
  }
};
