const loadProducts = async () => {
  try {
    const res = await fetch("/api/catalog");
    if (!res.ok) throw new Error("Failed to load catalog");
    const data = await res.json();

    // Unified Schema Support
    let products = [];
    if (Array.isArray(data)) {
      products = data;
    } else if (data.products || data.apps) {
      products = [...(data.products || []), ...(data.apps || [])];
    }

    return products;
  } catch (err) {
    console.warn("Store loader:", err);
    return [];
  }
};

const getEnv = () => {
  try {
    return window.__ENV || {};
  } catch (_) {
    return {};
  }
};

const getPayPalClientId = () => {
  const env = getEnv();
  return String(env.PAYPAL_CLIENT_ID_PROD || env.PAYPAL_CLIENT_ID || "").trim();
};

const getStripePublishableKey = () => {
  const env = getEnv();
  return String(env.STRIPE_PUBLIC || env.STRIPE_PUBLISHABLE_KEY || "").trim();
};

const formatPrice = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toFixed(2) : "0.00";
};

const dollarsToCents = (dollars) => {
  const n = Number(dollars || 0);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
};

const wireTilt = () => {
  const cards = document.querySelectorAll(".vt-store-card");
  cards.forEach((card) => {
    card.addEventListener(
      "mousemove",
      (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;
        card.style.transform = `perspective(1000px) translateY(-10px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      },
      { passive: true }
    );
    card.addEventListener(
      "mouseleave",
      () => {
        card.style.transform = "perspective(1000px) translateY(0) rotateX(0) rotateY(0)";
      },
      { passive: true }
    );
  });
};

const ensurePayPalSdk = async () => {
  if (window.paypal) return true;
  const clientId = getPayPalClientId();
  if (!clientId) return false;

  const existing = document.querySelector('script[data-paypal-sdk="true"]');
  if (existing) {
    return new Promise((resolve) => existing.addEventListener("load", () => resolve(true), { once: true }));
  }

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture`;
    script.async = true;
    script.defer = true;
    script.dataset.paypalSdk = "true";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
};

const openPayPalModal = async (product) => {
  if (product.paypalPaymentLink) {
    window.location.href = product.paypalPaymentLink;
    return;
  }

  const ok = await ensurePayPalSdk();
  if (!ok || !window.paypal) {
    alert("PayPal is not configured yet. Set PAYPAL_CLIENT_ID_PROD in your deploy environment.");
    return;
  }

  const modal = document.createElement("div");
  modal.className = "vt-pay-modal";
  modal.innerHTML = `
    <div class="vt-pay-shell" style="z-index: 10000">
      <button class="vt-pay-close" type="button" aria-label="Close">X</button>
      <div class="vt-pay-title">Checkout</div>
      <div class="vt-pay-sub">${product.title}</div>
      <div class="vt-pay-amount">$${formatPrice(product.price)} USD</div>
      <div class="vt-pay-host" id="vt-pay-host"></div>
      <div class="vt-pay-note muted">Secure payment via PayPal.</div>
    </div>
  `;
  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelector(".vt-pay-close")?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });

  const host = modal.querySelector("#vt-pay-host");
  window.paypal
    .Buttons({
      style: { layout: "vertical", shape: "rect", label: "paypal" },
      createOrder: async () => {
        // Unified Commerce: PayPal
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: "paypal",
            id: product.id,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.id) throw new Error(data.error || "Order failed");
        return data.id;
      },
      onApprove: async (data) => {
        // Capture
        const note = modal.querySelector(".vt-pay-note");
        if (note) note.textContent = "Capturing payment...";

        const res = await fetch("/api/paypal/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: data.orderID }),
        });
        const cap = await res.json();
        if (!res.ok || !cap.ok) throw new Error(cap.error || "Capture failed");

        if (note) note.textContent = "Payment successful!";
        setTimeout(close, 1500);
      },
      onError: (err) => {
        console.error(err);
        alert("Payment error. Try again.");
      },
    })
    .render(host);
};

let stripeClient = null;
const getStripeClient = () => {
  const pk = getStripePublishableKey();
  if (!pk) return null;
  if (stripeClient) return stripeClient;
  if (typeof Stripe !== "function") return null;
  stripeClient = Stripe(pk);
  return stripeClient;
};

const openStripeCheckout = async (product) => {
  const pk = getStripePublishableKey();
  if (!pk) {
    alert("Stripe is not configured. Set STRIPE_PUBLISHABLE_KEY in your deploy environment.");
    return;
  }

  const paymentLink = String(product.stripePaymentLink || "").trim();
  if (paymentLink) {
    window.location.href = paymentLink;
    return;
  }

  const stripe = getStripeClient();
  if (!stripe) {
    alert("Stripe client is not available on this page. Make sure Stripe SDK is loaded.");
    return;
  }

  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "stripe",
        id: product.id,
      }),
    });
    const data = await res.json();
    if (!data.sessionId) throw new Error(data.error || "No session");
    await stripe.redirectToCheckout({ sessionId: data.sessionId });
  } catch (err) {
    console.warn(err);
    alert("Stripe checkout failed. " + err.message);
  }
};

const injectStripeBuyButton = (host, buyButtonId) => {
  const pk = getStripePublishableKey();
  const id = String(buyButtonId || "").trim();
  if (!host || !id || !pk) return false;

  const wrap = document.createElement("div");
  wrap.className = "stripe-buy-button-wrap";
  const el = document.createElement("stripe-buy-button");
  el.setAttribute("buy-button-id", id);
  el.setAttribute("publishable-key", pk);
  wrap.appendChild(el);
  host.appendChild(wrap);
  return true;
};

const renderProducts = (scene, products) => {
  scene.innerHTML = "";

  products.forEach((product, index) => {
    const card = document.createElement("article");
    card.className = "vt-store-card";
    card.style.animationDelay = `${Math.min(index, 6) * 0.12}s`;

    const buyButtonId = String(product.stripeBuyButtonId || "").trim();
    const canEmbedBuyButton = Boolean(buyButtonId && getStripePublishableKey());

    card.innerHTML = `
      <div class="glint"></div>
      <div class="preview-viewport" aria-hidden="true">
        <div class="preview-interface">
          <div class="mock-ui">
            <div class="mock-circle"></div>
            <div class="mock-bar" style="width: 80%"></div>
            <div class="mock-bar" style="width: 40%"></div>
            <div class="mock-bar" style="width: 90%"></div>
          </div>
        </div>
      </div>
      <div class="header">
        <span class="label">${product.label || "Product"}</span>
        <h2 class="title">${product.title || "Untitled"}</h2>
        <p class="description">${product.desc || ""}</p>
      </div>
      <div class="lock-indicator" aria-hidden="true">
        <div class="lock-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
      </div>
      <div class="purchase-zone" data-product-id="${product.id || ""}">
        <div class="price-tag">$${formatPrice(product.price)}</div>
        ${
          canEmbedBuyButton
            ? `<div class="stripe-buy-host" data-buy-button-id="${buyButtonId}"></div>`
            : `
              <div class="button-row">
                <button class="buy-btn buy-btn-paypal"
                        type="button"
                        data-name="${product.title}"
                        data-price="${product.price}"
                        data-sku="${product.id}">
                  PayPal
                </button>
                <button class="buy-btn buy-btn-stripe" type="button">Stripe</button>
              </div>
            `
        }
      </div>
    `;

    scene.appendChild(card);

    if (canEmbedBuyButton) {
      const host = card.querySelector(".stripe-buy-host");
      injectStripeBuyButton(host, buyButtonId);
    }
  });
};

const init = async () => {
  const scene = document.getElementById("store-product-scene");
  if (!scene) return;

  scene.innerHTML =
    '<div class="muted type-small" style="padding:2rem; text-align:center; opacity:0.6;">Loading inventory...</div>';

  const products = await loadProducts();
  if (!products.length) {
    scene.innerHTML = '<div class="muted" style="padding:2rem; text-align:center;">No products available.</div>';
    return;
  }

  renderProducts(scene, products);
  wireTilt();

  document.addEventListener("click", async (e) => {
    const paypalBtn = e.target.closest(".buy-btn-paypal");
    const stripeBtn = e.target.closest(".buy-btn-stripe");
    if (!paypalBtn && !stripeBtn) return;

    const zone = e.target.closest(".purchase-zone");
    const id = zone?.getAttribute("data-product-id") || "";
    const product = products.find((p) => String(p.id || "") === id);
    if (!product) {
      alert("Product not found. Refresh the page.");
      return;
    }

    if (paypalBtn) {
      openPayPalModal(product);
      return;
    }

    openStripeCheckout(product);
  });

  // Trigger existing store filter once products are mounted.
  setTimeout(() => {
    const storeSearch = document.getElementById("storeSearch");
    if (storeSearch) storeSearch.dispatchEvent(new Event("input"));
  }, 0);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
