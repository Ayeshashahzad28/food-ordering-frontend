(function (TM) {
  "use strict";

  const STORAGE_KEY = "timemeal.state.v1";

  const defaults = () => ({
    user: null, // { name, phone, email }
    mode: "delivery", // "delivery" | "pickup"
    addresses: [], // { id, label, line, area, city, note }
    addressId: null,
    cart: { restaurantId: null, lines: [] },
    voucher: null, // applied voucher code
    favorites: [],
    orders: [],
    messages: [],
  });

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return saved ? { ...defaults(), ...saved } : defaults();
    } catch {
      return defaults(); // storage blocked or corrupt: start fresh
    }
  }

  let state = load();
  const listeners = new Set();

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      //  storage unavailable: app keeps working in memory
    }
  }

  TM.store = {
    get: () => state,

    // Merge a patch (or the result of a function) into state and notify
    set(patch) {
      const next = typeof patch === "function" ? patch(state) : patch;
      state = { ...state, ...next };
      persist();
      listeners.forEach((fn) => fn(state));
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    reset() {
      state = defaults();
      persist();
      listeners.forEach((fn) => fn(state));
    },
  };
})((window.TM = window.TM || {}));
