const loadProducts = async () => {
  try {
    const res = await fetch("/api/products");
    if (!res.ok) throw new Error("Failed to load products");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn("Store loader:", err);
    return []; // Fail gracefully
  }
};

const getPayPalClientId = () => {
  const env = window.__ENV || {};
  return env.PAYPAL_CLIENT_ID || "";
};

const formatPrice = (value) => {
  const number = Number(value || 0);
  return number.toFixed(2);
};

const mountProducts = async () => {
  const scene = document.getElementById("store-product-scene");
  if (!scene) return;

  // Loading state
  scene.innerHTML = `<div class="muted type-small" style="padding:2rem; text-align:center; opacity:0.6;">Loading inventory...</div>`;

  const products = await loadProducts();

  if (!products.length) {
    scene.innerHTML = `<div class="muted" style="padding:2rem; text-align:center;">No products available.</div>`;
    return;
  }

  scene.innerHTML = "";

  products.forEach((product, index) => {
    const card = document.createElement("article");
    card.className = "vt-store-card";
    card.style.animationDelay = `${Math.min(index, 6) * 0.12}s`;

    // Check if user bought it (mock logic for now, or check localStorage for license keys)
    const isOwned = false;

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
      <div class="purchase-zone">
        <div class="price-tag">$${formatPrice(product.price)}</div>
        ${product.link ? `<a href="${product.link}" class="buy-btn download-btn" download>Download</a>` : `<button class="buy-btn" type="button" data-product-id="${product.id || ""}">Acquire License</button>`}
      </div>
    `;
    scene.appendChild(card);
  });

  // Re-wire tilt after mount
  wireTilt();
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
      { passive: true },
    );
    card.addEventListener(
      "mouseleave",
      () => {
        card.style.transform = `perspective(1000px) translateY(0) rotateX(0) rotateY(0)`;
      },
      { passive: true },
    );
  });
};
const ensurePayPalSdk = async () => {
  if (window.paypal) return true;
  const clientId = getPayPalClientId();
  if (!clientId) return false;
  const existing = document.querySelector('script[data-paypal-sdk="true"]');
  if (existing)
    return new Promise((resolve) =>
      existing.addEventListener("load", () => resolve(true), { once: true }),
    );
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
  const ok = await ensurePayPalSdk();
  if (!ok || !window.paypal) {
    alert(
      "PayPal is not configured yet. Set PAYPAL_CLIENT_ID_PROD in your deploy environment.",
    );
    return;
  }
  const modal = document.createElement("div");
  modal.className = "vt-pay-modal";
  modal.innerHTML = `    <div class="vt-pay-shell">      <button class="vt-pay-close" type="button" aria-label="Close">×</button>      <div class="vt-pay-title">Checkout</div>      <div class="vt-pay-sub">${product.title}</div>      <div class="vt-pay-amount">$${formatPrice(product.price)} USD</div>      <div class="vt-pay-host" id="vt-pay-host"></div>      <div class="vt-pay-note muted">Secure payment via PayPal.</div>    </div>  `;
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
      createOrder: (_data, actions) =>
        actions.order.create({
          purchase_units: [
            {
              description: String(product.title || "Product").slice(0, 127),
              amount: {
                currency_code: "USD",
                value: formatPrice(product.price),
              },
            },
          ],
        }),
      onApprove: async (_data, actions) => {
        const details = await actions.order.capture();
        try {
          await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: details.id,
              product_id: product.id,
              amount: product.price,
            }),
          });
        } catch (e) {
          console.error(e);
        }
        modal.querySelector(".vt-pay-note").textContent =
          "Payment successful. Thank you.";
        setTimeout(close, 1200);
      },
      onError: (err) => {
        console.error(err);
        alert("PayPal error. Please try again.");
      },
    })
    .render(host);
};
const wireBuyButtons = () => {
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".buy-btn");
    if (!btn || btn.hasAttribute("download")) return; // Skip download links

    const id = btn.getAttribute("data-product-id") || "";
    const products = await loadProducts();
    const product = products.find((p) => String(p.id || "") === id) || null;

    if (!product) {
      alert("Product not found. Refresh the page.");
      return;
    }
    openPayPalModal(product);
  });
};
const init = () => {
  mountProducts();
  wireTilt();
  wireBuyButtons();
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
