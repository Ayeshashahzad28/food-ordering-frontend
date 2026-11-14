(function (TM) {
  "use strict";

  const handlers = Object.create(null);

  TM.actions = {
    register(map) {
      Object.assign(handlers, map);
    },

    init() {
      document.addEventListener("click", (event) => {
        const el = event.target.closest("[data-action]");
        if (!el || el.disabled) return;
        const handler = handlers[el.dataset.action];
        if (!handler) return;
        if (!(el instanceof HTMLInputElement)) event.preventDefault();
        handler(el, event);
      });
    },
  };
})((window.TM = window.TM || {}));
