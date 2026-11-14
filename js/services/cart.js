// Cart + pricing service.
// All money rules live here so views never calculate totals themselves.

(function (TM) {
  "use strict";

  const { store, catalog, utils } = TM;
  const SERVICE_FEE_RATE = 0.03;
  const MAX_QTY = 20;

  //  helpers

  function findItem(restaurant, itemId) {
    for (const section of restaurant.menu) {
      const hit = section.items.find((i) => i.id === itemId);
      if (hit) return hit;
    }
    return null;
  }

  // Resolve option ids → { labels, extra } for an item.
  function resolveOptions(item, optionIds) {
    const chosen = item.options
      .flatMap((g) => g.options)
      .filter((o) => optionIds.includes(o.id));
    return {
      labels: chosen.map((o) => o.name),
      extra: chosen.reduce((sum, o) => sum + o.price, 0),
    };
  }

  // Same dish + same options + same note should merge into one basket line.
  const lineKey = (itemId, optionIds, note) =>
    `${itemId}|${[...optionIds].sort().join(",")}|${note.trim()}`;

  // voucher evaluation

  function evaluateVoucher(code, subtotal, baseDeliveryFee) {
    const voucher = catalog.voucher(code);
    if (!voucher)
      return { ok: false, reason: "That voucher code is not valid." };
    if (subtotal < voucher.minSubtotal) {
      return {
        ok: false,
        reason: `Add ${utils.money(voucher.minSubtotal - subtotal)} more to use ${voucher.code}.`,
      };
    }
    switch (voucher.type) {
      case "flat":
        return {
          ok: true,
          voucher,
          discount: Math.min(voucher.value, subtotal),
          freeDelivery: false,
        };
      case "percent":
        return {
          ok: true,
          voucher,
          discount: Math.min(
            Math.round((subtotal * voucher.value) / 100),
            voucher.cap,
          ),
          freeDelivery: false,
        };
      case "freeDelivery":
        return {
          ok: true,
          voucher,
          discount: 0,
          freeDelivery: baseDeliveryFee > 0,
        };
      default:
        return { ok: false, reason: "That voucher cannot be applied." };
    }
  }

  // public API

  const cart = {
    restaurant() {
      const id = store.get().cart.restaurantId;
      return id ? catalog.byId(id) : null;
    },

    lines: () => store.get().cart.lines,
    count: () => store.get().cart.lines.reduce((n, l) => n + l.qty, 0),
    isEmpty: () => store.get().cart.lines.length === 0,

    // True when adding from `restaurantId` would replace a basket from another restaurant
    conflictsWith(restaurantId) {
      const c = store.get().cart;
      return c.lines.length > 0 && c.restaurantId !== restaurantId;
    },

    add({ restaurantId, itemId, optionIds = [], note = "", qty = 1 }) {
      const restaurant = catalog.byId(restaurantId);
      const item = restaurant && findItem(restaurant, itemId);
      if (!item) return;

      const { labels, extra } = resolveOptions(item, optionIds);
      const unit = Math.max(0, item.price + extra);
      const key = lineKey(itemId, optionIds, note);

      store.set((s) => {
        const base = s.cart.restaurantId === restaurantId ? s.cart.lines : [];
        const existing = base.find((l) => l.key === key);
        const lines = existing
          ? base.map((l) =>
              l === existing
                ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) }
                : l,
            )
          : [
              ...base,
              {
                id: utils.uid("line"),
                key,
                itemId,
                name: item.name,
                img: item.img,
                optionIds,
                labels,
                note: note.trim(),
                unit,
                qty,
              },
            ];
        return { cart: { restaurantId, lines } };
      });
    },

    setQty(lineId, qty) {
      store.set((s) => {
        const lines = s.cart.lines
          .map((l) =>
            l.id === lineId ? { ...l, qty: utils.clamp(qty, 0, MAX_QTY) } : l,
          )
          .filter((l) => l.qty > 0);
        return {
          cart: {
            restaurantId: lines.length ? s.cart.restaurantId : null,
            lines,
          },
          voucher: lines.length ? s.voucher : null,
        };
      });
    },

    clear() {
      store.set({ cart: { restaurantId: null, lines: [] }, voucher: null });
    },

    applyVoucher(code) {
      const t = cart.totals();
      const result = evaluateVoucher(code, t.subtotal, t.baseDeliveryFee);
      if (result.ok) store.set({ voucher: result.voucher.code });
      return result;
    },

    removeVoucher: () => store.set({ voucher: null }),

    totals({ tip = 0, mode = store.get().mode } = {}) {
      const restaurant = cart.restaurant();
      const subtotal = cart.lines().reduce((sum, l) => sum + l.unit * l.qty, 0);

      const isDelivery = mode === "delivery" && restaurant;
      const baseDeliveryFee =
        isDelivery && subtotal < restaurant.freeDeliveryOver
          ? restaurant.deliveryFee
          : 0;
      const serviceFee = subtotal ? Math.round(subtotal * SERVICE_FEE_RATE) : 0;

      const code = store.get().voucher;
      const voucher = code
        ? evaluateVoucher(code, subtotal, baseDeliveryFee)
        : null;
      const voucherActive = Boolean(voucher && voucher.ok);

      const discount = voucherActive ? voucher.discount : 0;
      const deliveryFee =
        voucherActive && voucher.freeDelivery ? 0 : baseDeliveryFee;
      const total = Math.max(
        0,
        subtotal + deliveryFee + serviceFee + (isDelivery ? tip : 0) - discount,
      );

      return {
        subtotal,
        baseDeliveryFee,
        deliveryFee,
        serviceFee,
        discount,
        tip: isDelivery ? tip : 0,
        total,
        voucherCode: voucherActive ? voucher.voucher.code : null,
        voucherError: voucher && !voucher.ok ? voucher.reason : null,
        meetsMinimum: !restaurant || subtotal >= restaurant.minOrder,
        shortBy: restaurant ? Math.max(0, restaurant.minOrder - subtotal) : 0,
      };
    },
  };

  TM.cart = cart;
  TM.menu = { findItem, resolveOptions };
})((window.TM = window.TM || {}));
