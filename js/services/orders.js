// Orders service and live-tracking simulation.

// There is no backend, so an order progresses through its stages by elapsed
// time since it was placed. Stage times are compressed (a full delivery takes
// 2.5 minutes) so the whole journey can be watched; the ETA shown to the user
// is scaled back to the restaurant's real delivery estimate.

(function (TM) {
  "use strict";

  const { store, catalog } = TM;

  // Stage start times in seconds after the order begins
  const FLOWS = {
    delivery: [
      {
        key: "placed",
        label: "Order placed",
        detail: "We sent your order to the restaurant.",
        at: 0,
      },
      {
        key: "confirmed",
        label: "Restaurant confirmed",
        detail: "The kitchen accepted your order.",
        at: 10,
      },
      {
        key: "preparing",
        label: "Preparing your food",
        detail: "Your meal is being freshly cooked.",
        at: 30,
      },
      {
        key: "onTheWay",
        label: "Rider is on the way",
        detail: "Your rider picked up the order.",
        at: 75,
      },
      {
        key: "delivered",
        label: "Delivered",
        detail: "Enjoy your meal!",
        at: 150,
      },
    ],
    pickup: [
      {
        key: "placed",
        label: "Order placed",
        detail: "We sent your order to the restaurant.",
        at: 0,
      },
      {
        key: "confirmed",
        label: "Restaurant confirmed",
        detail: "The kitchen accepted your order.",
        at: 10,
      },
      {
        key: "preparing",
        label: "Preparing your food",
        detail: "Your meal is being freshly cooked.",
        at: 30,
      },
      {
        key: "ready",
        label: "Ready for pickup",
        detail: "Show your order number at the counter.",
        at: 70,
      },
    ],
  };

  const CANCEL_BEFORE_STAGE = 2; // cancellable until "preparing" begins
  const ORDER_NUMBER_BASE = 10000;

  const flowFor = (order) => FLOWS[order.mode];
  const startOf = (order) => order.scheduledFor || order.placedAt;
  const finalAt = (order) => {
    const flow = flowFor(order);
    return flow[flow.length - 1].at;
  };

  
  // Compute the live status of an order at time `now`.
  // Pure function: no state is written here.
  
  function snapshot(order, now = Date.now()) {
    const flow = flowFor(order);

    if (order.status === "cancelled") {
      return {
        flow,
        stageIndex: -1,
        cancelled: true,
        finished: true,
        progress: 0,
        secondsLeft: 0,
        etaMinutes: 0,
        cancellable: false,
        scheduled: false,
      };
    }

    const elapsed = (now - startOf(order)) / 1000;
    if (elapsed < 0) {
      return {
        flow,
        stageIndex: -1,
        cancelled: false,
        finished: false,
        scheduled: true,
        progress: 0,
        secondsLeft: Math.abs(elapsed),
        etaMinutes: 0,
        cancellable: true,
      };
    }

    let stageIndex = 0;
    flow.forEach((stage, i) => {
      if (elapsed >= stage.at) stageIndex = i;
    });

    const total = finalAt(order);
    const finished = elapsed >= total;
    const rideStart = flow.find((s) => s.key === "onTheWay")?.at ?? total;
    const progress =
      order.mode === "delivery"
        ? TM.utils.clamp((elapsed - rideStart) / (total - rideStart), 0, 1)
        : 0;
    const secondsLeft = Math.max(0, total - elapsed);
    const restaurant = catalog.byId(order.restaurantId);
    const etaMax = restaurant ? restaurant.eta[1] : 35;

    return {
      flow,
      stageIndex,
      cancelled: false,
      finished,
      scheduled: false,
      progress,
      secondsLeft,
      etaMinutes: finished
        ? 0
        : Math.max(1, Math.ceil((secondsLeft / total) * etaMax)),
      cancellable: stageIndex < CANCEL_BEFORE_STAGE,
    };
  }

  const orders = {
    FLOWS,
    snapshot,

    all: () => store.get().orders,
    byId: (id) => store.get().orders.find((o) => o.id === id) || null,
    active: () => store.get().orders.filter((o) => o.status === "active"),

    // Create an order from the current basket and checkout details
    place({
      restaurant,
      lines,
      totals,
      mode,
      address,
      payment,
      contact,
      tip,
      note,
      scheduledFor,
      noCutlery,
      leaveAtDoor,
    }) {
      const now = Date.now();
      const sequence = ORDER_NUMBER_BASE + store.get().orders.length + 1;
      const order = {
        id: `TM-${sequence}`,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        lines: lines.map(
          ({
            name,
            qty,
            unit,
            labels,
            note: lineNote,
            img,
            itemId,
            optionIds,
          }) => ({
            name,
            qty,
            unit,
            labels,
            note: lineNote,
            img,
            itemId,
            optionIds,
          }),
        ),
        totals,
        mode,
        address,
        payment,
        contact,
        tip,
        note,
        noCutlery,
        leaveAtDoor,
        scheduledFor: scheduledFor || null,
        placedAt: now,
        rider: catalog.riders[sequence % catalog.riders.length],
        status: "active",
        rating: null,
      };
      store.set((s) => ({ orders: [order, ...s.orders] }));
      return order;
    },

    // Mark orders whose simulation has finished as completed
    syncStatuses() {
      const now = Date.now();
      const stale = orders.active().filter((o) => snapshot(o, now).finished);
      if (!stale.length) return;
      const ids = new Set(stale.map((o) => o.id));
      store.set((s) => ({
        orders: s.orders.map((o) =>
          ids.has(o.id) ? { ...o, status: "completed", completedAt: now } : o,
        ),
      }));
    },

    cancel(id) {
      const order = orders.byId(id);
      if (!order || !snapshot(order).cancellable) return false;
      store.set((s) => ({
        orders: s.orders.map((o) =>
          o.id === id ? { ...o, status: "cancelled" } : o,
        ),
      }));
      return true;
    },

    rate(id, stars, comment) {
      store.set((s) => ({
        orders: s.orders.map((o) =>
          o.id === id
            ? { ...o, rating: { stars, comment, at: Date.now() } }
            : o,
        ),
      }));
    },
  };

  TM.orders = orders;
})((window.TM = window.TM || {}));
