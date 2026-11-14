// Accessible modal / drawer host.
// Handles backdrop click, Escape, focus restore and background scroll lock.

(function (TM) {
  "use strict";

  const { esc } = TM.utils;
  const stack = [];

  const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

  //  * @param {{title: string, html: string, variant?: "dialog"|"drawer", onClose?: Function}} opts
  //  * @returns {{el: HTMLElement, body: HTMLElement, close: Function}}
  function open({ title, html, variant = "dialog", onClose }) {
    const previouslyFocused = document.activeElement;

    const overlay = document.createElement("div");
    overlay.className = `overlay overlay--${variant}`;
    overlay.innerHTML = `
      <section class="sheet sheet--${variant}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <header class="sheet__head">
          <h2 class="sheet__title">${esc(title)}</h2>
          <button class="icon-btn" type="button" data-modal-close aria-label="Close">✕</button>
        </header>
        <div class="sheet__body">${html}</div>
      </section>`;

    document.body.appendChild(overlay);
    document.body.classList.add("no-scroll");

    const instance = {
      el: overlay,
      body: overlay.querySelector(".sheet__body"),
      close() {
        const index = stack.indexOf(instance);
        if (index === -1) return;
        stack.splice(index, 1);
        overlay.classList.add("is-closing");
        const finish = () => {
          overlay.remove();
          if (!stack.length) document.body.classList.remove("no-scroll");
          if (previouslyFocused && previouslyFocused.focus)
            previouslyFocused.focus();
          if (onClose) onClose();
        };
        overlay.addEventListener("animationend", finish, { once: true });
        setTimeout(finish, 260); // safety net when animations are disabled
      },
    };

    overlay.addEventListener("mousedown", (e) => {
      if (e.target === overlay) instance.close();
    });
    overlay
      .querySelector("[data-modal-close]")
      .addEventListener("click", instance.close);

    stack.push(instance);
    const first =
      overlay.querySelector(".sheet__body " + FOCUSABLE) ||
      overlay.querySelector("[data-modal-close]");
    first.focus();
    return instance;
  }

  document.addEventListener("keydown", (e) => {
    const top = stack[stack.length - 1];
    if (!top) return;

    if (e.key === "Escape") {
      top.close();
    } else if (e.key === "Tab") {
      // keep keyboard focus inside the open dialog
      const items = TM.utils
        .$$(FOCUSABLE, top.el)
        .filter((n) => n.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // Promise-based confirmation dialog
  function confirm({
    title,
    message,
    confirmLabel = "Confirm",
    danger = false,
  }) {
    return new Promise((resolve) => {
      let answered = false;
      const done = (value) => {
        if (answered) return;
        answered = true;
        dialog.close();
        resolve(value);
      };
      const dialog = open({
        title,
        onClose: () => done(false),
        html: `
          <p class="muted">${esc(message)}</p>
          <div class="form-actions">
            <button class="btn btn--ghost" type="button" data-answer="no">Keep it</button>
            <button class="btn ${danger ? "btn--danger" : "btn--primary"}" type="button" data-answer="yes">${esc(confirmLabel)}</button>
          </div>`,
      });
      dialog.body.addEventListener("click", (e) => {
        const answer = e.target.closest("[data-answer]");
        if (answer) done(answer.dataset.answer === "yes");
      });
    });
  }

  TM.modal = {
    open,
    confirm,
    closeAll: () => [...stack].forEach((m) => m.close()),
  };
})((window.TM = window.TM || {}));
