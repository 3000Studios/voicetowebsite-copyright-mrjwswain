/**
 * Universal Cart Management System
 * Handles cart state across PayPal, Stripe, and app store
 * Persists to localStorage, syncs to Worker on checkout
 */

class CartManager {
  constructor() {
    this.items = [];
    this.metadata = {
      createdAt: null,
      lastModified: null,
      source: null,
    };
    this.load();
  }

  /**
   * Add item to cart
   */
  addItem(product) {
    if (!product.id) throw new Error("Product must have id");

    const item = {
      id: product.id,
      title: product.title || product.label || "",
      price: product.price || 0,
      quantity: product.quantity || 1,
      description: product.description || "",
      provider: product.provider || "stripe", // stripe | paypal | internal
      metadata: product.metadata || {},
      addedAt: new Date().toISOString(),
    };

    // Check if item already exists
    const existingIndex = this.items.findIndex((i) => i.id === item.id);
    if (existingIndex >= 0) {
      this.items[existingIndex].quantity += item.quantity;
    } else {
      this.items.push(item);
    }

    this.metadata.lastModified = new Date().toISOString();
    this.persist();
    this.notifyListeners("item-added", item);
    return item;
  }

  /**
   * Remove item from cart
   */
  removeItem(itemId) {
    const index = this.items.findIndex((i) => i.id === itemId);
    if (index >= 0) {
      const removed = this.items.splice(index, 1)[0];
      this.metadata.lastModified = new Date().toISOString();
      this.persist();
      this.notifyListeners("item-removed", removed);
      return true;
    }
    return false;
  }

  /**
   * Update item quantity
   */
  updateQuantity(itemId, quantity) {
    const item = this.items.find((i) => i.id === itemId);
    if (!item) return false;

    if (quantity <= 0) {
      return this.removeItem(itemId);
    }

    item.quantity = quantity;
    this.metadata.lastModified = new Date().toISOString();
    this.persist();
    this.notifyListeners("quantity-changed", item);
    return true;
  }

  /**
   * Get total price
   */
  getTotal() {
    return this.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }

  /**
   * Get total item count
   */
  getItemCount() {
    return this.items.reduce((count, item) => count + item.quantity, 0);
  }

  /**
   * Get cart as checkout payload
   */
  getCheckoutPayload(provider = "stripe") {
    return {
      items: this.items.filter((i) => i.provider === provider || !i.provider),
      total: this.getTotal(),
      itemCount: this.getItemCount(),
      cartId: this.metadata.cartId || crypto.randomUUID(),
      createdAt: this.metadata.createdAt,
      lastModified: this.metadata.lastModified,
    };
  }

  /**
   * Clear entire cart
   */
  clear() {
    this.items = [];
    this.metadata.lastModified = new Date().toISOString();
    this.persist();
    this.notifyListeners("cart-cleared");
  }

  /**
   * Persist to localStorage
   */
  persist() {
    try {
      const data = {
        items: this.items,
        metadata: this.metadata,
        version: 1,
      };
      localStorage.setItem("vtw_cart", JSON.stringify(data));
    } catch (err) {
      console.warn("[Cart] Failed to persist:", err.message);
    }
  }

  /**
   * Load from localStorage
   */
  load() {
    try {
      const stored = localStorage.getItem("vtw_cart");
      if (stored) {
        const data = JSON.parse(stored);
        this.items = data.items || [];
        this.metadata = data.metadata || {
          createdAt: null,
          lastModified: null,
        };

        // Initialize cartId if missing
        if (!this.metadata.cartId) {
          this.metadata.cartId = crypto.randomUUID();
        }
        if (!this.metadata.createdAt) {
          this.metadata.createdAt = new Date().toISOString();
        }
      } else {
        this.metadata.cartId = crypto.randomUUID();
        this.metadata.createdAt = new Date().toISOString();
        this.persist();
      }
    } catch (err) {
      console.warn("[Cart] Failed to load:", err.message);
    }
  }

  /**
   * Event listener support
   */
  on(event, callback) {
    if (!this.listeners) this.listeners = {};
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.listeners?.[event]) return;
    this.listeners[event] = this.listeners[event].filter(
      (cb) => cb !== callback
    );
  }

  notifyListeners(event, data) {
    if (!this.listeners?.[event]) return;
    this.listeners[event].forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error("[Cart] Listener error:", err);
      }
    });
  }
}

// Export singleton
export const cart = new CartManager();

/**
 * Checkout Modal Controller
 * Handles cart review and payment method selection
 */
export class CheckoutModal {
  constructor(options = {}) {
    this.options = {
      onSuccess: options.onSuccess || (() => {}),
      onCancel: options.onCancel || (() => {}),
      onError: options.onError || (() => {}),
      providers: options.providers || ["stripe", "paypal"],
    };

    this.modal = null;
    this.selectedProvider = null;
  }

  /**
   * Show modal with current cart
   */
  show() {
    if (this.modal) return;

    const modal = document.createElement("div");
    modal.className = "vtw-checkout-modal";
    modal.innerHTML = this.buildHTML();

    document.body.appendChild(modal);
    this.modal = modal;

    // Attach event listeners
    this.attachListeners();

    // Trigger animation
    requestAnimationFrame(() => modal.classList.add("visible"));
  }

  /**
   * Hide and remove modal
   */
  hide() {
    if (!this.modal) return;

    this.modal.classList.remove("visible");
    setTimeout(() => {
      this.modal?.remove();
      this.modal = null;
    }, 300);
  }

  /**
   * Build modal HTML
   */
  buildHTML() {
    const items = cart.items;
    const total = cart.getTotal();

    return `
      <div class="vtw-checkout-overlay">
        <div class="vtw-checkout-panel">
          <div class="vtw-checkout-header">
            <h2>Checkout</h2>
            <button class="vtw-checkout-close" aria-label="Close">✕</button>
          </div>

          <div class="vtw-checkout-items">
            ${items
              .map(
                (item, idx) => `
              <div class="vtw-checkout-item" data-item-id="${item.id}" data-index="${idx}">
                <div class="vtw-item-info">
                  <div class="vtw-item-title">${item.title}</div>
                  <div class="vtw-item-description">${item.description}</div>
                </div>
                <div class="vtw-item-qty">
                  <input type="number" class="vtw-qty-input" value="${item.quantity}" min="1" max="100">
                </div>
                <div class="vtw-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
                <button class="vtw-item-remove" aria-label="Remove">✕</button>
              </div>
            `
              )
              .join("")}
          </div>

          <div class="vtw-checkout-divider"></div>

          <div class="vtw-checkout-total">
            <span>Total</span>
            <span class="vtw-total-amount">$${total.toFixed(2)}</span>
          </div>

          <div class="vtw-payment-methods">
            ${
              this.options.providers.includes("stripe")
                ? `
              <button class="vtw-payment-btn vtw-stripe-btn" data-provider="stripe">
                <span class="vtw-payment-icon">💳</span>
                <span>Pay with Card</span>
              </button>
            `
                : ""
            }
            ${
              this.options.providers.includes("paypal")
                ? `
              <button class="vtw-payment-btn vtw-paypal-btn" data-provider="paypal">
                <span class="vtw-payment-icon">🅿️</span>
                <span>PayPal</span>
              </button>
            `
                : ""
            }
          </div>

          <button class="vtw-checkout-continue" disabled>
            Continue
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  attachListeners() {
    const modal = this.modal;
    if (!modal) return;

    // Close button
    modal
      .querySelector(".vtw-checkout-close")
      ?.addEventListener("click", () => {
        this.onCancel();
        this.hide();
      });

    // Overlay click to close
    modal
      .querySelector(".vtw-checkout-overlay")
      ?.addEventListener("click", (e) => {
        if (e.target === modal.querySelector(".vtw-checkout-overlay")) {
          this.onCancel();
          this.hide();
        }
      });

    // Item remove buttons
    modal.querySelectorAll(".vtw-item-remove").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const itemEl = e.target.closest(".vtw-checkout-item");
        const itemId = itemEl?.dataset?.itemId;
        if (itemId) {
          cart.removeItem(itemId);
          this.refresh();
        }
      });
    });

    // Quantity inputs
    modal.querySelectorAll(".vtw-qty-input").forEach((input) => {
      input.addEventListener("change", (e) => {
        const itemEl = e.target.closest(".vtw-checkout-item");
        const itemId = itemEl?.dataset?.itemId;
        const qty = parseInt(e.target.value, 10);
        if (itemId && qty > 0) {
          cart.updateQuantity(itemId, qty);
          this.refresh();
        }
      });
    });

    // Payment method selection
    modal.querySelectorAll(".vtw-payment-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        modal
          .querySelectorAll(".vtw-payment-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.selectedProvider = btn.dataset.provider;
        modal.querySelector(".vtw-checkout-continue").disabled = false;
      });
    });

    // Continue button
    modal
      .querySelector(".vtw-checkout-continue")
      ?.addEventListener("click", () => {
        if (this.selectedProvider) {
          this.checkout();
        }
      });

    // Listen to cart changes
    cart.on("item-removed", () => this.refresh());
    cart.on("quantity-changed", () => this.refresh());
  }

  /**
   * Refresh modal with current cart
   */
  refresh() {
    if (!this.modal) return;

    const items = cart.items;
    if (items.length === 0) {
      this.onCancel();
      this.hide();
      return;
    }

    // Update items list
    const itemsContainer = this.modal.querySelector(".vtw-checkout-items");
    itemsContainer.innerHTML = items
      .map(
        (item, idx) => `
      <div class="vtw-checkout-item" data-item-id="${item.id}" data-index="${idx}">
        <div class="vtw-item-info">
          <div class="vtw-item-title">${item.title}</div>
          <div class="vtw-item-description">${item.description}</div>
        </div>
        <div class="vtw-item-qty">
          <input type="number" class="vtw-qty-input" value="${item.quantity}" min="1" max="100">
        </div>
        <div class="vtw-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
        <button class="vtw-item-remove" aria-label="Remove">✕</button>
      </div>
    `
      )
      .join("");

    // Update total
    const total = cart.getTotal();
    this.modal.querySelector(".vtw-total-amount").textContent =
      `$${total.toFixed(2)}`;

    // Re-attach listeners to new elements
    this.attachListeners();
  }

  /**
   * Process checkout
   */
  async checkout() {
    if (!this.selectedProvider) return;

    try {
      const payload = cart.getCheckoutPayload(this.selectedProvider);

      // Create order via API
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: this.selectedProvider,
          items: payload.items,
          cartId: payload.cartId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      // Redirect to provider checkout
      if (this.selectedProvider === "stripe" && data.sessionId) {
        window.location.href = data.url;
      } else if (this.selectedProvider === "paypal" && data.id) {
        // PayPal will be handled by provider
        this.options.onSuccess(data);
      }

      this.hide();
    } catch (err) {
      console.error("[Checkout] Error:", err);
      this.options.onError(err);
    }
  }

  onCancel() {
    this.options.onCancel();
  }
}

/**
 * Initialize cart UI (mini cart widget)
 */
export function initializeCartUI() {
  const container =
    document.getElementById("vtw-mini-cart") ||
    document.querySelector(".vtw-mini-cart");
  if (!container) return;

  function updateDisplay() {
    const count = cart.getItemCount();
    const total = cart.getTotal();
    container.innerHTML = `
      <button class="vtw-cart-button">
        <span class="vtw-cart-icon">🛒</span>
        <span class="vtw-cart-badge">${count}</span>
      </button>
      <div class="vtw-cart-tooltip">
        ${count} items • $${total.toFixed(2)}
      </div>
    `;

    container
      .querySelector(".vtw-cart-button")
      ?.addEventListener("click", () => {
        const modal = new CheckoutModal();
        modal.show();
      });
  }

  updateDisplay();
  cart.on("item-added", updateDisplay);
  cart.on("item-removed", updateDisplay);
  cart.on("quantity-changed", updateDisplay);
  cart.on("cart-cleared", updateDisplay);
}
