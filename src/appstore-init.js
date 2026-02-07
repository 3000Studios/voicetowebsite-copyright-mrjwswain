import { checkCredentials, handlePayPalPurchase, handleStripePurchase } from "./commerce.js";

document.addEventListener("DOMContentLoaded", () => {
  checkCredentials();
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".purchase-btn");
    if (btn) {
      e.preventDefault();
      const product = btn.dataset.product;
      const price = parseFloat(btn.dataset.price);
      const url = btn.dataset.url;
      // Prefer Stripe when configured; fallback to PayPal.
      handleStripePurchase(product, price, url).catch(() => {
        handlePayPalPurchase(product, price, url);
      });
    }
  });
});
