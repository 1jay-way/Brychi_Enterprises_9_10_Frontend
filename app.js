import { db, firebaseReady } from "./firebase-config.js";
import {
  collection,
  getDocs,
  query
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const WHATSAPP_NUMBER = "2348023139293";
const PRODUCTS_PER_PAGE = 6;

let PRODUCTS = [];
let displayedProductCount = PRODUCTS_PER_PAGE;
let currentProductList = [];

/* =========================================================
   LOAD PRODUCTS
   ========================================================= */

async function getProducts() {
  await firebaseReady;

  try {
    const productsQuery = query(
      collection(db, "products")
    );

    const snapshot = await getDocs(productsQuery);

    PRODUCTS = snapshot.docs
      .map(document => ({
        id: document.id,
        ...document.data()
      }))
      .filter(product => product.active !== false)
      .sort((a, b) => {
        const orderA = Number(a.sortOrder);
        const orderB = Number(b.sortOrder);

        if (
          Number.isFinite(orderA) &&
          Number.isFinite(orderB)
        ) {
          return orderA - orderB;
        }

        if (Number.isFinite(orderA)) return -1;
        if (Number.isFinite(orderB)) return 1;

        return 0;
      });

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
   CART
   ========================================================= */

const CART_KEY = "brychi_cart";

function getCart() {
  try {
    const savedCart =
      localStorage.getItem(CART_KEY);

    if (!savedCart) {
      return [];
    }

    const cart = JSON.parse(savedCart);

    return Array.isArray(cart) ? cart : [];
  } catch (error) {
    console.error(
      "Unable to read cart:",
      error
    );

    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(
    CART_KEY,
    JSON.stringify(cart)
  );

  updateCartBadge();
}

function updateCartBadge() {
  const badge =
    document.getElementById("cart-badge");

  if (!badge) return;

  const cart = getCart();

  const count = cart.reduce(
    (total, item) =>
      total + Number(item.quantity || 0),
    0
  );

  badge.textContent = count;
}

/* =========================================================
   ADD TO CART
   ========================================================= */

function addToCart(productId) {
  if (!productId) {
    console.error(
      "Add to Cart: Product ID is missing."
    );
    return;
  }

  const product = PRODUCTS.find(
    item =>
      String(item.id) ===
      String(productId)
  );

  if (!product) {
    console.error(
      "Add to Cart: Product not found.",
      productId
    );
    return;
  }

  const cart = getCart();

  const existing = cart.find(
    item =>
      String(item.id) ===
      String(productId)
  );

  if (existing) {
    existing.quantity =
      Number(existing.quantity || 0) + 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      priceType:
        product.priceType || "fixed",
      priceMin: product.priceMin,
      priceMax: product.priceMax,
      image: product.image,
      quantity: 1
    });
  }

  saveCart(cart);

  console.log(
    "Added to cart:",
    product.name
  );
}

/* =========================================================
   REMOVE FROM CART
   ========================================================= */

function removeFromCart(productId) {
  const cart = getCart().filter(
    item =>
      String(item.id) !==
      String(productId)
  );

  saveCart(cart);
  renderCart();
}

/* =========================================================
   CHANGE QUANTITY
   ========================================================= */

function changeQty(productId, change) {
  const cart = getCart();

  const item = cart.find(
    product =>
      String(product.id) ===
      String(productId)
  );

  if (!item) return;

  item.quantity =
    Number(item.quantity || 0) +
    Number(change);

  if (item.quantity <= 0) {
    const index = cart.indexOf(item);

    if (index !== -1) {
      cart.splice(index, 1);
    }
  }

  saveCart(cart);
  renderCart();
}

/* =========================================================
   PRODUCT HELPERS
   ========================================================= */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatPrice(product) {
  if (
    product.priceType === "range" &&
    Number.isFinite(
      Number(product.priceMin)
    ) &&
    Number.isFinite(
      Number(product.priceMax)
    )
  ) {
    return `₦${Number(
      product.priceMin
    ).toLocaleString()} - ₦${Number(
      product.priceMax
    ).toLocaleString()}`;
  }

  if (
    product.price == null ||
    product.price === ""
  ) {
    return "";
  }

  const numericPrice =
    Number(product.price);

  if (!Number.isFinite(numericPrice)) {
    return "";
  }

  return `₦${numericPrice.toLocaleString()}`;
}

function getWhatsAppUrl(product) {
  const message =
    `Hello Brychi Enterprises, I am interested in ${product.name}. ` +
    `Please provide more information.`;

  return (
    `https://wa.me/${WHATSAPP_NUMBER}?text=` +
    encodeURIComponent(message)
  );
}

/* =========================================================
   PRODUCT RENDERING
   ========================================================= */

function renderProducts(
  list = PRODUCTS,
  resetCount = false
) {
  const container =
    document.getElementById(
      "product-list"
    );

  if (!container) return;

  if (resetCount) {
    displayedProductCount =
      PRODUCTS_PER_PAGE;
  }

  currentProductList = list;

  if (!list.length) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No products found</h3>
        <p>Try searching for another product.</p>
      </div>
    `;

    return;
  }

  const visibleProducts =
    list.slice(
      0,
      displayedProductCount
    );

  container.innerHTML =
    visibleProducts
      .map((product, index) => {
        const description =
          product.description || "";

        return `
          <article class="product-card reveal">

            <div
              class="product-image-wrap"
              data-description-toggle="${escapeHTML(
                product.id
              )}"
              role="button"
              tabindex="0"
              aria-label="View description for ${escapeHTML(
                product.name
              )}"
            >
              <img
                src="${escapeHTML(
                  product.image || ""
                )}"
                alt="${escapeHTML(
                  product.name
                )}"
                class="product-image"
                loading="${
                  index < 2
                    ? "eager"
                    : "lazy"
                }"
              >

              <div class="image-hint">
                Tap image for details
              </div>
            </div>

            <div class="product-content">

              <h3 class="product-title">
                ${escapeHTML(
                  product.name
                )}
              </h3>

              <div
                class="product-description"
                id="description-${escapeHTML(
                  product.id
                )}"
                hidden
              >
                ${escapeHTML(
                  description
                )}
              </div>

              <div class="product-bottom">

                <div class="product-price">
                  ${formatPrice(
                    product
                  )}
                </div>

                <div class="product-actions">

                  <button
                    class="btn btn-primary add-cart-btn"
                    type="button"
                    data-product-id="${escapeHTML(
                      product.id
                    )}"
                  >
                    Add to Cart
                  </button>

                  <a
                    class="btn btn-secondary"
                    href="${getWhatsAppUrl(
                      product
                    )}"
                    target="_blank"
                    rel="noopener"
                  >
                    WhatsApp
                  </a>

                </div>

              </div>

            </div>

          </article>
        `;
      })
      .join("");

  if (
    visibleProducts.length <
    list.length
  ) {
    container.insertAdjacentHTML(
      "beforeend",
      `
        <div class="see-more-wrap">

          <button
            id="see-more-products"
            class="btn btn-primary"
            type="button"
          >
            See More Products
          </button>

        </div>
      `
    );
  }

  bindProductEvents();
  observeReveals();
}

/* =========================================================
   PRODUCT EVENTS
   ========================================================= */

function bindProductEvents() {
  const container =
    document.getElementById(
      "product-list"
    );

  if (!container) return;

  /*
    Only bind this once.

    Product cards are dynamically recreated when:
    - searching
    - clicking See More
    - rendering products

    Event delegation means Add to Cart continues
    working after every re-render.
  */

  if (
    container.dataset.eventsBound ===
    "true"
  ) {
    return;
  }

  container.dataset.eventsBound =
    "true";

  container.addEventListener(
    "click",
    event => {

      /* ===============================================
         ADD TO CART
         =============================================== */

      const addButton =
        event.target.closest(
          ".add-cart-btn"
        );

      if (addButton) {
        event.preventDefault();
        event.stopPropagation();

        const productId =
          addButton.getAttribute(
            "data-product-id"
          );

        addToCart(productId);

        const originalText =
          addButton.textContent;

        addButton.textContent =
          "Added ✓";

        setTimeout(() => {
          if (
            addButton.isConnected
          ) {
            addButton.textContent =
              originalText;
          }
        }, 1000);

        return;
      }

      /* ===============================================
         SEE MORE
         =============================================== */

      const seeMoreButton =
        event.target.closest(
          "#see-more-products"
        );

      if (seeMoreButton) {
        event.preventDefault();
        event.stopPropagation();

        displayedProductCount +=
          PRODUCTS_PER_PAGE;

        renderProducts(
          currentProductList
        );

        return;
      }

      /* ===============================================
         PRODUCT IMAGE DETAILS
         =============================================== */

      const imageElement =
        event.target.closest(
          "[data-description-toggle]"
        );

      if (imageElement) {
        const id =
          imageElement.dataset
            .descriptionToggle;

        const description =
          document.getElementById(
            `description-${CSS.escape(
              id
            )}`
          );

        if (!description) return;

        description.hidden =
          !description.hidden;

        imageElement.classList.toggle(
          "description-open",
          !description.hidden
        );
      }
    }
  );

  /* ===============================================
     KEYBOARD ACCESS
     =============================================== */

  container.addEventListener(
    "keydown",
    event => {
      const imageElement =
        event.target.closest(
          "[data-description-toggle]"
        );

      if (!imageElement) return;

      if (
        event.key !== "Enter" &&
        event.key !== " "
      ) {
        return;
      }

      event.preventDefault();

      const id =
        imageElement.dataset
          .descriptionToggle;

      const description =
        document.getElementById(
          `description-${CSS.escape(
            id
          )}`
        );

      if (!description) return;

      description.hidden =
        !description.hidden;

      imageElement.classList.toggle(
        "description-open",
        !description.hidden
      );
    }
  );
}

/* =========================================================
   SHOP SEARCH
   ========================================================= */

function initializeShop() {
  const searchInput =
    document.getElementById(
      "search-input"
    );

  if (!searchInput) return;

  if (
    searchInput.dataset.eventsBound ===
    "true"
  ) {
    return;
  }

  searchInput.dataset.eventsBound =
    "true";

  searchInput.addEventListener(
    "input",
    event => {
      const searchTerm =
        event.target.value
          .trim()
          .toLowerCase();

      const filteredProducts =
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
            name.includes(
              searchTerm
            ) ||
            description.includes(
              searchTerm
            )
          );
        });

      renderProducts(
        filteredProducts,
        true
      );
    }
  );
}

/* =========================================================
   CART PAGE
   ========================================================= */

function renderCart() {
  const cartList =
    document.getElementById(
      "cart-list"
    );

  if (!cartList) return;

  const cart = getCart();

  if (!cart.length) {
    cartList.innerHTML = `
      <div class="empty-state">
        <h3>Your cart is empty</h3>
        <p>Add products from the shop to get started.</p>
      </div>
    `;

    updateCartSummary();

    return;
  }

  cartList.innerHTML =
    cart
      .map(item => {
        const price =
          Number(item.price);

        const hasValidPrice =
          Number.isFinite(price);

        const subtotal =
          hasValidPrice
            ? price *
              Number(
                item.quantity || 0
              )
            : 0;

        return `
          <div class="cart-item">

            <div class="cart-item-image">
              <img
                src="${escapeHTML(
                  item.image || ""
                )}"
                alt="${escapeHTML(
                  item.name
                )}"
              >
            </div>

            <div class="cart-item-info">

              <h3>
                ${escapeHTML(
                  item.name
                )}
              </h3>

              ${
                hasValidPrice
                  ? `
                    <p>
                      ₦${price.toLocaleString()}
                    </p>
                  `
                  : ""
              }

              <div class="cart-quantity">

                <button
                  type="button"
                  class="qty-btn"
                  data-product-id="${escapeHTML(
                    item.id
                  )}"
                  data-change="-1"
                >
                  −
                </button>

                <span>
                  ${Number(
                    item.quantity || 0
                  )}
                </span>

                <button
                  type="button"
                  class="qty-btn"
                  data-product-id="${escapeHTML(
                    item.id
                  )}"
                  data-change="1"
                >
                  +
                </button>

              </div>

              ${
                hasValidPrice
                  ? `
                    <strong>
                      ₦${subtotal.toLocaleString()}
                    </strong>
                  `
                  : ""
              }

              <button
                type="button"
                class="remove-cart-btn"
                data-product-id="${escapeHTML(
                  item.id
                )}"
              >
                Remove
              </button>

            </div>

          </div>
        `;
      })
      .join("");

  /* ===============================================
     QUANTITY BUTTONS
     =============================================== */

  cartList
    .querySelectorAll(".qty-btn")
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          changeQty(
            button.dataset
              .productId,
            Number(
              button.dataset.change
            )
          );
        }
      );
    });

  /* ===============================================
     REMOVE BUTTONS
     =============================================== */

  cartList
    .querySelectorAll(
      ".remove-cart-btn"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          removeFromCart(
            button.dataset
              .productId
          );
        }
      );
    });

  updateCartSummary();
}

/* =========================================================
   CART SUMMARY
   ========================================================= */

function updateCartSummary() {
  const cart = getCart();

  const subtotal =
    cart.reduce(
      (total, item) => {
        const price =
          Number(item.price);

        if (
          !Number.isFinite(price)
        ) {
          return total;
        }

        return (
          total +
          price *
            Number(
              item.quantity || 0
            )
        );
      },
      0
    );

  const subtotalElement =
    document.getElementById(
      "cart-subtotal"
    );

  const totalElement =
    document.getElementById(
      "cart-total"
    );

  if (subtotalElement) {
    subtotalElement.textContent =
      `₦${subtotal.toLocaleString()}`;
  }

  if (totalElement) {
    totalElement.textContent =
      `₦${subtotal.toLocaleString()}`;
  }
}

/* =========================================================
   CHECKOUT
   ========================================================= */

function initializeCheckout() {
  const checkoutButton =
    document.getElementById(
      "checkout-btn"
    );

  if (!checkoutButton) return;

  if (
    checkoutButton.dataset.eventsBound ===
    "true"
  ) {
    return;
  }

  checkoutButton.dataset.eventsBound =
    "true";

  checkoutButton.addEventListener(
    "click",
    () => {
      const cart = getCart();

      if (!cart.length) {
        return;
      }

      const lines =
        cart.map(item => {
          const price =
            Number(item.price);

          const priceText =
            Number.isFinite(price)
              ? `₦${price.toLocaleString()}`
              : "";

          return (
            `${item.name} x${item.quantity}` +
            (priceText
              ? ` — ${priceText}`
              : "")
          );
        });

      const message =
        `Hello Brychi Enterprises, I would like to order:\n\n` +
        lines.join("\n") +
        `\n\nPlease confirm availability and delivery fee.`;

      const url =
        `https://wa.me/${WHATSAPP_NUMBER}?text=` +
        encodeURIComponent(
          message
        );

      window.open(
        url,
        "_blank"
      );
    }
  );
}

/* =========================================================
   MOBILE MENU
   ========================================================= */

function initializeMenu() {
  const menuButton =
    document.getElementById(
      "menu-btn"
    );

  const navLinks =
    document.getElementById(
      "nav-links"
    );

  if (
    !menuButton ||
    !navLinks
  ) {
    return;
  }

  if (
    menuButton.dataset.eventsBound ===
    "true"
  ) {
    return;
  }

  menuButton.dataset.eventsBound =
    "true";

  menuButton.addEventListener(
    "click",
    () => {
      navLinks.classList.toggle(
        "open"
      );
    }
  );

  navLinks
    .querySelectorAll("a")
    .forEach(link => {
      link.addEventListener(
        "click",
        () => {
          navLinks.classList.remove(
            "open"
          );
        }
      );
    });
}

/* =========================================================
   REVEAL ANIMATIONS
   ========================================================= */

function observeReveals() {
  const elements =
    document.querySelectorAll(
      ".reveal"
    );

  if (
    !(
      "IntersectionObserver" in
      window
    )
  ) {
    elements.forEach(
      element =>
        element.classList.add(
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
        threshold: 0.08
      }
    );

  elements.forEach(element =>
    observer.observe(element)
  );
}

/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    initializeMenu();

    updateCartBadge();

    observeReveals();

    const productList =
      document.getElementById(
        "product-list"
      );

    /* ===============================================
       SHOP PAGE
       =============================================== */

    if (productList) {

      productList.innerHTML = `
        <div class="loading-state">
          Loading products...
        </div>
      `;

      await getProducts();

      renderProducts(PRODUCTS);

      initializeShop();
    }

    /* ===============================================
       CART PAGE
       =============================================== */

    const cartList =
      document.getElementById(
        "cart-list"
      );

    if (cartList) {

      await getProducts();

      renderCart();

      initializeCheckout();
    }
  }
);

/* =========================================================
   GLOBAL CART FUNCTIONS
   ========================================================= */

window.addToCart = addToCart;
window.removeFromCart =
  removeFromCart;
window.changeQty =
  changeQty;