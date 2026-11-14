// Non-blocking notifications
(function (TM) {
  "use strict";

  const ICONS = { success: "✓", error: "!", info: "i" };
  const DURATION = 3200;

  TM.toast = function toast(message, type = "success") {
    const region = document.getElementById("toasts");
    if (!region) return;

    const el = document.createElement("div");
    el.className = `toast toast--${type}`;
    el.innerHTML = `<span class="toast__icon" aria-hidden="true">${ICONS[type] || ICONS.info}</span><span>${TM.utils.esc(message)}</span>`;
    region.appendChild(el);

    setTimeout(() => {
      el.classList.add("is-leaving");
      el.addEventListener("animationend", () => el.remove(), { once: true });
    }, DURATION);
  };
})((window.TM = window.TM || {}));
