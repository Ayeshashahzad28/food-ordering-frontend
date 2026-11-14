// Site header, mobile tab bar and footer. Rendered once, then kept in sync with the store
(function (TM) {
  "use strict";

  const { store, cart, orders, utils } = TM;
  const { esc, $, $$ } = utils;

  const NAV = [
    { path: "/", label: "Home", icon: "🏠" },
    { path: "/orders", label: "Orders", icon: "🧾" },
    { path: "/favorites", label: "Favorites", icon: "♥" },
    { path: "/account", label: "Account", icon: "👤" },
  ];

  const LOGO = `
    <a class="logo" href="#/" aria-label="TimeMeal home">
      <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
        <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff2e63"/><stop offset="1" stop-color="#ff5e8a"/></linearGradient></defs>
        <circle cx="16" cy="16" r="15" fill="url(#lg)"/>
        <path d="M16 7v9l6 4" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>TimeMeal</span>
    </a>`;

  function mount() {
    $("#site-header").innerHTML = `
      <div class="header__inner">
        ${LOGO}
        <button class="loc-pill" type="button" data-action="open-address" aria-label="Choose delivery address">
          <span aria-hidden="true">📍</span><span class="loc-pill__text" data-slot="address"></span><span aria-hidden="true">▾</span>
        </button>
        <form class="hdr-search" role="search" data-search-form>
          <input class="input" type="search" name="q" placeholder="Search restaurants or dishes" aria-label="Search restaurants or dishes" />
        </form>
        <nav class="nav" aria-label="Main">
          ${NAV.map((n) => `<a href="#${n.path}" data-nav="${n.path}">${n.label}${n.path === "/orders" ? `<span class="dot" data-slot="live-dot" hidden></span>` : ""}</a>`).join("")}
          <a href="#/help" data-nav="/help">Help</a>
        </nav>
        <button class="cart-btn" type="button" data-action="open-cart" aria-label="Open basket">
          <span aria-hidden="true">🛒</span><span class="cart-btn__count" data-slot="cart-count">0</span>
        </button>
      </div>`;

    $("#tab-bar").innerHTML = NAV.map(
      (n) =>
        `<a href="#${n.path}" data-nav="${n.path}"><span aria-hidden="true">${n.icon}</span>${n.label}</a>`,
    ).join("");

    $("#site-footer").innerHTML = `
      <div class="footer__inner">
        <div><strong class="footer__brand">TimeMeal</strong><p class="muted small">Food delivery, made simple. Sample restaurants and prices for demonstration.</p></div>
        <nav aria-label="Footer"><a href="#/">Home</a><a href="#/orders">Orders</a><a href="#/help">Help &amp; support</a></nav>
        <p class="muted small">&copy; ${new Date().getFullYear()} TimeMeal. All rights reserved.</p>
      </div>`;

    $("[data-search-form]").addEventListener("submit", (e) => {
      e.preventDefault();
      const q = new FormData(e.target).get("q").trim();
      TM.router.go(q ? `/?q=${encodeURIComponent(q)}` : "/");
    });

    sync();
    store.subscribe(sync);
    document.addEventListener("route:change", highlight);
    highlight();
  }

  // Update the dynamic bits: address label, basket count, live-order dot
  function sync() {
    const { addresses, addressId, mode } = store.get();
    const address = addresses.find((a) => a.id === addressId);
    $("[data-slot=address]").textContent =
      mode === "pickup"
        ? "Pickup"
        : address
          ? `${address.label} · ${address.area}`
          : "Select address";

    const count = cart.count();
    const badge = $("[data-slot=cart-count]");
    badge.textContent = count;
    badge.hidden = count === 0;

    $("[data-slot=live-dot]").hidden = orders.active().length === 0;
  }

  function highlight() {
    const path = TM.router.current.path;
    $$("[data-nav]").forEach((a) => {
      const target = a.dataset.nav;
      const active = target === "/" ? path === "/" : path.startsWith(target);
      a.classList.toggle("is-active", active);
      if (active) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    document.body.dataset.route = path === "/" ? "home" : path.split("/")[1];
  }

  TM.header = { mount, esc };
})((window.TM = window.TM || {}));
