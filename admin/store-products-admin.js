const productTableBody = document.getElementById("product-table-body");
const productForm = document.getElementById("product-form");
const productClear = document.getElementById("product-clear");
const productsReset = document.getElementById("products-reset");
const productsCount = document.getElementById("products-count");
const readonly = Boolean(document.getElementById("product-form")?.dataset?.mode === "readonly");

const loadProducts = async () => {
  try {
    const res = await fetch("/api/catalog", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load products");
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (data && (Array.isArray(data.products) || Array.isArray(data.apps))) {
      return Array.isArray(data.products) ? data.products : [];
    }
    return [];
  } catch (err) {
    console.warn("Product loader:", err);
    return [];
  }
};

const updateProductKpis = (products = []) => {
  if (!productsCount) return;
  productsCount.textContent = `${products.length} products`;
};

const renderProducts = async () => {
  if (!productTableBody) return;

  const products = await loadProducts();
  productTableBody.innerHTML = "";

  if (!products.length) {
    productTableBody.innerHTML = `<tr><td colspan="5" class="muted">No products yet. Add one to seed.</td></tr>`;
    updateProductKpis([]);
    return;
  }

  products.forEach((product) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <div class="app-title">${product.title}</div>
        <div class="muted small">${product.desc || ""}</div>
      </td>
      <td>${product.label || "--"}</td>
      <td>$${Number(product.price || 0).toFixed(2)}</td>
      <td>${product.tag || "--"}</td>
      <td><button class="ghost small" data-product-remove="${product.id}">Remove</button></td>
    `;
    productTableBody.appendChild(tr);
  });
  updateProductKpis(products);
};

productTableBody?.addEventListener("click", async (e) => {
  if (readonly) return;
  const btn = e.target.closest("button[data-product-remove]");
  if (!btn) return;
  const id = btn.getAttribute("data-product-remove");
  if (!confirm("Delete this product?")) return;

  try {
    const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Delete failed");
    await renderProducts();
  } catch (err) {
    alert(err.message);
  }
});

productForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (readonly) {
    alert("This manager is read-only. Edit products.json and redeploy to change inventory.");
    return;
  }
  const formData = new FormData(productForm);
  const title = formData.get("title")?.toString() || "";

  const product = {
    id:
      formData.get("id")?.toString() ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") ||
      `product-${Date.now()}`,
    label: formData.get("label")?.toString() || "",
    title,
    desc: formData.get("desc")?.toString() || "",
    price: Number(formData.get("price") || 0),
    tag: formData.get("tag")?.toString() || "",
    link: "",
    stripeBuyButtonId: formData.get("stripeBuyButtonId")?.toString() || "",
    stripePaymentLink: formData.get("stripePaymentLink")?.toString() || "",
  };

  try {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    if (!res.ok) throw new Error("Save failed");

    productForm.reset();
    await renderProducts();
  } catch (err) {
    alert(err.message);
  }
});

productClear?.addEventListener("click", () => {
  productForm?.reset();
});

productsReset?.addEventListener("click", async () => {
  await renderProducts();
  alert("Products refreshed.");
});

renderProducts();
