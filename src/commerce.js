const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;
const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export const checkCredentials = () => {
  if (!PAYPAL_CLIENT_ID) {
    console.warn("VITE_PAYPAL_CLIENT_ID is missing in .env");
  }
  if (!STRIPE_PK) {
    console.warn("VITE_STRIPE_PUBLISHABLE_KEY is missing in .env");
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

export const handlePayPalPurchase = (product, amount, redirectUrl) => {
  if (!window.paypal || typeof window.paypal.Buttons !== "function") {
    alert("PayPal SDK not loaded. Add https://www.paypal.com/sdk/js to the page.");
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
          <div>${product}</div>
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

  const returnUrl = new URL(redirectUrl, window.location.origin).href;

  window.paypal
    .Buttons({
      style: { layout: "vertical", color: "gold", shape: "rect", label: "paypal" },
      createOrder: (_data, actions) => {
        return actions.order.create({
          purchase_units: [
            {
              description: product,
              amount: { currency_code: "USD", value: Number(amount).toFixed(2) },
            },
          ],
          application_context: { return_url: returnUrl, cancel_url: window.location.href },
        });
      },
      onApprove: async (_data, actions) => {
        try {
          await actions.order.capture();
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
};
