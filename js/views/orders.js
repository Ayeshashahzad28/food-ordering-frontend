// Order history (active / past), reorder and rating. Also hosts the Favorites view
(function (TM) {
  "use strict";

  const { store, orders, cart, catalog, availability, utils, ui, modal } = TM;
  const { esc, money, $, $$ } = utils;

  const STATUS = {
    active: { label: "In progress", tone: "live" },
    completed: { label: "Completed", tone: "ok" },
    cancelled: { label: "Cancelled", tone: "bad" },
  };

  function orderCard(o) {
    const status = STATUS[o.status];
    const stars = o.rating
      ? `<span class="rating" aria-label="You rated ${o.rating.stars} stars">${"★".repeat(o.rating.stars)}${"☆".repeat(5 - o.rating.stars)}</span>`
      : "";
    return `
      <article class="order">
        <div class="order__top">
          <div>
            <h3>${esc(o.restaurantName)}</h3>
            <p class="muted small">${esc(o.id)} · ${utils.dateTime(o.placedAt)} · ${o.mode === "pickup" ? "Pickup" : "Delivery"}</p>
          </div>
          <span class="status-chip status-chip--${status.tone}">${status.label}</span>
        </div>
        <p class="order__items">${esc(ui.itemsSummary(o))}</p>
        <div class="order__bottom">
          <strong>${money(o.totals.total)}</strong> ${stars}
          <div class="order__actions">
            ${o.status === "active" ? `<a class="btn btn--primary" href="#/track/${o.id}">Track order</a>` : `<button class="btn btn--outline" type="button" data-action="reorder" data-order="${o.id}">Reorder</button>`}
            ${o.status === "completed" && !o.rating ? `<button class="btn btn--ghost" type="button" data-action="rate-order" data-order="${o.id}">Rate</button>` : ""}
            ${o.status !== "active" ? `<a class="btn btn--ghost" href="#/track/${o.id}">Details</a>` : ""}
          </div>
        </div>
      </article>`;
  }

  function renderOrders(container) {
    let tab = "active";

    function paint() {
      orders.syncStatuses();
      const all = orders.all();
      const list = all.filter((o) =>
        tab === "active" ? o.status === "active" : o.status !== "active",
      );
      container.innerHTML = `
        <div class="page">
          <h1 class="page__title">My orders</h1>
          <div class="tabs" role="tablist">
            <button type="button" role="tab" aria-selected="${tab === "active"}" class="tabs__btn ${tab === "active" ? "is-active" : ""}" data-tab="active">Active (${all.filter((o) => o.status === "active").length})</button>
            <button type="button" role="tab" aria-selected="${tab === "past"}" class="tabs__btn ${tab === "past" ? "is-active" : ""}" data-tab="past">Past orders</button>
          </div>
          <div class="order-list">
            ${list.length ? list.map(orderCard).join("") : ui.emptyState({ icon: tab === "active" ? "🛵" : "🧾", title: tab === "active" ? "No active orders" : "No past orders yet", text: "When you place an order it will show up here.", cta: `<a class="btn btn--primary" href="#/">Order something tasty</a>` })}
          </div>
        </div>`;
    }

    container.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-tab]");
      if (!btn) return;
      tab = btn.dataset.tab;
      paint();
    });

    paint();
    // Refresh while orders are in flight so statuses flip without a reload.
    const timer = setInterval(() => orders.active().length && paint(), 3000);
    const unsubscribe = store.subscribe(paint);
    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }

  function renderFavorites(container) {
    function paint() {
      const favs = catalog.restaurants.filter((r) =>
        store.get().favorites.includes(r.id),
      );
      container.innerHTML = `
        <div class="page">
          <h1 class="page__title">Favorites</h1>
          ${favs.length ? `<div class="grid">${favs.map((r) => ui.restaurantCard(r)).join("")}</div>` : ui.emptyState({ icon: "♡", title: "No favorites yet", text: "Tap the heart on any restaurant to save it here.", cta: `<a class="btn btn--primary" href="#/">Discover restaurants</a>` })}
        </div>`;
    }
    paint();
    return store.subscribe(paint);
  }

  // rating dialog

  function openRating(orderId) {
    const order = orders.byId(orderId);
    if (!order) return;
    const dialog = modal.open({
      title: `Rate ${order.restaurantName}`,
      html: `
        <form class="form" novalidate>
          <div class="star-input" role="radiogroup" aria-label="Rating">
            ${[5, 4, 3, 2, 1].map((n) => `<input type="radio" id="star-${n}" name="stars" value="${n}" /><label for="star-${n}" title="${n} stars" aria-label="${n} stars">★</label>`).join("")}
          </div>
          <p class="field__error" data-error role="alert" hidden>Please choose a rating.</p>
          ${TM.forms.textarea({ name: "comment", label: "Comments (optional)", placeholder: "How was the food and delivery?", rows: 3, maxlength: 240 })}
          <div class="form-actions"><button class="btn btn--primary" type="submit">Submit rating</button></div>
        </form>`,
    });
    const form = $("form", dialog.body);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = TM.forms.read(form);
      if (!data.stars) {
        $("[data-error]", form).hidden = false;
        return;
      }
      orders.rate(orderId, Number(data.stars), data.comment);
      dialog.close();
      TM.toast("Thanks for your feedback!");
    });
  }

  // reorder

  async function reorder(orderId) {
    const order = orders.byId(orderId);
    const restaurant = order && catalog.byId(order.restaurantId);
    if (!restaurant)
      return TM.toast("This restaurant is no longer available.", "error");
    if (!availability.isOpenAt(restaurant))
      return TM.toast(`${restaurant.name} is closed right now.`, "error");

    if (cart.conflictsWith(restaurant.id)) {
      const yes = await modal.confirm({
        title: "Replace your basket?",
        message: `Your basket has items from ${cart.restaurant().name}. Reordering will clear it.`,
        confirmLabel: "Replace basket",
        danger: true,
      });
      if (!yes) return;
    }
    cart.clear();
    order.lines.forEach((l) =>
      cart.add({
        restaurantId: restaurant.id,
        itemId: l.itemId,
        optionIds: l.optionIds,
        note: l.note,
        qty: l.qty,
      }),
    );
    TM.toast("Items added to your basket");
    TM.dialogs.openCartDrawer();
  }

  TM.actions.register({
    "rate-order": (el) => openRating(el.dataset.order),
    reorder: (el) => reorder(el.dataset.order),
  });

  TM.views = TM.views || {};
  TM.views.orders = { render: renderOrders };
  TM.views.favorites = { render: renderFavorites };
})((window.TM = window.TM || {}));
