// Home: hero, vouchers, cuisine filters, "order again" and the restaurant list
(function (TM) {
  "use strict";

  const { store, catalog, availability, utils, ui } = TM;
  const { esc, money, $, $$ } = utils;

  // "Free delivery" filter keeps restaurants that waive the fee at or below this basket value
  const FREE_DELIVERY_LIMIT = 1500;

  const SORTS = {
    recommended: {
      label: "Recommended",
      fn: (a, b) => b.rating * 10 - a.rating * 10 || a.eta[0] - b.eta[0],
    },
    rating: { label: "Top rated", fn: (a, b) => b.rating - a.rating },
    fastest: { label: "Fastest delivery", fn: (a, b) => a.eta[0] - b.eta[0] },
    fee: {
      label: "Lowest delivery fee",
      fn: (a, b) => a.deliveryFee - b.deliveryFee,
    },
  };

  // Dish names in a restaurant that match the search text
  function matchingDishes(restaurant, q) {
    const names = restaurant.menu.flatMap((s) => s.items.map((i) => i.name));
    return [...new Set(names)]
      .filter((n) => n.toLowerCase().includes(q))
      .slice(0, 2);
  }

  function applyFilters(filters) {
    const q = filters.q.trim().toLowerCase();
    const cards = [];

    for (const r of catalog.restaurants) {
      if (filters.cuisine !== "all" && !r.cuisines.includes(filters.cuisine))
        continue;
      if (filters.freeDelivery && r.freeDeliveryOver > FREE_DELIVERY_LIMIT)
        continue;
      if (filters.openNow && !availability.isOpenAt(r)) continue;
      if (filters.offers && !r.offer) continue;

      let matched = [];
      if (q) {
        const nameHit =
          r.name.toLowerCase().includes(q) ||
          r.cuisines.some((c) => ui.cuisineLabel(c).toLowerCase().includes(q));
        matched = matchingDishes(r, q);
        if (!nameHit && !matched.length) continue;
      }
      cards.push({ r, matched });
    }
    return cards.sort((a, b) => SORTS[filters.sort].fn(a.r, b.r));
  }

  function voucherCards() {
    return catalog.vouchers
      .map(
        (v) => `
      <article class="promo">
        <div><h3>${esc(v.title)}</h3><p class="muted small">${esc(v.desc)}</p></div>
        <button class="promo__code" type="button" data-action="copy-voucher" data-code="${v.code}" aria-label="Copy voucher code ${v.code}">${v.code}<span>Copy</span></button>
      </article>`,
      )
      .join("");
  }

  function orderAgain() {
    const past = store
      .get()
      .orders.filter((o) => o.status === "completed")
      .slice(0, 3);
    if (!past.length) return "";
    return `
      <section class="section">
        <h2 class="section__title">Order again</h2>
        <div class="again-row">
          ${past
            .map(
              (o) => `
            <article class="again">
              <div><strong>${esc(o.restaurantName)}</strong><p class="muted small">${esc(ui.itemsSummary(o))}</p></div>
              <button class="btn btn--outline" type="button" data-action="reorder" data-order="${o.id}">Reorder</button>
            </article>`,
            )
            .join("")}
        </div>
      </section>`;
  }

  function render(container, _params, query) {
    const filters = {
      q: query.q || "",
      cuisine: query.cuisine || "all",
      sort: "recommended",
      freeDelivery: false,
      openNow: false,
      offers: false,
    };
    const { mode } = store.get();

    container.innerHTML = `
      <section class="hero">
        <div class="hero__text">
          <p class="eyebrow">Fast · Fresh · Tracked live</p>
          <h1>Crave it. <span>Get it</span> delivered fast.</h1>
          <p class="hero__sub">Order your favourite meals from top restaurants near you with just one click.</p>
          <div class="finder">
            <div data-slot="mode">${ui.modeSwitch(mode)}</div>
            <div class="finder__row">
              <button type="button" class="finder__addr" data-action="open-address"><span aria-hidden="true">📍</span><span data-slot="hero-address"></span></button>
              <form class="finder__search" data-hero-search>
                <input class="input" type="search" name="q" value="${esc(filters.q)}" placeholder="Search pizza, biryani, burgers…" aria-label="Search restaurants or dishes" />
                <button class="btn btn--primary" type="submit">Find food</button>
              </form>
            </div>
          </div>
          <ul class="hero__stats"><li><strong>${catalog.restaurants.length}</strong> restaurants</li><li><strong>25–45</strong> min delivery</li><li><strong>Live</strong> order tracking</li></ul>
        </div>
        <div class="hero__art" aria-hidden="true">
          <img class="hero__img hero__img--a" src="assets/food/pepperoni-pizza.jpg" alt="" />
          <img class="hero__img hero__img--b" src="assets/food/zinger-burger.jpg" alt="" />
          <img class="hero__img hero__img--c" src="assets/food/biryani.jpg" alt="" />
        </div>
      </section>

      <div class="page">
        <section class="section">
          <h2 class="section__title">🔥 Hot deals</h2>
          <div class="promo-row">${voucherCards()}</div>
        </section>

        <section class="section">
          <h2 class="section__title">🍔 Cuisines</h2>
          <div class="cat-row" data-slot="cuisines"></div>
        </section>

        ${orderAgain()}

        <section class="section" id="restaurants">
          <div class="section__head">
            <h2 class="section__title" data-slot="results-title">Restaurants</h2>
            <label class="sort"><span class="visually-hidden">Sort by</span>
              <select class="input input--sm" data-sort>${Object.entries(SORTS)
                .map(([k, s]) => `<option value="${k}">${s.label}</option>`)
                .join("")}</select>
            </label>
          </div>
          <div class="chip-row" data-slot="toggles">
            <button type="button" class="chip" data-toggle="openNow" aria-pressed="false">Open now</button>
            <button type="button" class="chip" data-toggle="freeDelivery" aria-pressed="false">Free delivery over Rs 1,500</button>
            <button type="button" class="chip" data-toggle="offers" aria-pressed="false">Offers</button>
          </div>
          <div class="grid" data-slot="grid"></div>
        </section>
      </div>`;

    const grid = $("[data-slot=grid]", container);

    function paint() {
      $("[data-slot=cuisines]", container).innerHTML =
        `<button type="button" class="cat ${filters.cuisine === "all" ? "is-active" : ""}" data-cuisine="all"><span>🍽️</span>All</button>` +
        catalog.categories
          .map(
            (c) =>
              `<button type="button" class="cat ${filters.cuisine === c.id ? "is-active" : ""}" data-cuisine="${c.id}"><span>${c.icon}</span>${c.label}</button>`,
          )
          .join("");

      $$("[data-toggle]", container).forEach((b) => {
        b.classList.toggle("is-active", filters[b.dataset.toggle]);
        b.setAttribute("aria-pressed", filters[b.dataset.toggle]);
      });

      const results = applyFilters(filters);
      const q = filters.q.trim();
      $("[data-slot=results-title]", container).textContent = q
        ? `${results.length} result${results.length === 1 ? "" : "s"} for “${q}”`
        : `${results.length} restaurant${results.length === 1 ? "" : "s"} near you`;

      grid.innerHTML = results.length
        ? results
            .map(({ r, matched }) =>
              ui.restaurantCard(r, { matchedDishes: matched }),
            )
            .join("")
        : ui.emptyState({
            icon: "🔍",
            title: "No restaurants found",
            text: "Try a different search or clear your filters.",
            cta: `<button class="btn btn--outline" type="button" data-clear-filters>Clear filters</button>`,
          });
    }

    const refreshAddress = () => {
      const { addresses, addressId, mode: m } = store.get();
      const a = addresses.find((x) => x.id === addressId);
      $("[data-slot=hero-address]", container).textContent =
        m === "pickup"
          ? "Pickup from restaurant"
          : a
            ? TM.dialogs.addressLabel(a)
            : "Set your delivery address";
      $("[data-slot=mode]", container).innerHTML = ui.modeSwitch(m);
    };

    // events
    container.addEventListener("click", (e) => {
      const cuisine = e.target.closest("[data-cuisine]");
      const toggle = e.target.closest("[data-toggle]");
      if (cuisine) filters.cuisine = cuisine.dataset.cuisine;
      else if (toggle)
        filters[toggle.dataset.toggle] = !filters[toggle.dataset.toggle];
      else if (e.target.closest("[data-clear-filters]"))
        Object.assign(filters, {
          q: "",
          cuisine: "all",
          freeDelivery: false,
          openNow: false,
          offers: false,
        });
      else return;
      paint();
    });
    $("[data-sort]", container).addEventListener("change", (e) => {
      filters.sort = e.target.value;
      paint();
    });
    $("[data-hero-search]", container).addEventListener("submit", (e) => {
      e.preventDefault();
      filters.q = new FormData(e.target).get("q");
      paint();
      $("#restaurants", container).scrollIntoView({ behavior: "smooth" });
    });

    // Keep favorites hearts + address/mode in sync when the store changes.
    const unsubscribe = store.subscribe(() => {
      refreshAddress();
      paint();
    });

    refreshAddress();
    paint();
    return unsubscribe;
  }

  TM.actions.register({
    "copy-voucher"(el) {
      const code = el.dataset.code;
      const done = () => TM.toast(`${code} copied. Apply it in your basket.`);
      if (navigator.clipboard)
        navigator.clipboard.writeText(code).then(done, done);
      else done();
    },
  });

  TM.views = TM.views || {};
  TM.views.home = { render };
})((window.TM = window.TM || {}));
