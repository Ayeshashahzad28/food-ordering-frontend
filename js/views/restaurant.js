// Restaurant page: header, sticky category tabs with scroll-spy, menu, basket bar
(function (TM) {
  "use strict";

  const { store, catalog, cart, availability, utils, ui } = TM;
  const { esc, money, $, $$ } = utils;

  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  // Lowest possible price: base price plus the cheapest choice in every required group
  function fromPrice(item) {
    const cheapest = item.options
      .filter((g) => g.required)
      .reduce((sum, g) => sum + Math.min(...g.options.map((o) => o.price)), 0);
    return Math.max(0, item.price + cheapest);
  }

  function menuItem(restaurant, item) {
    const hasOptions = item.options.length > 0;
    return `
      <button type="button" class="m-item" data-action="open-item" data-restaurant="${restaurant.id}" data-item="${item.id}">
        <span class="m-item__text">
          <span class="m-item__name">${esc(item.name)}${item.popular ? ` <span class="badge badge--accent">Popular</span>` : ""}</span>
          <span class="m-item__desc">${esc(item.desc)}</span>
          <span class="m-item__price">${hasOptions ? "From " : ""}${money(fromPrice(item))}</span>
        </span>
        <span class="m-item__media"><img src="${item.img}" alt="" loading="lazy" /><span class="m-item__add" aria-hidden="true">+</span></span>
      </button>`;
  }

  function render(container, { id }) {
    const restaurant = catalog.byId(id);
    if (!restaurant) {
      container.innerHTML = `<div class="page">${ui.emptyState({ icon: "😕", title: "Restaurant not found", cta: `<a class="btn btn--primary" href="#/">Back to restaurants</a>` })}</div>`;
      return;
    }

    const open = availability.isOpenAt(restaurant);
    const feeText =
      restaurant.deliveryFee === 0 ? "Free" : money(restaurant.deliveryFee);

    container.innerHTML = `
      <header class="r-hero" style="background-image: linear-gradient(180deg, rgba(13,13,15,.55), #0d0d0f 96%), url('${restaurant.cover}')">
        <div class="r-hero__inner">
          <a class="back-link" href="#/">← All restaurants</a>
          <div class="r-hero__main">
            ${ui.logo(restaurant)}
            <div>
              <h1>${esc(restaurant.name)}</h1>
              <p class="r-hero__sub">${esc(restaurant.tagline)} · ${restaurant.cuisines.map(ui.cuisineLabel).join(", ")}</p>
              <ul class="facts">
                <li>${ui.stars(restaurant.rating)} <span class="muted">(${restaurant.ratingCount})</span></li>
                <li>🕒 ${restaurant.eta[0]}–${restaurant.eta[1]} min</li>
                <li>🛵 ${feeText} delivery</li>
                <li>🧾 Min ${money(restaurant.minOrder)}</li>
              </ul>
            </div>
            <div class="r-hero__actions">
              <button type="button" class="btn btn--ghost" data-action="toggle-fav" data-id="${restaurant.id}" data-slot="fav"></button>
            </div>
          </div>
        </div>
      </header>

      <div class="page">
        ${open ? "" : `<p class="notice notice--warn">🕒 ${esc(restaurant.name)} is closed right now. It opens at ${availability.opensLabel(restaurant)}. You can browse the menu, but ordering is unavailable.</p>`}
        ${restaurant.offer ? `<p class="notice notice--info">🎉 ${esc(restaurant.offer)}</p>` : ""}
        <p class="muted small">📍 ${esc(restaurant.area)} · Open ${utils.hourLabel(restaurant.hours[0])} – ${utils.hourLabel(restaurant.hours[1])}</p>

        <div class="menu-bar">
          <nav class="menu-tabs" aria-label="Menu categories" data-slot="tabs">
            ${restaurant.menu.map((s, i) => `<a href="#" class="menu-tab ${i === 0 ? "is-active" : ""}" data-tab="${slug(s.title)}">${esc(s.title)}</a>`).join("")}
          </nav>
          <input class="input input--sm menu-search" type="search" placeholder="Search this menu" aria-label="Search this menu" data-menu-search />
        </div>

        <div data-slot="menu"></div>
      </div>
      <div data-slot="basket-bar"></div>`;

    const menuEl = $("[data-slot=menu]", container);

    function paintMenu(q = "") {
      const needle = q.trim().toLowerCase();
      const sections = restaurant.menu
        .map((s) => ({
          ...s,
          items: s.items.filter(
            (i) =>
              !needle ||
              i.name.toLowerCase().includes(needle) ||
              i.desc.toLowerCase().includes(needle),
          ),
        }))
        .filter((s) => s.items.length);

      menuEl.innerHTML = sections.length
        ? sections
            .map(
              (s) =>
                `<section class="menu-section" id="sec-${slug(s.title)}" data-section="${slug(s.title)}"><h2>${esc(s.title)}</h2><div class="menu-grid">${s.items.map((i) => menuItem(restaurant, i)).join("")}</div></section>`,
            )
            .join("")
        : ui.emptyState({ icon: "🔍", title: "No dishes match your search" });
    }

    function paintBasketBar() {
      const bar = $("[data-slot=basket-bar]", container);
      const inThisBasket =
        cart.restaurant() && cart.restaurant().id === restaurant.id;
      if (!inThisBasket || cart.isEmpty()) {
        bar.innerHTML = "";
        return;
      }
      bar.innerHTML = `<button type="button" class="basket-bar" data-action="open-cart"><span class="basket-bar__count">${cart.count()}</span><span>View basket</span><strong>${money(cart.totals().subtotal)}</strong></button>`;
    }

    function paintFav() {
      const on = store.get().favorites.includes(restaurant.id);
      const btn = $("[data-slot=fav]", container);
      btn.textContent = on ? "♥ Saved" : "♡ Save";
      btn.setAttribute("aria-pressed", on);
    }

    // tabs: smooth scroll + scroll-spy
    $("[data-slot=tabs]", container).addEventListener("click", (e) => {
      const tab = e.target.closest("[data-tab]");
      if (!tab) return;
      e.preventDefault();
      const target = document.getElementById(`sec-${tab.dataset.tab}`);
      if (target)
        window.scrollTo({
          top: target.getBoundingClientRect().top + window.scrollY - 130,
          behavior: "smooth",
        });
    });

    let observer;
    function observeSections() {
      if (observer) observer.disconnect();
      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((en) => en.isIntersecting)
            .sort(
              (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
            )[0];
          if (!visible) return;
          $$("[data-tab]", container).forEach((t) =>
            t.classList.toggle(
              "is-active",
              t.dataset.tab === visible.target.dataset.section,
            ),
          );
        },
        { rootMargin: "-130px 0px -60% 0px" },
      );
      $$("[data-section]", container).forEach((s) => observer.observe(s));
    }

    $("[data-menu-search]", container).addEventListener(
      "input",
      utils.debounce((e) => {
        paintMenu(e.target.value);
        observeSections();
      }, 150),
    );

    const unsubscribe = store.subscribe(() => {
      paintBasketBar();
      paintFav();
    });

    paintMenu();
    observeSections();
    paintBasketBar();
    paintFav();

    return () => {
      unsubscribe();
      if (observer) observer.disconnect();
    };
  }

  TM.views = TM.views || {};
  TM.views.restaurant = { render };
})((window.TM = window.TM || {}));
