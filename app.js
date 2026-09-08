/* =========================================================
   BRYCHI ENTERPRISES — SHARED FRONTEND JAVASCRIPT
   ---------------------------------------------------------
   FEATURES:
   - Products loaded from Firebase Firestore
   - Images loaded from Cloudinary
   - Only active products are displayed
   - Search works
   - Shows 6 products initially
   - "See More Products" loads 6 more at a time
   - Full product description hidden by default
   - Tap/click product image to show description
   - Only one product description opens at a time
   - Cart uses localStorage
   - WhatsApp ordering remains available
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
  query
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


/* =========================================================
   EDITABLE WHATSAPP NUMBER
========================================================= */

const WHATSAPP_NUMBER = "2348023139293";


/* =========================================================
   PRODUCT DISPLAY SETTINGS
========================================================= */

const PRODUCTS_PER_PAGE = 6;


/* =========================================================
   PRODUCT DATA
========================================================= */

let PRODUCTS = [];


/* =========================================================
   PRODUCT DISPLAY STATE
========================================================= */

let displayedProductCount = PRODUCTS_PER_PAGE;

let currentProductList = [];


/* =========================================================
   GET PRODUCTS FROM FIRESTORE
========================================================= */

async function getProducts() {

  await firebaseReady;

  try {

    const productsQuery =
      query(
        collection(db, "products")
      );

    const snapshot =
      await getDocs(productsQuery);


    PRODUCTS =
      snapshot.docs
        .map(document => ({
          id: document.id,
          ...document.data()
        }))
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

      element.textContent = count;

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
   CREATE SHORT DESCRIPTION
========================================================= */

function getShortDescription(description) {

  const text =
    String(description || "").trim();


  if (!text) {

    return "Tap image for more details.";
  }


  const maxLength = 70;


  if (text.length <= maxLength) {

    return text;
  }


  return (
    text.substring(0, maxLength).trim() +
    "..."
  );
}


/* =========================================================
   PRODUCT CARD
========================================================= */

function productCard(product) {

  const productId =
    escapeHTML(
      product.id || ""
    );


  const image =
    escapeHTML(
      product.image || ""
    );


  const name =
    escapeHTML(
      product.name ||
      "Unnamed Product"
    );


  const fullDescription =
    escapeHTML(
      product.description ||
      "No description available."
    );


  const shortDescription =
    escapeHTML(
      getShortDescription(
        product.description
      )
    );


  return `
    <article
      class="product-card reveal"
      data-product-card="${productId}"
    >

      <div
        class="product-image-wrap product-image-toggle"
        data-product-toggle="${productId}"
        role="button"
        tabindex="0"
        aria-expanded="false"
        aria-label="View details for ${name}"
      >

        <img
          src="${image}"
          alt="${name}"
          loading="lazy"
        >

        <div class="product-image-hint">
          Tap image for details
        </div>

      </div>


      <div class="product-info">

        <h3>
          ${name}
        </h3>


        <p class="product-short-description">
          ${shortDescription}
        </p>


        <div
          class="product-full-description"
          data-product-description="${productId}"
          hidden
        >

          ${fullDescription}

        </div>


        <div class="product-bottom">

          <span class="price">
            ${formatPrice(product.price)}
          </span>


          <div class="product-actions">

            <button
              class="btn btn-primary"
              data-add="${productId}"
              onclick="addToCart('${productId}')"
            >
              Add to Cart
            </button>


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
   TOGGLE PRODUCT DESCRIPTION
========================================================= */

function toggleProductDescription(productId) {

  const description =
    document.querySelector(
      `[data-product-description="${CSS.escape(productId)}"]`
    );


  const toggle =
    document.querySelector(
      `[data-product-toggle="${CSS.escape(productId)}"]`
    );


  if (!description || !toggle) return;


  const isOpen =
    !description.hasAttribute("hidden");


  /* -------------------------------------------------------
     Close every product first
  ------------------------------------------------------- */

  document
    .querySelectorAll(
      ".product-full-description"
    )
    .forEach(item => {

      item.hidden = true;

    });


  document
    .querySelectorAll(
      ".product-image-toggle"
    )
    .forEach(item => {

      item.setAttribute(
        "aria-expanded",
        "false"
      );

    });


  /* -------------------------------------------------------
     If already open, leave it closed
  ------------------------------------------------------- */

  if (isOpen) {

    return;
  }


  /* -------------------------------------------------------
     Open selected product
  ------------------------------------------------------- */

  description.hidden = false;


  toggle.setAttribute(
    "aria-expanded",
    "true"
  );


  setTimeout(() => {

    description.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });

  }, 50);
}


/* =========================================================
   BIND PRODUCT IMAGE CLICKS
========================================================= */

function bindProductDescriptionToggles() {

  document
    .querySelectorAll(
      ".product-image-toggle"
    )
    .forEach(toggle => {

      const productId =
        toggle.dataset.productToggle;


      if (!productId) return;


      /* Mouse / touch */

      toggle.addEventListener(
        "click",
        () => {

          toggleProductDescription(
            productId
          );

        }
      );


      /* Keyboard accessibility */

      toggle.addEventListener(
        "keydown",
        event => {

          if (
            event.key === "Enter" ||
            event.key === " "
          ) {

            event.preventDefault();


            toggleProductDescription(
              productId
            );

          }

        }
      );

    });
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
   ---------------------------------------------------------
   Shows only the current number of products.

   Example:
   6 → 12 → 18 → 24 → 30 → 32
========================================================= */

function renderProducts(
  list = PRODUCTS,
  resetCount = false
) {

  const grid =
    document.querySelector(
      "#product-list"
    );


  if (!grid) return;


  /* -------------------------------------------------------
     Remember the current list.
     This is important for search + See More.
  ------------------------------------------------------- */

  currentProductList =
    Array.isArray(list)
      ? list
      : [];


  /* -------------------------------------------------------
     Reset to first 6 products when a new list is rendered.
  ------------------------------------------------------- */

  if (resetCount) {

    displayedProductCount =
      PRODUCTS_PER_PAGE;

  }


  if (!currentProductList.length) {

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


  /* -------------------------------------------------------
     Get products that should currently be visible.
  ------------------------------------------------------- */

  const visibleProducts =
    currentProductList.slice(
      0,
      displayedProductCount
    );


  /* -------------------------------------------------------
     Create product cards.
  ------------------------------------------------------- */

  grid.innerHTML =
    visibleProducts
      .map(productCard)
      .join("");


  /* -------------------------------------------------------
     SEE MORE BUTTON
     Only appears when more products remain.
  ------------------------------------------------------- */

  if (
    displayedProductCount <
    currentProductList.length
  ) {

    const remaining =
      currentProductList.length -
      displayedProductCount;


    const button =
      document.createElement(
        "div"
      );


    button.className =
      "products-more-wrap";


    button.style.gridColumn =
      "1 / -1";


    button.style.textAlign =
      "center";


    button.style.marginTop =
      "30px";


    button.innerHTML = `
      <button
        type="button"
        class="btn btn-primary see-more-products"
        id="see-more-products"
      >
        See More Products
      </button>
    `;


    grid.appendChild(button);


    const seeMore =
      document.querySelector(
        "#see-more-products"
      );


    if (seeMore) {

      seeMore.addEventListener(
        "click",
        () => {

          showMoreProducts();

        }
      );

    }

  }


  /* -------------------------------------------------------
     Enable product image descriptions.
  ------------------------------------------------------- */

  bindProductDescriptionToggles();


  /* -------------------------------------------------------
     Enable reveal animations.
  ------------------------------------------------------- */

  initReveal();
}


/* =========================================================
   SHOW MORE PRODUCTS
========================================================= */

function showMoreProducts() {

  /* -------------------------------------------------------
     Add another 6 products.
  ------------------------------------------------------- */

  displayedProductCount +=
    PRODUCTS_PER_PAGE;


  /* -------------------------------------------------------
     Re-render current list.
  ------------------------------------------------------- */

  renderProducts(
    currentProductList,
    false
  );
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


  grid.innerHTML = `
    <div
      class="empty"
      style="grid-column:1/-1"
    >
      Loading products...
    </div>
  `;


  const products =
    await getProducts();


  /* -------------------------------------------------------
     Start with only 6 products.
  ------------------------------------------------------- */

  displayedProductCount =
    PRODUCTS_PER_PAGE;


  currentProductList =
    products;


  renderProducts(
    products,
    false
  );


  /* -------------------------------------------------------
     SEARCH
  ------------------------------------------------------- */

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
          PRODUCTS.filter(
            product => {

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

            }
          );


        /* -------------------------------------------------
           Search results start from the beginning.
        ------------------------------------------------- */

        displayedProductCount =
          PRODUCTS_PER_PAGE;


        currentProductList =
          filtered;


        renderProducts(
          filtered,
          false
        );

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


        if (!product) return "";


        return `
          <div class="cart-row">

            <img
              src="${escapeHTML(product.image || "")}"
              alt="${escapeHTML(product.name || "Product")}"
            >


            <div>

              <strong>
                ${escapeHTML(
                  product.name ||
                  "Product"
                )}
              </strong>


              <div class="catalog-meta">
                ${formatPrice(
                  product.price
                )}
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
              ? formatPrice(
                  knownTotal
                )
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
              ? formatPrice(
                  knownTotal
                )
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
          choice.dataset.delivery ===
            "pickup"
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


      const message =
`Good day Brychi Enterprises,
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

    /* -----------------------------------------------------
       MOBILE MENU
    ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       CART BADGE
    ----------------------------------------------------- */

    updateCartBadge();


    /* -----------------------------------------------------
       REVEAL ANIMATIONS
    ----------------------------------------------------- */

    initReveal();


    /* -----------------------------------------------------
       SHOP PAGE
    ----------------------------------------------------- */

    if (
      document.querySelector(
        "#product-list"
      )
    ) {

      initShop();

    }


    /* -----------------------------------------------------
       CART PAGE
    ----------------------------------------------------- */

    if (
      document.querySelector(
        "#cart-list"
      )
    ) {

      renderCart();

    }

  }
);