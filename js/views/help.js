// Help centre: about TimeMeal, delivery standards, FAQ and contact form
(function (TM) {
  "use strict";

  const { store, catalog, forms, utils } = TM;
  const { esc } = utils;

  const FEATURES = [
    [
      "🚀",
      "Fast delivery",
      "Optimised routes get your food to you hot, usually in 25–45 minutes.",
    ],
    [
      "🍔",
      "Quality food",
      "We list established restaurants with consistent standards.",
    ],
    [
      "📍",
      "Live tracking",
      "Follow your order from kitchen to doorstep in real time.",
    ],
  ];
  const STANDARDS = [
    "Clear delivery estimates before you pay",
    "Hygienic, sealed packaging",
    "Verified delivery riders",
    "Friendly customer support",
  ];
  const TOPICS = [
    "Order issue",
    "Payment or refund",
    "Restaurant feedback",
    "Account help",
    "Something else",
  ];

  function render(container) {
    const user = store.get().user || {};

    container.innerHTML = `
      <div class="page page--narrow">
        <h1 class="page__title">Help &amp; support</h1>
        <p class="lead">TimeMeal is a modern food delivery platform. We focus on speed, quality and customer satisfaction.</p>

        <div class="feature-row">
          ${FEATURES.map(([icon, title, text]) => `<article class="panel feature"><div class="feature__icon" aria-hidden="true">${icon}</div><h3>${title}</h3><p class="muted">${text}</p></article>`).join("")}
        </div>

        <section class="panel">
          <h2 class="panel__title">Our delivery standards</h2>
          <ul class="ticks">${STANDARDS.map((s) => `<li>${s}</li>`).join("")}</ul>
        </section>

        <section class="panel">
          <h2 class="panel__title">Frequently asked questions</h2>
          <div class="faq">
            ${catalog.faqs.map(([q, a]) => `<details class="faq__item"><summary>${esc(q)}</summary><p class="muted">${esc(a)}</p></details>`).join("")}
          </div>
        </section>

        <section class="panel">
          <h2 class="panel__title">Contact us</h2>
          <form class="form" novalidate data-contact>
            <div class="form-grid">
              ${forms.field({ name: "name", label: "Your name", value: user.name || "", attrs: 'autocomplete="name"' })}
              ${forms.field({ name: "email", label: "Email", type: "email", value: user.email || "", attrs: 'autocomplete="email"' })}
            </div>
            <div class="form-grid">
              ${forms.select({ name: "topic", label: "Topic", options: TOPICS })}
              ${forms.field({ name: "order", label: "Order number (optional)", placeholder: "TM-10001" })}
            </div>
            ${forms.textarea({ name: "message", label: "How can we help?", rows: 4, maxlength: 600, placeholder: "Tell us what happened…" })}
            <div class="form-actions"><button class="btn btn--primary" type="submit">Send message</button></div>
          </form>
          <p class="muted small">This demo has no server, so messages are saved on this device only.</p>
        </section>
      </div>`;

    container.addEventListener("submit", (e) => {
      const form = e.target.closest("[data-contact]");
      if (!form) return;
      e.preventDefault();
      const data = forms.read(form);
      const errors = {};
      if (data.name.length < 2) errors.name = "Please enter your name.";
      if (!/^\S+@\S+\.\S+$/.test(data.email))
        errors.email = "Enter a valid email address.";
      if (data.message.length < 10)
        errors.message = "Please write at least 10 characters.";
      if (!forms.showErrors(form, errors)) return;

      store.set((s) => ({
        messages: [...s.messages, { ...data, at: Date.now() }],
      }));
      form.reset();
      TM.toast("Message saved. Thank you!");
    });
  }

  TM.views = TM.views || {};
  TM.views.help = { render };
})((window.TM = window.TM || {}));
