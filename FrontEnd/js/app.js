"use strict";

const CART_STORAGE_KEY = "cei-pass-demo-cart";
const LAST_QR_ACCOUNT_KEY = "cei-pass-last-qr-account";
const QR_DATABASE_NAME = "cei-pass-private-cache";
const QR_STORE_NAME = "issued-qr";
const QR_ENDPOINT = "/api/v1/me/qr";
const HISTORY_ENDPOINT = "/api/v1/me/usage-history";

const passes = [
  { id: "day-pass", name: "Chiang Rai Day Pass", detail: "1 day · Visit participating attractions", price: 299, tag: "Most popular" },
  { id: "three-day-pass", name: "Explorer Pass", detail: "3 days · More time to explore", price: 599, tag: "Best for a long weekend" },
  { id: "family-pass", name: "Family Pass", detail: "1 day · For up to 4 visitors", price: 999, tag: "For families" }
];

const attractions = [
  { name: "Wat Rong Khun", category: "Temple · Mueang Chiang Rai", initials: "WR", tone: "rose", description: "Discover the striking White Temple and its detailed contemporary artwork." },
  { name: "Baan Dam Museum", category: "Museum · Nang Lae", initials: "BD", tone: "ink", description: "Explore the distinctive art and architecture of the Black House Museum." },
  { name: "Singha Park", category: "Nature · Mae Kon", initials: "SP", tone: "leaf", description: "Take in open landscapes, gardens, and outdoor activities in Chiang Rai." }
];

const appContent = document.querySelector("#app-content");
const cartCount = document.querySelector("#cart-count");
const announcer = document.querySelector("#app-announcer");
const apiBaseUrl = window.CEIPASS_CONFIG?.apiBaseUrl;
let profileMode = "login";
let qrRefreshTimer;

class ApiError extends Error {
  constructor(status) {
    super(`The service returned HTTP ${status}.`);
    this.name = "ApiError";
    this.status = status;
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function formatPrice(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0
  }).format(amount);
}

function readCart() {
  try {
    const value = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("Saved cart has an invalid format.");
    }
    return Object.fromEntries(
      Object.entries(value).filter(([id, quantity]) =>
        passes.some((pass) => pass.id === id) &&
        Number.isInteger(quantity) &&
        quantity > 0 &&
        quantity <= 10
      )
    );
  } catch (error) {
    console.warn("The saved demo cart could not be read.", error);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (storageError) {
      console.warn("The invalid demo cart could not be cleared.", storageError);
    }
    return {};
  }
}

let cart = readCart();

function persistCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartCount();
  } catch (error) {
    console.error("The demo cart could not be saved on this device.", error);
    announce("Your cart changed, but this browser could not save it.");
    updateCartCount();
  }
}

function updateCartCount() {
  const count = Object.values(cart).reduce((total, quantity) => total + quantity, 0);
  cartCount.textContent = String(count);
  cartCount.hidden = count === 0;
}

function announce(message) {
  announcer.textContent = message;
}

function currentPage() {
  const page = window.location.hash.slice(1).split("?")[0];
  return ["home", "buy", "qr", "history", "profile"].includes(page) ? page : "home";
}

function pageHeading(eyebrow, title, description = "") {
  return `<div class="page-heading">
    <p class="eyebrow">${eyebrow}</p>
    <h1>${title}</h1>
    ${description ? `<p class="page-description">${description}</p>` : ""}
  </div>`;
}

function attractionCard(attraction, compact = false) {
  return `<article class="attraction-card${compact ? " attraction-card-compact" : ""}">
    <div class="attraction-art ${attraction.tone}" aria-hidden="true"><span>${attraction.initials}</span></div>
    <div class="attraction-info">
      <p class="card-kicker">${attraction.category}</p>
      <h3>${attraction.name}</h3>
      ${compact ? "" : `<p>${attraction.description}</p>`}
      <span class="partner-label"><span class="partner-dot"></span>Pass partner · Sample listing</span>
    </div>
  </article>`;
}

function homePage() {
  const featured = attractions.map((attraction) => attractionCard(attraction, true)).join("");
  return `<section class="home-page">
    <div class="hero-card">
      <div class="hero-copy">
        <p class="eyebrow eyebrow-light">Your Chiang Rai adventure</p>
        <h1>See more.<br>Worry less.</h1>
        <p>One pass for the places you'll remember.</p>
        <a class="button button-light" href="#buy">Explore passes <span aria-hidden="true">→</span></a>
      </div>
      <div class="hero-sun" aria-hidden="true"></div>
      <div class="hero-hills" aria-hidden="true"><span></span><span></span><span></span></div>
      <span class="hero-stamp" aria-hidden="true">CHIANG<br>RAI · TH</span>
    </div>

    <section class="section-block quick-actions" aria-label="Quick access">
      <a class="quick-card" href="#buy">
        <span class="quick-icon quick-icon-green" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M4 5h16l-1.5 15h-13z"></path><path d="M9 9V7a3 3 0 0 1 6 0v2"></path></svg>
        </span>
        <span><strong>Buy a pass</strong><small>Find your way to more</small></span>
        <span class="card-arrow" aria-hidden="true">→</span>
      </a>
      <a class="quick-card" href="#qr">
        <span class="quick-icon quick-icon-amber" aria-hidden="true">
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><path d="M14 14h3v3h-3zM20 14v2M14 20h2M19 19h2v2h-2z"></path></svg>
        </span>
        <span><strong>My QR pass</strong><small>Ready when you are</small></span>
        <span class="card-arrow" aria-hidden="true">→</span>
      </a>
    </section>

    <section class="section-block">
      <div class="section-title-row">
        <div><p class="eyebrow">Hand-picked for you</p><h2>Explore Chiang Rai</h2></div>
        <span class="sample-pill">Sample partners</span>
      </div>
      <div class="attraction-list">${featured}</div>
    </section>
  </section>`;
}

function cartDetails() {
  const items = Object.entries(cart)
    .map(([id, quantity]) => ({ pass: passes.find((item) => item.id === id), quantity }))
    .filter((entry) => entry.pass);
  const total = items.reduce((sum, entry) => sum + entry.pass.price * entry.quantity, 0);

  if (items.length === 0) {
    return `<div class="cart-empty">
      <span class="cart-empty-icon" aria-hidden="true">+</span>
      <strong>Your cart is waiting</strong>
      <span>Add a pass and it will stay here on this device.</span>
    </div>`;
  }

  return `<div class="cart-lines">
    ${items.map(({ pass, quantity }) => `<div class="cart-line">
      <div class="cart-line-main"><strong>${pass.name}</strong><span>${formatPrice(pass.price)} each</span></div>
      <div class="quantity-control" aria-label="${pass.name} quantity">
        <button type="button" data-action="decrease" data-id="${pass.id}" aria-label="Remove one ${pass.name}">−</button>
        <span>${quantity}</span>
        <button type="button" data-action="increase" data-id="${pass.id}" aria-label="Add one ${pass.name}">+</button>
      </div>
    </div>`).join("")}
    <div class="cart-total"><span>Subtotal</span><strong>${formatPrice(total)}</strong></div>
    <p class="cart-note">The cart is saved on this device. No payment is taken in this preview.</p>
    <button type="button" class="button button-dark button-full" data-action="checkout">Continue to checkout <span aria-hidden="true">→</span></button>
  </div>`;
}

function buyPage() {
  return `<section>
    ${pageHeading("Find your pass", "Choose your way to explore.", "Pick a pass for your trip. Your cart stays saved on this device.")}
    <div class="demo-notice"><span aria-hidden="true">i</span><span><strong>Preview catalog</strong> · Sample passes only. Live prices and availability will come from the API.</span></div>
    <div class="pass-list">
      ${passes.map((pass, index) => `<article class="pass-card">
        <div class="pass-art pass-art-${index + 1}" aria-hidden="true"><span>${["DAY", "GO", "FAM"][index]}</span></div>
        <div class="pass-details">
          <span class="pass-tag">${pass.tag}</span>
          <h2>${pass.name}</h2>
          <p>${pass.detail}</p>
          <div class="pass-buy-row"><strong class="pass-price">${formatPrice(pass.price)}<small> / pass</small></strong>
            <button type="button" class="button button-outline" data-action="add-to-cart" data-id="${pass.id}">Add to cart</button>
          </div>
        </div>
      </article>`).join("")}
    </div>
    <section class="cart-panel" aria-labelledby="cart-title">
      <div class="section-title-row cart-heading"><div><p class="eyebrow">Saved on this device</p><h2 id="cart-title">Your cart <span class="cart-heading-count">${Object.values(cart).reduce((sum, count) => sum + count, 0)}</span></h2></div></div>
      ${cartDetails()}
    </section>
  </section>`;
}

function apiUrl(path) {
  if (!apiBaseUrl) {
    throw new Error("The API address is not configured.");
  }
  return `${apiBaseUrl.replace(/\/+$/, "")}${path}`;
}

async function requestJson(path) {
  const response = await fetch(apiUrl(path), {
    headers: { Accept: "application/json" },
    credentials: "include",
    signal: AbortSignal.timeout(5000)
  });
  if (!response.ok) {
    throw new ApiError(response.status);
  }
  return response.json();
}

function openQrDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("This browser does not support secure local QR caching."));
      return;
    }

    const request = indexedDB.open(QR_DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(QR_STORE_NAME)) {
        request.result.createObjectStore(QR_STORE_NAME, { keyPath: "accountId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open the private QR cache."));
  });
}

async function saveCachedQr(record) {
  const database = await openQrDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(QR_STORE_NAME, "readwrite");
    transaction.objectStore(QR_STORE_NAME).put(record);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error || new Error("Could not save the QR code."));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error || new Error("Saving the QR code was interrupted."));
    };
  });
}

async function getCachedQr(accountId) {
  const database = await openQrDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(QR_STORE_NAME, "readonly");
    const request = transaction.objectStore(QR_STORE_NAME).get(accountId);
    request.onsuccess = () => {
      database.close();
      resolve(request.result || null);
    };
    request.onerror = () => {
      database.close();
      reject(request.error || new Error("Could not read the saved QR code."));
    };
  });
}

async function clearCachedQr(accountId) {
  if (!accountId) return;
  const database = await openQrDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(QR_STORE_NAME, "readwrite");
    transaction.objectStore(QR_STORE_NAME).delete(accountId);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error || new Error("Could not clear the saved QR code."));
    };
  });
}

function renderQrCard(record, isCached) {
  const expiry = new Date(record.expiresAt);
  const remaining = expiry.getTime() - Date.now();
  if (!Number.isFinite(expiry.getTime()) || remaining <= 0) {
    return `<div class="empty-state">
      <span class="empty-icon" aria-hidden="true">!</span>
      <h2>This QR code has expired</h2>
      <p>Connect to the internet to request a fresh code.</p>
      <button type="button" class="button button-outline" data-action="refresh-qr">Try again</button>
    </div>`;
  }

  const imageIsPng = typeof record.qrImageDataUrl === "string" &&
    /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(record.qrImageDataUrl);
  const offlineBanner = isCached
    ? `<div class="offline-banner"><strong>Saved code · not refreshed</strong><span>This device cannot reach the QR service. A disconnected venue may not know if another scanner has already used this code; duplicate acceptance is possible until synchronization.</span></div>`
    : "";
  const passName = escapeHtml(record.passName || "Chiang Rai Pass");

  return `<div class="qr-card">
    ${offlineBanner}
    <div class="qr-card-heading"><span class="live-dot${isCached ? " live-dot-muted" : ""}"></span><span>${isCached ? "Saved on this device" : "Pass ready to scan"}</span></div>
    ${imageIsPng
      ? `<img class="qr-image" src="${record.qrImageDataUrl}" alt="Your short-lived ${passName} QR code">`
      : `<div class="qr-placeholder"><span class="qr-placeholder-icon" aria-hidden="true">▦</span><span>QR image will appear here</span></div>`}
    <h2>${passName}</h2>
    <p class="qr-instruction">Show this code to a participating attraction.</p>
    <p class="qr-expiry" data-expiry="${escapeHtml(record.expiresAt)}">Expires in <strong>--:--</strong></p>
    <p class="qr-safety">This code is private. A screenshot cannot be blocked reliably by a web app. Keep your screen visible only to venue staff; remove saved codes from shared devices.</p>
    <button type="button" class="button button-outline button-full" data-action="refresh-qr"${isCached ? " disabled" : ""}>Refresh code</button>
  </div>`;
}

async function renderQrPage() {
  clearInterval(qrRefreshTimer);
  appContent.innerHTML = `<section>${pageHeading("Your visits", "My QR pass", "Your pass code is personal and expires.")}<div class="loading-panel" role="status">Checking for your pass…</div></section>`;

  let lastAccountId = "";
  try {
    lastAccountId = localStorage.getItem(LAST_QR_ACCOUNT_KEY) || "";
  } catch (error) {
    console.warn("The active QR account could not be read.", error);
  }

  try {
    const record = await requestJson(QR_ENDPOINT);
    if (typeof record.accountId !== "string" ||
        record.accountId.length === 0 ||
        record.accountId.length > 128 ||
        typeof record.expiresAt !== "string" ||
        !Number.isFinite(new Date(record.expiresAt).getTime()) ||
        new Date(record.expiresAt).getTime() <= Date.now() ||
        typeof record.qrImageDataUrl !== "string" ||
        record.qrImageDataUrl.length > 500000 ||
        !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(record.qrImageDataUrl)) {
      throw new Error("The QR service returned an incomplete response.");
    }

    let previousAccountId = "";
    try {
      previousAccountId = localStorage.getItem(LAST_QR_ACCOUNT_KEY) || "";
    } catch (error) {
      console.warn("The active QR account could not be checked.", error);
    }
    if (previousAccountId && previousAccountId !== record.accountId) {
      await clearCachedQr(previousAccountId);
    }

    try {
      await saveCachedQr(record);
      localStorage.setItem(LAST_QR_ACCOUNT_KEY, record.accountId);
    } catch (error) {
      console.error("The short-lived QR could not be cached for offline display.", error);
      announce("Your QR is available online, but could not be saved for offline display.");
    }

    if (currentPage() !== "qr") return;
    appContent.innerHTML = `<section>${pageHeading("Your visits", "My QR pass", "Your pass code is personal and expires.")}${renderQrCard(record, false)}<button class="text-button cache-clear-button" type="button" data-action="clear-qr-cache">Remove saved QR from this device</button></section>`;
    startExpiryCountdown();
  } catch (error) {
    console.warn("A fresh QR could not be loaded.", error);
    if (currentPage() !== "qr") return;

    if (error instanceof ApiError && error.status === 401) {
      try {
        if (lastAccountId) await clearCachedQr(lastAccountId);
        localStorage.removeItem(LAST_QR_ACCOUNT_KEY);
      } catch (cacheError) {
        console.error("The expired account QR could not be removed.", cacheError);
      }
      appContent.innerHTML = `<section>${pageHeading("Your visits", "My QR pass", "Your pass code is personal and expires.")}<div class="empty-state">
        <span class="empty-icon" aria-hidden="true">→</span>
        <h2>Sign in to view your pass</h2>
        <p>Your account session has expired. Sign in again to request a new QR code.</p>
        <a class="button button-dark" href="#profile">Go to profile</a>
      </div></section>`;
      return;
    }

    if (lastAccountId && (!navigator.onLine || error instanceof TypeError)) {
      try {
        const cached = await getCachedQr(lastAccountId);
        if (cached && currentPage() === "qr") {
          const expiresAt = new Date(cached.expiresAt).getTime();
          if (Number.isFinite(expiresAt) && expiresAt > Date.now()) {
            appContent.innerHTML = `<section>${pageHeading("Your visits", "My QR pass", "Your pass code is personal and expires.")}${renderQrCard(cached, true)}<button class="text-button cache-clear-button" type="button" data-action="clear-qr-cache">Remove saved QR from this device</button></section>`;
            startExpiryCountdown();
            return;
          }
        }
      } catch (cacheError) {
        console.error("The saved offline QR could not be read.", cacheError);
      }
    }

    const message = navigator.onLine
      ? "A pass QR service is not available yet. Sign-in and QR APIs must be connected before a personal QR can be shown."
      : "You're offline and no unexpired QR is saved for this account on this device.";
    appContent.innerHTML = `<section>${pageHeading("Your visits", "My QR pass", "Your pass code is personal and expires.")}<div class="empty-state">
      <span class="empty-icon" aria-hidden="true">${navigator.onLine ? "…" : "⌁"}</span>
      <h2>${navigator.onLine ? "Pass not connected yet" : "No offline pass available"}</h2>
      <p>${message}</p>
      <button type="button" class="button button-outline" data-action="refresh-qr"${navigator.onLine ? "" : " disabled"}>Try again</button>
    </div>
    <div class="notice-card notice-card-warning"><strong>About screenshots</strong><span>Browsers cannot reliably prevent screenshots. Short expiry, rotating codes, and server-side single-use validation are the actual safeguards.</span></div>
    <button class="text-button cache-clear-button" type="button" data-action="clear-qr-cache">Remove saved QR from this device</button></section>`;
  }
}

function startExpiryCountdown() {
  clearInterval(qrRefreshTimer);
  const expiryElement = document.querySelector("[data-expiry]");
  if (!expiryElement) return;

  const expiryTime = new Date(expiryElement.dataset.expiry).getTime();
  const update = () => {
    const seconds = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));
    const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
    const remainder = (seconds % 60).toString().padStart(2, "0");
    expiryElement.innerHTML = seconds > 0
      ? `Expires in <strong>${minutes}:${remainder}</strong>`
      : "<strong>QR expired. Refresh online before using it.</strong>";
    if (seconds <= 0) {
      const image = document.querySelector(".qr-image");
      if (image) image.remove();
      clearInterval(qrRefreshTimer);
    }
  };
  update();
  qrRefreshTimer = setInterval(update, 1000);
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date)
    : "Time unavailable";
}

async function renderHistoryPage() {
  appContent.innerHTML = `<section>${pageHeading("Your visits", "Pass history", "A record of where and when your pass was used.")}<div class="loading-panel" role="status">Loading your history…</div></section>`;
  try {
    const history = await requestJson(HISTORY_ENDPOINT);
    if (!Array.isArray(history)) {
      throw new Error("The history service returned an unexpected response.");
    }
    if (currentPage() !== "history") return;

    if (history.length === 0) {
      appContent.innerHTML = `<section>${pageHeading("Your visits", "Pass history", "A record of where and when your pass was used.")}<div class="empty-state">
        <span class="empty-icon" aria-hidden="true">↗</span>
        <h2>Your story starts here</h2>
        <p>Once you use a pass at a partner attraction, your visit will appear here.</p>
        <a class="button button-dark" href="#buy">Explore passes</a>
      </div></section>`;
      return;
    }

    appContent.innerHTML = `<section>${pageHeading("Your visits", "Pass history", "A record of where and when your pass was used.")}<div class="history-list">
      ${history.map((entry) => `<article class="history-item">
        <span class="history-icon" aria-hidden="true">✓</span>
        <div><h2>${escapeHtml(entry.attractionName || "Partner attraction")}</h2><p>${escapeHtml(entry.passName || "Chiang Rai Pass")}</p><time datetime="${escapeHtml(entry.usedAt || "")}">${escapeHtml(formatDate(entry.usedAt))}</time></div>
      </article>`).join("")}
    </div></section>`;
  } catch (error) {
    console.warn("Pass history could not be loaded.", error);
    if (currentPage() !== "history") return;
    const signInRequired = error instanceof ApiError && error.status === 401;
    appContent.innerHTML = `<section>${pageHeading("Your visits", "Pass history", "A record of where and when your pass was used.")}<div class="empty-state empty-state-error">
      <span class="empty-icon" aria-hidden="true">!</span>
      <h2>${signInRequired ? "Sign in to view your history" : "History isn't connected yet"}</h2>
      <p>${signInRequired ? "Your account session has expired. Sign in again to view your visits." : "Sign-in and usage-history API support are needed before visit records can be displayed."}</p>
      <a class="button button-outline" href="#profile">Go to profile</a>
    </div></section>`;
  }
}

function profilePage() {
  const registration = profileMode === "register";
  return `<section>
    ${pageHeading("Your account", "Make it yours.", registration ? "Create an account to keep your pass close." : "Sign in to find your passes and trips.")}
    <div class="profile-card">
      <div class="profile-tabs" role="tablist" aria-label="Account access">
        <button type="button" role="tab" aria-controls="account-form" aria-selected="${!registration}" class="${!registration ? "is-active" : ""}" data-action="profile-mode" data-mode="login">Sign in</button>
        <button type="button" role="tab" aria-controls="account-form" aria-selected="${registration}" class="${registration ? "is-active" : ""}" data-action="profile-mode" data-mode="register">Create account</button>
      </div>
      <p class="demo-notice profile-api-note"><span aria-hidden="true">i</span><span>Account services are not connected yet. This preview will not send or save your details.</span></p>
      <form id="account-form" class="account-form" role="tabpanel" novalidate>
        ${registration ? `<label class="field-label" for="full-name">Full name</label><input id="full-name" name="fullName" autocomplete="name" required maxlength="120" placeholder="Your name">` : ""}
        <label class="field-label" for="email">Email address</label>
        <input id="email" name="email" type="email" autocomplete="email" required maxlength="254" placeholder="you@example.com">
        <label class="field-label" for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="${registration ? "new-password" : "current-password"}" required${registration ? ' minlength="12"' : ""} placeholder="${registration ? "At least 12 characters" : "Your password"}">
        ${registration ? `<div class="consent-box">
          <details class="privacy-preview"><summary>Privacy information preview</summary><p>The real notice is not published yet. Before account registration, the team must identify the data controller and contact, required data and purpose/legal basis, service providers, retention, user rights/request channel, and any international transfers. This preview is not a privacy notice.</p></details>
          <label class="check-row"><input type="checkbox" name="privacyAcknowledged" required><span>I acknowledge that I have seen the draft privacy information. This is not a legal consent or a real registration.</span></label>
          <label class="check-row"><input type="checkbox" name="marketingConsent"><span>Preview only: I would like optional news and offers. This choice is not saved and cannot be withdrawn here.</span></label>
          <p>This is a non-functional preview; no choice is saved. Publish and review the Privacy Notice before enabling registration. Marketing consent must remain optional and separate from necessary account processing.</p>
        </div>` : ""}
        <button type="submit" class="button button-dark button-full">${registration ? "Create account" : "Sign in"} <span aria-hidden="true">→</span></button>
        <p id="account-message" class="form-message" role="status" aria-live="polite"></p>
      </form>
      <div class="divider"><span>or continue with</span></div>
      <div class="social-buttons">
        <button type="button" class="social-button" data-action="social-login" data-provider="Google"><span class="google-mark" aria-hidden="true">G</span>Google</button>
        <button type="button" class="social-button" data-action="social-login" data-provider="Apple"><span class="apple-mark" aria-hidden="true">●</span>Apple</button>
      </div>
      <p class="privacy-footnote">Your personal details and privacy choices must be handled by the backend and recorded according to the published Privacy Notice. Never store passwords or consent records in this browser preview.</p>
    </div>
    <section class="profile-options" aria-labelledby="profile-options-title">
      <p class="eyebrow">Your details</p>
      <h2 id="profile-options-title">Personal information & privacy</h2>
      <p>After secure sign-in is connected, you will be able to review and update your account details, manage optional communication choices, and request access to or correction of your information.</p>
      <div class="profile-option-row"><span><strong>Account details</strong><small>Name and email management</small></span><span class="coming-soon">After sign-in</span></div>
      <div class="profile-option-row"><span><strong>Privacy preferences</strong><small>Review or withdraw optional choices</small></span><span class="coming-soon">After sign-in</span></div>
      <p class="privacy-footnote">No personal information or consent choices are collected or saved by this preview.</p>
    </section>
  </section>`;
}

function setProfileMode(mode) {
  profileMode = mode === "register" ? "register" : "login";
  render();
}

function render() {
  const page = currentPage();
  document.querySelectorAll(".bottom-nav [data-page]").forEach((link) => {
    if (link.dataset.page === page) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
  updateCartCount();

  switch (page) {
    case "buy":
      appContent.innerHTML = buyPage();
      break;
    case "qr":
      void renderQrPage();
      break;
    case "history":
      void renderHistoryPage();
      break;
    case "profile":
      appContent.innerHTML = profilePage();
      break;
    default:
      appContent.innerHTML = homePage();
  }
}

function addToCart(id, amount = 1) {
  const pass = passes.find((entry) => entry.id === id);
  if (!pass) return;
  const nextQuantity = (cart[id] || 0) + amount;
  if (nextQuantity <= 0) {
    delete cart[id];
  } else if (nextQuantity <= 10) {
    cart[id] = nextQuantity;
  } else {
    announce("A maximum of 10 of each sample pass can be added.");
    return;
  }
  persistCart();
  render();
  announce(`${pass.name} cart quantity updated.`);
}

function showNotice(title, message) {
  const existingDialog = document.querySelector("#notice-dialog");
  existingDialog?.remove();
  const dialog = document.createElement("dialog");
  dialog.id = "notice-dialog";
  dialog.className = "notice-dialog";
  dialog.innerHTML = `<div class="dialog-content"><button class="dialog-close" type="button" aria-label="Close">×</button><p class="eyebrow">Chiang Rai Pass</p><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p><button class="button button-dark button-full" type="button" data-action="close-dialog">Got it</button></div>`;
  document.body.append(dialog);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.showModal();
  dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => dialog.remove(), { once: true });
}

document.addEventListener("click", async (event) => {
  const navigationButton = event.target.closest("[data-navigate]");
  if (navigationButton) {
    window.location.hash = navigationButton.dataset.navigate;
    return;
  }

  const control = event.target.closest("[data-action]");
  if (!control) return;

  switch (control.dataset.action) {
    case "add-to-cart":
    case "increase":
      addToCart(control.dataset.id);
      break;
    case "decrease":
      addToCart(control.dataset.id, -1);
      break;
    case "checkout":
      showNotice("Checkout isn't connected yet", "Your sample cart is saved on this device, but no order or payment was created. Payment checkout will be added after the backend catalog and order APIs are ready.");
      break;
    case "profile-mode":
      setProfileMode(control.dataset.mode);
      break;
    case "social-login":
      showNotice(`${control.dataset.provider} sign-in isn't connected`, "No account sign-in occurred. OAuth provider setup and secure backend callbacks are required before this can be enabled.");
      break;
    case "refresh-qr":
      if (!control.disabled) await renderQrPage();
      break;
    case "clear-qr-cache": {
      let accountId = "";
      try {
        accountId = localStorage.getItem(LAST_QR_ACCOUNT_KEY) || "";
        if (accountId) await clearCachedQr(accountId);
        localStorage.removeItem(LAST_QR_ACCOUNT_KEY);
        announce("Saved QR removed from this device.");
      } catch (error) {
        console.error("Saved QR data could not be removed.", error);
        announce("The saved QR could not be removed. Please try again.");
      }
      if (currentPage() === "qr") await renderQrPage();
      break;
    }
    case "close-dialog":
      control.closest("dialog")?.close();
      break;
  }
});

document.addEventListener("submit", (event) => {
  if (event.target.id !== "account-form") return;
  event.preventDefault();
  const form = event.target;
  const message = form.querySelector("#account-message");

  if (!form.reportValidity()) return;
  if (profileMode === "register" && !form.elements.privacyAcknowledged.checked) {
    message.textContent = "Please acknowledge the account Privacy Notice to continue.";
    return;
  }

  message.textContent = "The account API is not connected. Nothing was sent or saved; no account was created.";
  announce(message.textContent);
});

window.addEventListener("hashchange", render);
window.addEventListener("online", () => {
  if (currentPage() === "qr") void renderQrPage();
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch((error) => {
    console.error("The Chiang Rai Pass offline app shell could not be installed.", error);
  });
}

render();
