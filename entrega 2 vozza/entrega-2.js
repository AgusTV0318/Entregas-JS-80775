const money = (n) =>
  Number(n).toLocaleString("es-AR", { style: "currency", currency: "ARS" });

class Product {
  constructor(id, name, price, stock) {
    this.id = id;
    this.name = name.trim();
    this.price = Number(price);
    this.stock = Number.isInteger(stock) ? stock : parseInt(stock, 10) || 0;
  }
  isInStock() {
    return this.stock > 0;
  }
}

class CartItem {
  constructor(productId, name, price, qty = 1) {
    this.productId = productId;
    this.name = name;
    this.price = Number(price);
    this.qty = Number.isInteger(qty) ? qty : parseInt(this.qty, 10) || 1;
  }
  subtotal() {
    return this.price * this.qty;
  }
}

let catalog = [];
let cart = [];

const STORAGE_KEYS = {
  catalog: "sim-catalog",
  cart: "sim-cart",
};

function saveCatalog() {
  localStorage.setItem(STORAGE_KEYS.catalog, JSON.stringify(catalog));
}
function saveCart() {
  localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
}
function loadState() {
  try {
    const cat = JSON.parse(localStorage.getItem(STORAGE_KEYS.catalog));
    const crt = JSON.parse(localStorage.getItem(STORAGE_KEYS.cart));
    if (Array.isArray(cat)) {
      catalog = cat.map((p) => new Product(p.id, p.name, p.price, p.stock));
    }
    if (Array.isArray(crt)) {
      cart = crt.map((c) => new CartItem(c.productId, c.name, c.price, c.qty));
    }
  } catch {}
}

function seedCatalogIfEmpty() {
  if (catalog.length > 0) return;
  catalog = [
    new Product(uid(), "Mate Clásico", 5200, 5),
    new Product(uid(), "Yerba orgánica 1KG", 3200, 12),
    new Product(uid(), "Termo acero 1L", 18900, 4),
    new Product(uid(), "Bombilla alpaca", 2900, 8),
  ];
  saveCatalog();
}

function renderCatalog(filterText = "") {
  const container = byId("product-list");
  container.innerHTML = "";

  const q = filterText.trim().toLowerCase();
  const items = q
    ? catalog.filter((p) => p.name.toLowerCase().includes(q))
    : catalog;

  if (items.length === 0) {
    container.innerHTML = `<div class="card"><em>No hay productos para mostrar.</em></div>`;
    return;
  }

  const frag = document.createDocumentFragment();
  for (const p of items) {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = ` <h4 class="product-title">${escapeHTML(p.name)}</h4>
      <div class="product-price">${money(p.price)}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span class="badge">${p.stock} en stock</span>
        <button class="btn primary" data-action="add-to-cart" data-id="${
          p.id
        }" ${!p.isInStock() ? "disabled" : ""}>
          Añadir
        </button>
      </div>
`;
    frag.appendChild(card);
  }
  container.appendChild(frag);
}

function renderCart() {
  const tbody = byId("cart-body");
  tbody.innerHTML = "";

  if (cart.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"><em>Tu carrito está vacío.</em></td></tr>`;
    byId("cart-total").textContent = money(0);
    return;
  }

  const frag = document.createDocumentFragment();
  for (const item of cart) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHTML(item.name)}</td>
      <td>${money(item.price)}</td>
      <td>
        <div class="qty-group">
          <button class="btn ghost" data-action="dec" data-id="${
            item.productId
          }" aria-label="Restar uno">−</button>
          <span class="qty">${item.qty}</span>
          <button class="btn ghost" data-action="inc" data-id="${
            item.productId
          }" aria-label="Sumar uno">+</button>
        </div>
      </td>
      <td>${money(item.subtotal())}</td>
      <td><button class="btn danger" data-action="remove" data-id="${
        item.productId
      }">Eliminar</button></td>
    `;
    frag.appendChild(tr);
  }
  tbody.appendChild(frag);

  const total = cart.reduce((acc, it) => acc + it.subtotal(), 0);
  byId("cart-total").textContent = money(total);
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
function byId(id) {
  return document.getElementById(id);
}
function findProduct(productId) {
  return catalog.find((p) => p.id === productId);
}
function findCartItem(productId) {
  return cart.find((i) => i.productId === productId);
}
function setMessage(text, tone = "info") {
  const el = byId("messages");
  el.textContent = text;
  el.style.color = tone === "error" ? "#fca5a5" : "#a7f3d0";
}

function validateProductInput({ name, price, stock }) {
  const errors = [];
  if (!name || name.trim().length < 2)
    errors.push("Nombre debe tener al menos 2 caracteres.");
  const priceNum = Number(price);
  if (!Number.isFinite(priceNum) || priceNum <= 0)
    errors.push("Precio debe ser un número mayor a 0.");
  const stockNum = Number(stock);
  if (!Number.isInteger(stockNum) || stockNum < 0)
    errors.push("Stock debe ser un número mayor o igual a 0.");
  return { ok: errors.length === 0, errors, priceNum, stockNum };
}

function addToCart(productId) {
  const p = findProduct(productId);
  if (!p) return setMessage("Producto no encontrado.", "error");
  if (p.stock <= 0) return setMessage("Sin stock disponible.", "error");

  const existing = findCartItem(productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push(new CartItem(p.id, p.name, p.price, 1));
  }
  p.stock -= 1;

  saveCart();
  saveCatalog();
  renderCart();
  renderCatalog(byId("search").value);
  setMessage("Producto agregado al carrito.");
}

function incrementCart(productId) {
  const p = findProduct(productId);
  const item = findCartItem(productId);
  if (!p || !item) return;
  item.qty -= 1;
  p.stock += 1;
  if (item.qty <= 0) {
    cart = cart.filter((i) => i.productId !== productId);
  }
  saveCart();
  saveCatalog();
  renderCart();
  renderCatalog(byId("search").value);
}

function decrementCart(productId) {
  const p = findProduct(productId);
  const item = findCartItem(productId);
  if (!p || !item) return;
  item.qty -= 1;
  p.stock += 1;
  if (item.qty <= 0) {
    cart = cart.filter((i) => i.productId !== productId);
  }
  saveCart();
  saveCatalog();
  renderCart();
  renderCatalog(byId("search").value);
}

function removeFromCart(productId) {
  const p = findProduct(productId);
  const item = findCartItem(productId);
  if (!p || !item) return;
  p.stock += item.qty;
  cart = cart.filter((i) => i.productId !== productId);
  saveCart();
  saveCatalog();
  renderCart();
  renderCatalog(byId("search").value);
  setMessage("Producto eliminado del carrito.");
}

function clearCart() {
  for (const item of cart) {
    const p = findProduct(item.productId);
    if (p) p.stock += item.qty;
  }
  cart = [];
  saveCart();
  saveCatalog();
  renderCart();
  renderCatalog(byId("search").value);
  setMessage("Carrito Vaciado.");
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setupEvents() {
  byId("search").addEventListener("input", (e) => {
    renderCatalog(e.target.value);
  });

  byId("product-list").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action='add-to-cart']");
    if (!btn) return;
    const id = btn.dataset.id;
    addToCart(id);
  });

  byId("cart-body").addEventListener("click", (e) => {
    const target = e.target.closest("[data-action]");
    if (!target) return;
    const { action, id } = target.dataset;
    if (action === "inc") incrementCart(id);
    if (action === "dec") decrementCart(id);
    if (action === "remove") removeFromCart(id);
  });

  byId("clear-cart").addEventListener("click", () => clearCart());

  byId("product-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const from = e.currentTarget;
    const payload = {
      name: from.name.value,
      price: from.price.value,
      stock: from.stock.value,
    };
    const res = validateProductInput(payload);
    const errorEl = byId("product-form-error");
    if (!res.ok) {
      errorEl.textContent = res.errors.join(" ");
      return;
    }
    errorEl.textContent = "";
    const product = new Product(
      uid(),
      payload.name,
      res.priceNum,
      res.stockNum
    );
    catalog.push(product);
    saveCatalog();
    renderCatalog();
    renderCatalog(byId("search").value);
    from.reset();
    setMessage("Producto agregado al catálogo.");
  });
}

function init() {
  loadState();
  seedCatalogIfEmpty();
  setupEvents();
  renderCatalog();
  renderCart();
  setMessage("Listo para Interactuar.");
}

document.addEventListener("DOMContentLoaded", init);
