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
   * Build modal HTML safely
   */
  buildHTML() {
    const items = cart.items;
    const total = cart.getTotal();

    // Create safe HTML structure
    const overlay = document.createElement("div");
    overlay.className = "vtw-checkout-overlay";

    const panel = document.createElement("div");
    panel.className = "vtw-checkout-panel";

    // Header
    const header = document.createElement("div");
    header.className = "vtw-checkout-header";

    const title = document.createElement("h2");
    title.textContent = "Checkout";
    header.appendChild(title);

    const closeBtn = document.createElement("button");
    closeBtn.className = "vtw-checkout-close";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.textContent = "✕";
    header.appendChild(closeBtn);

    panel.appendChild(header);

    // Items container
    const itemsContainer = document.createElement("div");
    itemsContainer.className = "vtw-checkout-items";

    items.forEach((item, idx) => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "vtw-checkout-item";
      itemDiv.setAttribute("data-item-id", String(item.id));
      itemDiv.setAttribute("data-index", String(idx));

      const itemInfo = document.createElement("div");
      itemInfo.className = "vtw-item-info";

      const itemTitle = document.createElement("div");
      itemTitle.className = "vtw-item-title";
      itemTitle.textContent = item.title;
      itemInfo.appendChild(itemTitle);

      const itemDesc = document.createElement("div");
      itemDesc.className = "vtw-item-description";
      itemDesc.textContent = item.description;
      itemInfo.appendChild(itemDesc);

      itemDiv.appendChild(itemInfo);

      const qtyDiv = document.createElement("div");
      qtyDiv.className = "vtw-item-qty";

      const qtyInput = document.createElement("input");
      qtyInput.type = "number";
      qtyInput.className = "vtw-qty-input";
      qtyInput.value = String(item.quantity);
      qtyInput.min = "1";
      qtyInput.max = "100";
      qtyDiv.appendChild(qtyInput);

      itemDiv.appendChild(qtyDiv);

      const priceDiv = document.createElement("div");
      priceDiv.className = "vtw-item-price";
      priceDiv.textContent = `$${(item.price * item.quantity).toFixed(2)}`;
      itemDiv.appendChild(priceDiv);

      const removeBtn = document.createElement("button");
      removeBtn.className = "vtw-item-remove";
      removeBtn.setAttribute("aria-label", "Remove");
      removeBtn.textContent = "✕";
      itemDiv.appendChild(removeBtn);

      itemsContainer.appendChild(itemDiv);
    });

    panel.appendChild(itemsContainer);

    // Divider
    const divider = document.createElement("div");
    divider.className = "vtw-checkout-divider";
    panel.appendChild(divider);

    // Total
    const totalDiv = document.createElement("div");
    totalDiv.className = "vtw-checkout-total";

    const totalLabel = document.createElement("span");
    totalLabel.textContent = "Total";
    totalDiv.appendChild(totalLabel);

    const totalAmount = document.createElement("span");
    totalAmount.className = "vtw-total-amount";
    totalAmount.textContent = `$${total.toFixed(2)}`;
    totalDiv.appendChild(totalAmount);

    panel.appendChild(totalDiv);

    // Payment methods
    const paymentMethods = document.createElement("div");
    paymentMethods.className = "vtw-payment-methods";

    if (this.options.providers.includes("stripe")) {
      const stripeBtn = document.createElement("button");
      stripeBtn.className = "vtw-payment-btn vtw-stripe-btn";
      stripeBtn.setAttribute("data-provider", "stripe");

      const stripeIcon = document.createElement("span");
      stripeIcon.className = "vtw-payment-icon";
      stripeIcon.textContent = "💳";
      stripeBtn.appendChild(stripeIcon);

      const stripeText = document.createElement("span");
      stripeText.textContent = "Pay with Card";
      stripeBtn.appendChild(stripeText);

      paymentMethods.appendChild(stripeBtn);
    }

    if (this.options.providers.includes("paypal")) {
      const paypalBtn = document.createElement("button");
      paypalBtn.className = "vtw-payment-btn vtw-paypal-btn";
      paypalBtn.setAttribute("data-provider", "paypal");

      const paypalIcon = document.createElement("span");
      paypalIcon.className = "vtw-payment-icon";
      paypalIcon.textContent = "🅿️";
      paypalBtn.appendChild(paypalIcon);

      const paypalText = document.createElement("span");
      paypalText.textContent = "PayPal";
      paypalBtn.appendChild(paypalText);

      paymentMethods.appendChild(paypalBtn);
    }

    panel.appendChild(paymentMethods);

    // Continue button
    const continueBtn = document.createElement("button");
    continueBtn.className = "vtw-checkout-continue";
    continueBtn.disabled = true;
    continueBtn.textContent = "Continue";
    panel.appendChild(continueBtn);

    overlay.appendChild(panel);

    return overlay;
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
      btn.addEventListener("click", () => {
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

    // Update items list safely
    const itemsContainer = this.modal.querySelector(".vtw-checkout-items");
    itemsContainer.innerHTML = ""; // Clear existing content

    items.forEach((item, idx) => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "vtw-checkout-item";
      itemDiv.setAttribute("data-item-id", String(item.id));
      itemDiv.setAttribute("data-index", String(idx));

      const itemInfo = document.createElement("div");
      itemInfo.className = "vtw-item-info";

      const itemTitle = document.createElement("div");
      itemTitle.className = "vtw-item-title";
      itemTitle.textContent = item.title;
      itemInfo.appendChild(itemTitle);

      const itemDesc = document.createElement("div");
      itemDesc.className = "vtw-item-description";
      itemDesc.textContent = item.description;
      itemInfo.appendChild(itemDesc);

      itemDiv.appendChild(itemInfo);

      const qtyDiv = document.createElement("div");
      qtyDiv.className = "vtw-item-qty";

      const qtyInput = document.createElement("input");
      qtyInput.type = "number";
      qtyInput.className = "vtw-qty-input";
      qtyInput.value = String(item.quantity);
      qtyInput.min = "1";
      qtyInput.max = "100";
      qtyDiv.appendChild(qtyInput);

      itemDiv.appendChild(qtyDiv);

      const priceDiv = document.createElement("div");
      priceDiv.className = "vtw-item-price";
      priceDiv.textContent = `$${(item.price * item.quantity).toFixed(2)}`;
      itemDiv.appendChild(priceDiv);

      const removeBtn = document.createElement("button");
      removeBtn.className = "vtw-item-remove";
      removeBtn.setAttribute("aria-label", "Remove");
      removeBtn.textContent = "✕";
      itemDiv.appendChild(removeBtn);

      itemsContainer.appendChild(itemDiv);
    });

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

    // Clear container safely
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // Create cart button
    const cartButton = document.createElement("button");
    cartButton.className = "vtw-cart-button";

    const cartIcon = document.createElement("span");
    cartIcon.className = "vtw-cart-icon";
    cartIcon.textContent = "🛒";
    cartButton.appendChild(cartIcon);

    const cartBadge = document.createElement("span");
    cartBadge.className = "vtw-cart-badge";
    cartBadge.textContent = String(count);
    cartButton.appendChild(cartBadge);

    container.appendChild(cartButton);

    // Create tooltip
    const tooltip = document.createElement("div");
    tooltip.className = "vtw-cart-tooltip";
    tooltip.textContent = `${count} items • $${total.toFixed(2)}`;

    container.appendChild(tooltip);

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
