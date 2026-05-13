import {
  checkCredentials,
  handlePayPalPurchase,
  handleStripePurchase,
} from "./commerce.js";

document.addEventListener("DOMContentLoaded", () => {
  checkCredentials();
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".purchase-btn");
    if (btn) {
      e.preventDefault();
      const sku = btn.dataset.sku || btn.dataset.product;
      const label = btn.dataset.label || btn.dataset.product || sku;
      const price = parseFloat(btn.dataset.price);
      const url = btn.dataset.url;
      // Prefer Stripe when configured; fallback to PayPal.
      handleStripePurchase(sku, price, url).catch(() => {
        handlePayPalPurchase(sku, label, price, url);
      });
    }
  });
});
