const loadStoreProducts = () => import("./store-products.js");

if ("requestIdleCallback" in window) {
  window.requestIdleCallback(loadStoreProducts, { timeout: 1500 });
} else {
  window.setTimeout(loadStoreProducts, 700);
}
