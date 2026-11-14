//Live order tracking: status timeline, ETA, animated route map and order details
(function (TM) {
  "use strict";

  const { store, orders, catalog, utils, ui, modal } = TM;
  const { esc, money, $, time } = utils;

  // Route follows the road grid drawn in the map below (SVG units)
  const ROUTE = "M90 310 L90 220 L250 220 L250 140 L430 140 L430 80 L550 80";
  const START = { x: 90, y: 310 };
  const END = { x: 550, y: 80 };
  const SVG_NS = "http://www.w3.org/2000/svg";

  function mapMarkup() {
    // City blocks sit between the road lines at x = 90/250/430/550 and y = 80/140/220/310.
    const blocks = [
      [110, 100, 120, 100],
      [270, 100, 140, 30],
      [270, 160, 140, 50],
      [110, 240, 120, 60],
      [270, 240, 140, 60],
      [450, 100, 80, 30],
      [450, 150, 80, 150],
      [20, 100, 50, 110],
      [20, 240, 50, 60],
      [110, 20, 120, 50],
      [270, 20, 140, 50],
      [450, 20, 80, 50],
    ];
    return `
      <svg class="map" viewBox="0 0 640 360" role="img" aria-label="Map showing the route from the restaurant to your address">
        <rect width="640" height="360" fill="#15151a" />
        ${blocks.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#1d1d24" />`).join("")}
        <rect x="270" y="160" width="140" height="50" rx="8" fill="#16241e" />
        <path d="M0 340 Q160 300 320 340 T640 320" stroke="#1b2a3a" stroke-width="18" fill="none" opacity=".8" />
        <path d="${ROUTE}" stroke="#2c2c36" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round" />
        <path data-route="done" d="${ROUTE}" stroke="#ff2e63" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
        <g transform="translate(${START.x} ${START.y})"><circle r="17" fill="#fff" /><text y="6" text-anchor="middle" font-size="17">🍴</text></g>
        <g transform="translate(${END.x} ${END.y})"><circle r="19" fill="#ff2e63" opacity=".25"><animate attributeName="r" values="19;28;19" dur="2s" repeatCount="indefinite" /></circle><circle r="17" fill="#ff2e63" /><text y="6" text-anchor="middle" font-size="17">🏠</text></g>
        <g data-rider><circle r="19" fill="#0d0d0f" stroke="#ff2e63" stroke-width="3" /><text y="7" text-anchor="middle" font-size="20">🛵</text></g>
      </svg>`;
  }

  function stepsMarkup(snap) {
    return snap.flow
      .map((s, i) => {
        const state = snap.cancelled
          ? "pending"
          : i < snap.stageIndex || snap.finished
            ? "done"
            : i === snap.stageIndex
              ? "current"
              : "pending";
        return `<li class="step is-${state}"><span class="step__dot" aria-hidden="true">${state === "done" ? "✓" : ""}</span><div><strong>${esc(s.label)}</strong><p class="muted small">${esc(s.detail)}</p></div></li>`;
      })
      .join("");
  }

  function headline(order, snap) {
    if (snap.cancelled)
      return {
        title: "Order cancelled",
        sub: "No payment will be taken for this order.",
      };
    if (snap.scheduled)
      return {
        title: "Order scheduled",
        sub: `Starts at ${time(order.scheduledFor)} (in ${utils.clock(snap.secondsLeft)})`,
      };
    if (snap.finished) {
      return order.mode === "delivery"
        ? {
            title: "Delivered. Enjoy your meal!",
            sub: `Arrived at ${time(order.completedAt || Date.now())}`,
          }
        : {
            title: "Ready for pickup",
            sub: `Show order ${order.id} at the counter.`,
          };
    }
    const current = snap.flow[snap.stageIndex];
    const eta =
      order.mode === "delivery"
        ? `Arriving in about ${snap.etaMinutes} min`
        : `Ready in about ${snap.etaMinutes} min`;
    return { title: current.label, sub: eta };
  }

  function sideMarkup(order, snap) {
    const restaurant = catalog.byId(order.restaurantId);
    const showRider =
      order.mode === "delivery" && !snap.cancelled && snap.stageIndex >= 2;
    const initials = order.rider.name
      .split(" ")
      .map((w) => w[0])
      .join("");
    return `
      ${
        showRider
          ? `
        <section class="panel rider">
          <div class="rider__avatar" aria-hidden="true">${initials}</div>
          <div class="rider__info"><strong>${esc(order.rider.name)}</strong><p class="muted small">★ ${order.rider.rating} · ${esc(order.rider.bike)}</p></div>
          <a class="icon-btn icon-btn--accent" href="tel:${order.contact.phone}" aria-label="Call rider (demo)" data-action="call-rider">📞</a>
        </section>`
          : ""
      }
      <section class="panel">
        <h2 class="panel__title">${order.mode === "delivery" ? "Delivering to" : "Pickup from"}</h2>
        <p>${order.mode === "delivery" ? esc(TM.dialogs.addressLabel(order.address)) : esc(restaurant ? restaurant.name + ", " + restaurant.area : order.restaurantName)}</p>
        ${order.address && order.address.note ? `<p class="muted small">Note: ${esc(order.address.note)}</p>` : ""}
        <p class="muted small">${esc(order.contact.name)} · ${esc(order.contact.phone)}</p>
      </section>
      <section class="panel">
        <h2 class="panel__title">Order ${esc(order.id)}</h2>
        <ul class="sum-lines">${order.lines.map((l) => `<li><div><strong>${l.qty} × ${esc(l.name)}</strong>${l.labels.length ? `<p class="muted small">${esc(l.labels.join(", "))}</p>` : ""}</div><span>${money(l.unit * l.qty)}</span></li>`).join("")}</ul>
        ${TM.dialogs.totalsBlock(order.totals, order.mode)}
        <p class="muted small">Paid with ${esc(order.payment.label)}</p>
      </section>
      <div class="side-actions">
        ${snap.cancellable && !snap.cancelled ? `<button class="btn btn--danger-outline btn--block" type="button" data-action="cancel-order" data-order="${order.id}">Cancel order</button>` : ""}
        ${snap.finished && !snap.cancelled && !order.rating ? `<button class="btn btn--primary btn--block" type="button" data-action="rate-order" data-order="${order.id}">Rate this order</button>` : ""}
        ${snap.finished ? `<button class="btn btn--outline btn--block" type="button" data-action="reorder" data-order="${order.id}">Order again</button>` : ""}
        <a class="btn btn--ghost btn--block" href="#/help">Need help?</a>
      </div>`;
  }

  function render(container, { id }) {
    const initial = orders.byId(id);
    if (!initial) {
      container.innerHTML = `<div class="page">${ui.emptyState({ icon: "🧾", title: "Order not found", text: "We could not find that order on this device.", cta: `<a class="btn btn--primary" href="#/orders">View my orders</a>` })}</div>`;
      return;
    }

    container.innerHTML = `
      <div class="page">
        <a class="back-link" href="#/orders">← My orders</a>
        <div class="track">
          <div class="track__main">
            <section class="panel status">
              <p class="eyebrow">${esc(initial.restaurantName)} · ${esc(initial.id)}</p>
              <h1 data-slot="title"></h1>
              <p class="status__sub" data-slot="sub"></p>
              <div class="bar" aria-hidden="true"><div class="bar__fill" data-slot="bar"></div></div>
              <p class="notice notice--info small">Demo mode: tracking runs faster than real life so you can watch the whole journey in about 2.5 minutes.</p>
            </section>
            ${initial.mode === "delivery" ? `<section class="panel map-panel" data-slot="map">${mapMarkup()}</section>` : ""}
            <section class="panel"><h2 class="panel__title">Order progress</h2><ol class="steps" data-slot="steps"></ol></section>
          </div>
          <aside class="track__side" data-slot="side"></aside>
        </div>
      </div>`;

    const slot = (name) => $(`[data-slot=${name}]`, container);
    const routePath = (() => {
      const p = document.createElementNS(SVG_NS, "path");
      p.setAttribute("d", ROUTE);
      return p;
    })();
    const routeLength = routePath.getTotalLength();
    const doneStroke = $("[data-route=done]", container);
    const rider = $("[data-rider]", container);

    let lastKey = "";

    function update() {
      orders.syncStatuses();
      const order = orders.byId(id);
      const snap = orders.snapshot(order);
      const text = headline(order, snap);

      slot("title").textContent = text.title;
      slot("sub").textContent = text.sub;

      const total = snap.flow.length - 1;
      const percent = snap.cancelled
        ? 0
        : snap.finished
          ? 100
          : snap.stageIndex < 0
            ? 0
            : ((snap.stageIndex +
                (snap.stageIndex === 3 && order.mode === "delivery"
                  ? snap.progress
                  : 0)) /
                total) *
              100;
      slot("bar").style.width = `${percent}%`;

      // Rebuild the timeline and sidebar only when something structural changed.
      const key = [
        snap.stageIndex,
        snap.finished,
        snap.cancelled,
        snap.cancellable,
        order.rating ? 1 : 0,
      ].join("|");
      if (key !== lastKey) {
        lastKey = key;
        slot("steps").innerHTML = stepsMarkup(snap);
        slot("side").innerHTML = sideMarkup(order, snap);
      }

      if (rider && doneStroke) {
        const point = routePath.getPointAtLength(
          routeLength * (snap.finished && !snap.cancelled ? 1 : snap.progress),
        );
        rider.setAttribute("transform", `translate(${point.x} ${point.y})`);
        const drawn = routeLength * snap.progress;
        doneStroke.setAttribute("stroke-dasharray", `${drawn} ${routeLength}`);
      }
      return snap;
    }

    update();
    const timer = setInterval(() => {
      const snap = update();
      if (snap.finished) clearInterval(timer);
    }, 500);

    // Re-render when the order is changed from elsewhere (cancel, rating).
    const unsubscribe = store.subscribe(update);
    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }

  TM.actions.register({
    async "cancel-order"(el) {
      const yes = await modal.confirm({
        title: "Cancel this order?",
        message:
          "The restaurant has not started cooking yet, so you will not be charged.",
        confirmLabel: "Cancel order",
        danger: true,
      });
      if (yes && orders.cancel(el.dataset.order))
        TM.toast("Order cancelled", "info");
      else if (yes)
        TM.toast(
          "Too late to cancel: the kitchen has started preparing.",
          "error",
        );
    },
    "call-rider"() {
      TM.toast("Demo only: riders cannot be called in this build.", "info");
    },
  });

  TM.views = TM.views || {};
  TM.views.tracking = { render };
})((window.TM = window.TM || {}));
