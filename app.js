/* =========================================================
   BRYCHI ENTERPRISES — SHARED FRONTEND JAVASCRIPT
   ---------------------------------------------------------
   This version connects the public website to Firebase.
   PRODUCTS:
   - Products are loaded from Firestore
   - Images come from Cloudinary
   - Only products with active !== false are displayed
   - Search works with Firebase-loaded products
   CART:
   - Cart still uses localStorage
   - WhatsApp ordering remains available
   IMPORTANT:
   firebase-config.js is in the ROOT folder.
   app.js is also in the ROOT folder, so we use:
       ./firebase-config.js
========================================================= */
/* =========================================================
   FIREBASE IMPORTS
========================================================= */
import {
  db,
  firebaseReady
} from "./firebase-config.js";
import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
/* =========================================================
   EDITABLE WHATSAPP NUMBER
========================================================= */
const WHATSAPP_NUMBER = "2348023139293";
/* =========================================================
   PRODUCT DATA
========================================================= */
/*
   This replaces the old DEMO_PRODUCTS array.
   Products now come from:
       Firestore → products
   Example product structure:
   {
     name: "Quantum Energy Device",
     price: 50000,
     description: "Product description",
     image: "Cloudinary image URL",
     active: true
   }
*/
let PRODUCTS = [];
/* =========================================================
   GET PRODUCTS FROM FIRESTORE
========================================================= */
async function getProducts() {
  /*
    Wait for Firebase to initialize.
  */
  await firebaseReady;
  try {
    const productsQuery = query(
      collection(db, "products"),
      orderBy("createdAt", "desc")
    );
    const snapshot =
      await getDocs(productsQuery);
    PRODUCTS = snapshot.docs
      .map(document => ({
        id: document.id,
        ...document.data()
      }))
      /*
        Hide products that the administrator
        marked as unavailable.
        A product is shown unless active is
        explicitly set to false.
      */
      .filter(product =>
        product.active !== false
      );
    return PRODUCTS;
  } catch (error) {
    console.error(
      "Unable to load products from Firestore:",
      error
    );
    PRODUCTS = [];
    return PRODUCTS;
  }
}
/* =========================================================
   GET CART
========================================================= */
function getCart() {
  try {
    return JSON.parse(
      localStorage.getItem("brychi_cart") || "[]"
    );
  } catch {
    return [];
  }
}
/* =========================================================
   SAVE CART
========================================================= */
function saveCart(cart) {
  localStorage.setItem(
    "brychi_cart",
    JSON.stringify(cart)
  );
}
/* =========================================================
   UPDATE CART BADGE
========================================================= */
function updateCartBadge() {
  const count =
    getCart().reduce(
      (sum, item) =>
        sum + item.qty,
      0
    );
  document
    .querySelectorAll("#cart-badge")
    .forEach(element => {
      element.textContent =
        count;
    });
}
/* =========================================================
   ADD PRODUCT TO CART
========================================================= */
function addToCart(id) {
  const product =
    PRODUCTS.find(
      product =>
        product.id === id
    );
  if (!product) return;
  const cart =
    getCart();
  const existing =
    cart.find(
      item =>
        item.id === id
    );
  if (existing) {
    existing.qty =
      Math.min(
        existing.qty + 1,
        10
      );
  } else {
    cart.push({
      id: id,
      qty: 1
    });
  }
  saveCart(cart);
  updateCartBadge();
  const button =
    document.querySelector(
      `[data-add="${id}"]`
    );
  if (button) {
    const oldText =
      button.textContent;
    button.textContent =
      "Added ✓";
    setTimeout(() => {
      button.textContent =
        oldText;
    }, 1000);
  }
}
/* =========================================================
   REMOVE PRODUCT FROM CART
========================================================= */
function removeFromCart(id) {
  saveCart(
    getCart().filter(
      item =>
        item.id !== id
    )
  );
  renderCart();
  updateCartBadge();
}
/* =========================================================
   CHANGE CART QUANTITY
========================================================= */
function changeQty(id, delta) {
  const cart =
    getCart();
  const item =
    cart.find(
      item =>
        item.id === id
    );
  if (!item) return;
  item.qty =
    Math.max(
      1,
      Math.min(
        10,
        item.qty + delta
      )
    );
  saveCart(cart);
  renderCart();
  updateCartBadge();
}
/* =========================================================
   FORMAT PRICE
========================================================= */
function formatPrice(price) {
  if (
    price === undefined ||
    price === null ||
    price === "" ||
    Number(price) <= 0
  ) {
    return "Price on request";
  }
  return (
    "₦" +
    Number(price)
      .toLocaleString("en-NG")
  );
}
/* =========================================================
   PRODUCT CARD
========================================================= */
function productCard(product) {
  return `
    <article class="product-card reveal">
      <!-- =================================================
           PRODUCT IMAGE
      ================================================== -->
      <div class="product-image-wrap">
        <img
          src="${escapeHTML(product.image || "")}"
          alt="${escapeHTML(product.name || "Product")}"
          loading="lazy"
        >
      </div>
      <!-- =================================================
           PRODUCT INFORMATION
      ================================================== -->
      <div class="product-info">
        <!-- PRODUCT NAME -->
        <h3>
          ${escapeHTML(
            product.name || "Unnamed Product"
          )}
        </h3>
        <!-- PRODUCT DESCRIPTION -->
        <p>
          ${escapeHTML(
            product.description || ""
          )}
        </p>
        <div class="product-bottom">
          <!-- PRODUCT PRICE -->
          <span class="price">
            ${formatPrice(product.price)}
          </span>
          <div class="product-actions">
            <!-- ADD TO CART -->
            <button
              class="btn btn-primary"
              data-add="${product.id}"
              onclick="addToCart('${product.id}')"
            >
              Add to Cart
            </button>
            <!-- WHATSAPP -->
            <a
              class="btn btn-light"
              target="_blank"
              rel="noopener"
              href="${waLink(
                `Good day Brychi Enterprises, I would like to ask about ${product.name} from your website.`
              )}"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </article>
  `;
}
/* =========================================================
   WHATSAPP LINK
========================================================= */
function waLink(message) {
  return (
    `https://wa.me/${WHATSAPP_NUMBER}` +
    `?text=${encodeURIComponent(message)}`
  );
}
/* =========================================================
   RENDER PRODUCTS
========================================================= */
function renderProducts(list = PRODUCTS) {
  const grid =
    document.querySelector(
      "#product-list"
    );
  if (!grid) return;
  if (!list.length) {
    grid.innerHTML = `
      <div
        class="empty"
        style="grid-column:1/-1"
      >
        No products available at the moment.
      </div>
    `;
    return;
  }
  grid.innerHTML =
    list
      .map(productCard)
      .join("");
  initReveal();
}
/* =========================================================
   INITIALIZE SHOP
========================================================= */
async function initShop() {
  const grid =
    document.querySelector(
      "#product-list"
    );
  if (!grid) return;
  /*
    Show loading message while Firebase
    retrieves the products.
  */
  grid.innerHTML = `
    <div
      class="empty"
      style="grid-column:1/-1"
    >
      Loading products...
    </div>
  `;
  /*
    Get products from Firestore.
  */
  const products =
    await getProducts();
  /*
    Display products.
  */
  renderProducts(products);
  /* =======================================================
     SEARCH
  ======================================================== */
  const search =
    document.querySelector(
      "#search-input"
    );
  if (search) {
    search.addEventListener(
      "input",
      () => {
        const searchText =
          search.value
            .trim()
            .toLowerCase();
        const filtered =
          PRODUCTS.filter(product => {
            const name =
              String(
                product.name || ""
              ).toLowerCase();
            const description =
              String(
                product.description || ""
              ).toLowerCase();
            return (
              name.includes(searchText) ||
              description.includes(searchText)
            );
          });
        renderProducts(filtered);
      }
    );
  }
}
/* =========================================================
   RENDER CART
========================================================= */
async function renderCart() {
  const list =
    document.querySelector(
      "#cart-list"
    );
  const summary =
    document.querySelector(
      "#cart-summary"
    );
  if (!list) return;
  /*
    Make sure Firebase products are loaded
    before displaying the cart.
  */
  const products =
    await getProducts();
  const cart =
    getCart();
  if (!cart.length) {
    list.innerHTML = `
      <div class="empty">
        Your cart is empty.
        <br>
        <a
          class="btn btn-primary"
          href="shop.html"
          style="margin-top:16px"
        >
          Browse Products
        </a>
      </div>
    `;
    if (summary) {
      summary.innerHTML = `
        <h2>
          Order Summary
        </h2>
        <p class="summary-line">
          No items selected.
        </p>
      `;
    }
    return;
  }
  list.innerHTML =
    cart
      .map(item => {
        const product =
          products.find(
            product =>
              product.id === item.id
          );
        /*
          If a product was deleted from Firestore,
          don't display it.
        */
        if (!product) return "";
        return `
          <div class="cart-row">
            <img
              src="${escapeHTML(product.image || "")}"
              alt="${escapeHTML(product.name || "Product")}"
            >
            <div>
              <strong>
                ${escapeHTML(product.name || "Product")}
              </strong>
              <div class="catalog-meta">
                ${formatPrice(product.price)}
              </div>
            </div>
            <div class="qty">
              <button
                type="button"
                onclick="changeQty('${product.id}',-1)"
              >
                −
              </button>
              <strong>
                ${item.qty}
              </strong>
              <button
                type="button"
                onclick="changeQty('${product.id}',1)"
              >
                +
              </button>
            </div>
            <button
              class="remove"
              type="button"
              onclick="removeFromCart('${product.id}')"
            >
              Remove
            </button>
          </div>
        `;
      })
      .join("");
  /*
    Calculate product total.
  */
  const knownTotal =
    cart.reduce(
      (sum, item) => {
        const product =
          products.find(
            product =>
              product.id === item.id
          );
        return (
          sum +
          (Number(product?.price) || 0) *
          item.qty
        );
      },
      0
    );
  if (summary) {
    summary.innerHTML = `
      <h2>
        Order Summary
      </h2>
      <div class="summary-line">
        <span>
          Items
        </span>
        <span>
          ${cart.reduce(
            (sum, item) =>
              sum + item.qty,
            0
          )}
        </span>
      </div>
      <div class="summary-line">
        <span>
          Products
        </span>
        <span>
          ${
            knownTotal
              ? formatPrice(knownTotal)
              : "To be confirmed"
          }
        </span>
      </div>
      <div class="summary-line">
        <span>
          Delivery
        </span>
        <span id="delivery-summary">
          To be confirmed
        </span>
      </div>
      <div class="summary-line summary-total">
        <span>
          Total
        </span>
        <span>
          ${
            knownTotal
              ? formatPrice(knownTotal)
              : "To be confirmed"
          }
        </span>
      </div>
      <div class="delivery-choice">
        <div
          class="choice active"
          data-delivery="delivery"
        >
          Delivery
        </div>
        <div
          class="choice"
          data-delivery="pickup"
        >
          Pickup
        </div>
      </div>
      <div
        id="delivery-fields"
        class="form-grid"
      >
        <div class="field">
          <label>
            Full name
          </label>
          <input
            id="cust-name"
            placeholder="Your name"
          >
        </div>
        <div class="field">
          <label>
            Phone / WhatsApp
          </label>
          <input
            id="cust-phone"
            placeholder="080..."
          >
        </div>
        <div class="field">
          <label>
            Email
          </label>
          <input
            id="cust-email"
            type="email"
            placeholder="you@example.com"
          >
        </div>
        <div class="field">
          <label>
            Delivery address
          </label>
          <textarea
            id="cust-address"
            rows="3"
            placeholder="Address, state and landmark"
          ></textarea>
        </div>
      </div>
      <button
        class="btn btn-primary"
        id="checkout-wa"
        style="width:100%;margin-top:18px"
      >
        Complete Order on WhatsApp
      </button>
    `;
    bindCheckout();
  }
}
/* =========================================================
   CHECKOUT
========================================================= */
function bindCheckout() {
  const choices =
    document.querySelectorAll(
      ".choice"
    );
  choices.forEach(choice => {
    choice.onclick = () => {
      choices.forEach(
        item =>
          item.classList.remove(
            "active"
          )
      );
      choice.classList.add(
        "active"
      );
      const fields =
        document.querySelector(
          "#delivery-fields"
        );
      if (fields) {
        fields.classList.toggle(
          "hidden",
          choice.dataset.delivery === "pickup"
        );
      }
    };
  });
  const button =
    document.querySelector(
      "#checkout-wa"
    );
  if (button) {
    button.onclick = () => {
      const cart =
        getCart();
      const mode =
        document.querySelector(
          ".choice.active"
        )?.dataset.delivery ||
        "delivery";
      const name =
        document.querySelector(
          "#cust-name"
        )?.value.trim() ||
        "Not provided";
      const phone =
        document.querySelector(
          "#cust-phone"
        )?.value.trim() ||
        "Not provided";
      const email =
        document.querySelector(
          "#cust-email"
        )?.value.trim() ||
        "Not provided";
      const address =
        document.querySelector(
          "#cust-address"
        )?.value.trim() ||
        "Pickup selected";
      const lines =
        cart
          .map(item => {
            const product =
              PRODUCTS.find(
                product =>
                  product.id === item.id
              );
            return (
              `• ${product?.name || item.id}` +
              ` × ${item.qty}`
            );
          })
          .join("\n");
      const message = `Good day Brychi Enterprises,
I would like to place an order from your website.
ITEMS:
${lines}
ORDER TYPE: ${mode}
NAME: ${name}
PHONE: ${phone}
EMAIL: ${email}
ADDRESS: ${address}
Please confirm availability, delivery fee (if applicable), and the final total. Thank you.`;
      window.open(
        waLink(message),
        "_blank"
      );
    };
  }
}
/* =========================================================
   REVEAL ANIMATIONS
========================================================= */
function initReveal() {
  const items =
    document.querySelectorAll(
      ".reveal:not(.visible)"
    );
  if (
    !(
      "IntersectionObserver"
      in window
    )
  ) {
    items.forEach(
      item =>
        item.classList.add(
          "visible"
        )
    );
    return;
  }
  const observer =
    new IntersectionObserver(
      entries => {
        entries.forEach(
          entry => {
            if (
              entry.isIntersecting
            ) {
              entry.target.classList.add(
                "visible"
              );
              observer.unobserve(
                entry.target
              );
            }
          }
        );
      },
      {
        threshold: 0.12
      }
    );
  items.forEach(
    item =>
      observer.observe(item)
  );
}
/* =========================================================
   HTML ESCAPING
   ---------------------------------------------------------
   Protects product names/descriptions from being treated
   as HTML when they come from Firestore.
========================================================= */
function escapeHTML(value) {
  return String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}
/* =========================================================
   MAKE CART FUNCTIONS AVAILABLE TO HTML
   ---------------------------------------------------------
   Your buttons use onclick="addToCart(...)"
   so these functions need to be attached to window.
========================================================= */
window.addToCart =
  addToCart;
window.removeFromCart =
  removeFromCart;
window.changeQty =
  changeQty;
/* =========================================================
   PAGE INITIALIZATION
========================================================= */
document.addEventListener(
  "DOMContentLoaded",
  () => {
    /* MOBILE MENU */
    const menu =
      document.querySelector(
        "#menu-btn"
      );
    const nav =
      document.querySelector(
        "#nav-links"
      );
    if (menu && nav) {
      menu.onclick = () => {
        nav.classList.toggle(
          "open"
        );
      };
    }
    /* CART BADGE */
    updateCartBadge();
    /* REVEAL ANIMATIONS */
    initReveal();
    /* SHOP PAGE */
    if (
      document.querySelector(
        "#product-list"
      )
    ) {
      initShop();
    }
    /* CART PAGE */
    if (
      document.querySelector(
        "#cart-list"
      )
    ) {
      renderCart();
    }
  }
);
