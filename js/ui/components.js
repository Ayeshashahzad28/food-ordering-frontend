// Shared HTML templates used by several views
(function (TM) {
  "use strict";

  const { esc, money } = TM.utils;

  const stars = (rating) =>
    `<span class="rating" aria-label="Rated ${rating} out of 5"><span aria-hidden="true">★</span> ${rating.toFixed(1)}</span>`;

  const cuisineLabel = (id) =>
    (TM.catalog.categories.find((c) => c.id === id) || { label: id }).label;

  // Restaurant monogram used when a brand has no logo asset
  const monogram = (r) =>
    `<span class="monogram" aria-hidden="true">${esc(
      r.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join(""),
    )}</span>`;

  const logo = (r) =>
    r.logo ? `<img class="brand-logo" src="${r.logo}" alt="" />` : monogram(r);

  function emptyState({ icon = "🍽️", title, text = "", cta = "" }) {
    return `
      <div class="empty">
        <div class="empty__icon" aria-hidden="true">${icon}</div>
        <h3>${esc(title)}</h3>
        <p class="muted">${esc(text)}</p>
        ${cta}
      </div>`;
  }

  // Delivery / Pickup segmented control
  function modeSwitch(active) {
    const btn = (value, label) =>
      `<button type="button" role="tab" aria-selected="${active === value}" class="seg__btn ${active === value ? "is-active" : ""}" data-action="set-mode" data-mode="${value}">${label}</button>`;
    return `<div class="seg" role="tablist" aria-label="Order type">${btn("delivery", "🛵 Delivery")}${btn("pickup", "🛍️ Pickup")}</div>`;
  }

  // Quantity stepper bound to a basket line
  const stepper = (lineId, qty) => `
    <div class="stepper" role="group" aria-label="Quantity">
      <button type="button" class="stepper__btn" data-action="line-dec" data-line="${lineId}" aria-label="Decrease quantity">−</button>
      <span class="stepper__qty" aria-live="polite">${qty}</span>
      <button type="button" class="stepper__btn" data-action="line-inc" data-line="${lineId}" aria-label="Increase quantity">+</button>
    </div>`;

  // Restaurant card shown on Home and Favorites
  function restaurantCard(r, { matchedDishes = [] } = {}) {
    const open = TM.availability.isOpenAt(r);
    const fav = TM.store.get().favorites.includes(r.id);
    const feeText =
      r.deliveryFee === 0
        ? "Free delivery"
        : `${money(r.deliveryFee)} delivery`;
    return `
      <article class="r-card ${open ? "" : "is-closed"}">
        <a class="r-card__link" href="#/restaurant/${r.id}" aria-label="${esc(r.name)}, rated ${r.rating}">
          <div class="r-card__media">
            <img src="${r.cover}" alt="" loading="lazy" />
            ${r.offer ? `<span class="badge badge--accent">${esc(r.offer)}</span>` : ""}
            ${open ? "" : `<span class="r-card__closed">Closed · opens ${TM.availability.opensLabel(r)}</span>`}
          </div>
          <div class="r-card__body">
            <div class="r-card__title">${logo(r)}<h3>${esc(r.name)}</h3>${stars(r.rating)}</div>
            <p class="muted">${r.cuisines.map(cuisineLabel).join(" · ")}</p>
            <p class="r-card__meta">${r.eta[0]}–${r.eta[1]} min · ${feeText} · Min ${money(r.minOrder)}</p>
            ${matchedDishes.length ? `<p class="r-card__match">Matches: ${matchedDishes.map(esc).join(", ")}</p>` : ""}
          </div>
        </a>
        <button type="button" class="fav-btn ${fav ? "is-on" : ""}" data-action="toggle-fav" data-id="${r.id}" aria-pressed="${fav}" aria-label="${fav ? "Remove" : "Add"} ${esc(r.name)} ${fav ? "from" : "to"} favorites">${fav ? "♥" : "♡"}</button>
      </article>`;
  }

  // One-line summary of an order's items: "2× Zinger Burger, Fries"
  const itemsSummary = (order) =>
    order.lines.map((l) => `${l.qty}× ${l.name}`).join(", ");

  TM.ui = {
    stars,
    cuisineLabel,
    logo,
    emptyState,
    modeSwitch,
    stepper,
    restaurantCard,
    itemsSummary,
  };
})((window.TM = window.TM || {}));
