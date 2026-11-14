// Checkout: order type, address, time, contact, tip, payment and live summary
(function (TM) {
  "use strict";

  const { store, cart, orders, availability, utils, forms, ui, dialogs } = TM;
  const { esc, money, $, $$ } = utils;

  const TIP_OPTIONS = [0, 50, 100, 150];
  const PAYMENTS = [
    {
      id: "cod",
      title: "Cash on delivery",
      text: "Pay the rider when your food arrives.",
      icon: "💵",
    },
    {
      id: "card",
      title: "Credit / debit card",
      text: "Demo only. No real payment is processed.",
      icon: "💳",
    },
    {
      id: "wallet",
      title: "Mobile wallet",
      text: "Pay with your wallet account number.",
      icon: "📱",
    },
  ];

  const panel = (title, body, slot = "") =>
    `<section class="panel" ${slot ? `data-slot="${slot}"` : ""}><h2 class="panel__title">${title}</h2>${body}</section>`;

  // card helpers

  function validExpiry(value) {
    const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(value);
    if (!m) return false;
    const month = Number(m[1]);
    const year = 2000 + Number(m[2]);
    if (month < 1 || month > 12) return false;
    return new Date(year, month, 1) > new Date(); // card valid through the end of its month
  }

  const formatCardNumber = (v) =>
    v
      .replace(/\D/g, "")
      .slice(0, 19)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  const formatExpiry = (v) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  // view

  function render(container) {
    if (cart.isEmpty()) {
      TM.toast("Your basket is empty", "info");
      TM.router.go("/");
      return;
    }

    const restaurant = cart.restaurant();
    const ui_state = {
      tip: 0,
      when: availability.isOpenAt(restaurant) ? "asap" : "later",
      payment: "cod",
    };
    const user = store.get().user || {};

    container.innerHTML = `
      <div class="page">
        <a class="back-link" href="#/restaurant/${restaurant.id}">← Back to ${esc(restaurant.name)}</a>
        <h1 class="page__title">Checkout</h1>
        <div class="checkout">
          <form id="checkout-form" class="checkout__main" novalidate>
            ${panel("Order type", `<div data-slot="mode"></div>`)}
            <div data-slot="address"></div>
            <div data-slot="time"></div>
            ${panel(
              "Contact details",
              `<div class="form-grid">
                ${forms.field({ name: "name", label: "Full name", value: user.name || "", placeholder: "Your name", attrs: 'autocomplete="name"' })}
                ${forms.field({ name: "phone", label: "Mobile number", type: "tel", value: user.phone || "", placeholder: "03XX XXXXXXX", attrs: 'autocomplete="tel" inputmode="tel"' })}
              </div>`,
            )}
            <div data-slot="tip"></div>
            ${panel(
              "Notes",
              `${forms.textarea({ name: "note", label: "Note for the restaurant or rider (optional)", placeholder: "Allergies, gate code, extra napkins…", rows: 2, maxlength: 200 })}
               <label class="check"><input type="checkbox" name="noCutlery" /><span>No cutlery needed (reduces waste)</span></label>
               <label class="check" data-delivery-only><input type="checkbox" name="leaveAtDoor" /><span>Leave at the door</span></label>`,
            )}
            ${panel(
              "Payment method",
              `<div class="pay-list" role="radiogroup" aria-label="Payment method">
                ${PAYMENTS.map(
                  (p, i) => `
                  <label class="pay ${i === 0 ? "is-selected" : ""}">
                    <input type="radio" name="payment" value="${p.id}" ${i === 0 ? "checked" : ""} />
                    <span class="pay__icon" aria-hidden="true">${p.icon}</span>
                    <span><strong>${p.title}</strong><span class="muted small block">${p.text}</span></span>
                  </label>`,
                ).join("")}
              </div>
              <div class="pay-extra" data-pay="card" hidden>
                ${forms.field({ name: "cardNumber", label: "Card number", placeholder: "4242 4242 4242 4242", hint: "Demo card: 4242 4242 4242 4242, any future expiry, any CVC.", attrs: 'inputmode="numeric" autocomplete="off"' })}
                <div class="form-grid">
                  ${forms.field({ name: "cardExpiry", label: "Expiry (MM/YY)", placeholder: "08/29", attrs: 'inputmode="numeric" autocomplete="off"' })}
                  ${forms.field({ name: "cardCvc", label: "CVC", placeholder: "123", attrs: 'inputmode="numeric" maxlength="4" autocomplete="off"' })}
                </div>
                ${forms.field({ name: "cardName", label: "Name on card", placeholder: "As printed on the card" })}
              </div>
              <div class="pay-extra" data-pay="wallet" hidden>
                ${forms.field({ name: "walletNumber", label: "Wallet account number", type: "tel", placeholder: "03XX XXXXXXX", attrs: 'inputmode="tel"' })}
              </div>
              <p class="notice notice--info small">This is a demo checkout. Card and wallet details are validated but never stored or charged.</p>`,
            )}
          </form>
          <aside class="checkout__summary" data-slot="summary" aria-label="Order summary"></aside>
        </div>
      </div>`;

    const form = $("#checkout-form", container);
    const slot = (name) => $(`[data-slot=${name}]`, container);

    // section painters //

    function paintMode() {
      slot("mode").innerHTML = ui.modeSwitch(store.get().mode);
    }

    function paintAddress() {
      const { mode, addresses, addressId } = store.get();
      if (mode === "pickup") {
        slot("address").innerHTML = panel(
          "Pickup location",
          `<p><strong>${esc(restaurant.name)}</strong></p><p class="muted">${esc(restaurant.area)}. Show your order number at the counter.</p>`,
        );
        return;
      }
      const list = addresses.length
        ? `<div class="addr-list">${addresses
            .map(
              (a) => `
            <label class="addr ${a.id === addressId ? "is-selected" : ""}">
              <input type="radio" name="address" value="${a.id}" ${a.id === addressId ? "checked" : ""} />
              <span class="addr__label">${esc(a.label)}</span>
              <span class="addr__text">${esc(dialogs.addressLabel(a))}${a.note ? `<span class="muted small block">${esc(a.note)}</span>` : ""}</span>
            </label>`,
            )
            .join("")}</div>`
        : `<p class="muted">Add a delivery address to continue.</p>`;
      slot("address").innerHTML = panel(
        "Delivery address",
        `${list}<p class="field__error" data-error="address" role="alert" hidden></p><button type="button" class="btn btn--outline" data-action="add-address">+ Add new address</button>`,
      );
    }

    function paintTime() {
      const open = availability.isOpenAt(restaurant);
      const slots = availability.deliverySlots(restaurant);
      const mode = store.get().mode;
      const noun = mode === "pickup" ? "Pickup" : "Delivery";
      slot("time").innerHTML = panel(
        `${noun} time`,
        `<label class="check check--card ${open ? "" : "is-disabled"}">
            <input type="radio" name="when" value="asap" ${ui_state.when === "asap" ? "checked" : ""} ${open ? "" : "disabled"} />
            <span><strong>Standard</strong><span class="muted small block">${restaurant.eta[0]}–${restaurant.eta[1]} min${open ? "" : ` · ${esc(restaurant.name)} is closed now`}</span></span>
          </label>
          <label class="check check--card">
            <input type="radio" name="when" value="later" ${ui_state.when === "later" ? "checked" : ""} />
            <span><strong>Schedule for later</strong><span class="muted small block">Pick a time slot</span></span>
          </label>
          <div class="field" ${ui_state.when === "later" ? "" : "hidden"} data-slot-picker>
            <label class="field__label" for="f-slot">Time slot</label>
            <select class="input" id="f-slot" name="slot">${slots.map((s) => `<option value="${s.value}">${esc(s.label)}</option>`).join("")}</select>
          </div>`,
      );
    }

    function paintTip() {
      const delivery = store.get().mode === "delivery";
      slot("tip").innerHTML = delivery
        ? panel(
            "Rider tip",
            `<p class="muted small">100% of your tip goes to your rider.</p><div class="chip-row">${TIP_OPTIONS.map((t) => `<button type="button" class="chip ${ui_state.tip === t ? "is-active" : ""}" data-tip="${t}" aria-pressed="${ui_state.tip === t}">${t ? money(t) : "No tip"}</button>`).join("")}</div>`,
          )
        : "";
      $$("[data-delivery-only]", container).forEach(
        (el) => (el.hidden = !delivery),
      );
    }

    function paintSummary() {
      if (cart.isEmpty()) return TM.router.go("/");
      const t = cart.totals({ tip: ui_state.tip });
      const mode = store.get().mode;
      slot("summary").innerHTML = `
        <div class="panel panel--sticky">
          <h2 class="panel__title">Your order from ${esc(restaurant.name)}</h2>
          <ul class="sum-lines">
            ${cart
              .lines()
              .map(
                (l) => `
              <li>
                <div><strong>${esc(l.name)}</strong>${l.labels.length ? `<p class="muted small">${esc(l.labels.join(", "))}</p>` : ""}</div>
                <div class="sum-lines__side">${ui.stepper(l.id, l.qty)}<span>${money(l.unit * l.qty)}</span></div>
              </li>`,
              )
              .join("")}
          </ul>
          ${dialogs.voucherBlock(t)}
          ${dialogs.totalsBlock(t, mode)}
          ${t.meetsMinimum ? "" : `<p class="notice notice--warn">Minimum order is ${money(restaurant.minOrder)}. Add ${money(t.shortBy)} more.</p>`}
          <button class="btn btn--primary btn--block btn--lg" type="submit" form="checkout-form" ${t.meetsMinimum ? "" : "disabled"}>Place order · ${money(t.total)}</button>
          <p class="muted small center">By placing your order you agree to our terms.</p>
        </div>`;
    }

    const paintAll = () => {
      paintMode();
      paintAddress();
      paintTime();
      paintTip();
      paintSummary();
    };

    // interactions

    container.addEventListener("click", (e) => {
      const tip = e.target.closest("[data-tip]");
      if (tip) {
        ui_state.tip = Number(tip.dataset.tip);
        paintTip();
        paintSummary();
      }
    });

    form.addEventListener("change", (e) => {
      const { name, value } = e.target;
      if (name === "when") {
        ui_state.when = value;
        $("[data-slot-picker]", form).hidden = value !== "later";
      }
      if (name === "address") {
        store.set({ addressId: value });
      }
      if (name === "payment") {
        ui_state.payment = value;
        $$(".pay", form).forEach((p) =>
          p.classList.toggle("is-selected", $("input", p).checked),
        );
        $$("[data-pay]", form).forEach(
          (el) => (el.hidden = el.dataset.pay !== value),
        );
      }
    });

    form.addEventListener("input", (e) => {
      if (e.target.name === "cardNumber")
        e.target.value = formatCardNumber(e.target.value);
      if (e.target.name === "cardExpiry")
        e.target.value = formatExpiry(e.target.value);
    });

    // The voucher form lives in the re-rendered summary, so listen on the container.
    container.addEventListener("submit", (e) => {
      const voucherForm = e.target.closest("[data-voucher-form]");
      if (!voucherForm) return;
      e.preventDefault();
      const result = cart.applyVoucher($("input", voucherForm).value);
      if (!result.ok) TM.toast(result.reason, "error");
      else TM.toast(`${result.voucher.code} applied`);
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      submit();
    });

    // validation + order placement

    function validate(data) {
      const errors = {};
      const mode = store.get().mode;
      if (data.name.length < 2) errors.name = "Enter your full name.";
      if (!utils.normalisePhone(data.phone))
        errors.phone = "Enter a valid mobile number, e.g. 0300 1234567.";

      if (data.payment === "card") {
        if (!utils.luhn(data.cardNumber.replace(/\s/g, "")))
          errors.cardNumber = "Enter a valid card number.";
        if (!validExpiry(data.cardExpiry))
          errors.cardExpiry = "Enter a future date as MM/YY.";
        if (!/^\d{3,4}$/.test(data.cardCvc))
          errors.cardCvc = "Enter the 3 or 4 digit CVC.";
        if (data.cardName.length < 2)
          errors.cardName = "Enter the name on the card.";
      }
      if (data.payment === "wallet" && !utils.normalisePhone(data.walletNumber))
        errors.walletNumber = "Enter a valid wallet number.";

      const addressMissing = mode === "delivery" && !store.get().addressId;
      return { errors, addressMissing };
    }

    function submit() {
      const data = forms.read(form);
      const mode = store.get().mode;
      const { errors, addressMissing } = validate(data);

      const addressError = $("[data-error=address]", container);
      if (addressError) {
        addressError.textContent = addressMissing
          ? "Choose or add a delivery address."
          : "";
        addressError.hidden = !addressMissing;
      }
      const ok = forms.showErrors(form, errors);
      if (!ok || addressMissing) {
        if (addressMissing)
          addressError.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      const totals = cart.totals({ tip: ui_state.tip });
      if (!totals.meetsMinimum)
        return TM.toast(
          `Minimum order is ${money(restaurant.minOrder)}`,
          "error",
        );

      const address = store
        .get()
        .addresses.find((a) => a.id === store.get().addressId);
      const payment =
        data.payment === "card"
          ? {
              method: "card",
              label: `Card ending ${data.cardNumber.replace(/\s/g, "").slice(-4)}`,
            }
          : data.payment === "wallet"
            ? { method: "wallet", label: "Mobile wallet" }
            : { method: "cod", label: "Cash on delivery" };

      const phone = utils.normalisePhone(data.phone);
      const order = orders.place({
        restaurant,
        lines: cart.lines(),
        totals,
        mode,
        address: mode === "delivery" ? address : null,
        payment,
        contact: { name: data.name, phone },
        tip: totals.tip,
        note: data.note,
        noCutlery: Boolean(data.noCutlery),
        leaveAtDoor: Boolean(data.leaveAtDoor),
        scheduledFor: ui_state.when === "later" ? Number(data.slot) : null,
      });

      store.set({
        user: { ...(store.get().user || {}), name: data.name, phone },
      });
      cart.clear();
      TM.toast(`Order ${order.id} placed!`);
      TM.router.go(`/track/${order.id}`);
    }

    // Re-paint on store changes (basket, mode, address) except when the order was just placed
    let lastMode = store.get().mode;
    const unsubscribe = store.subscribe(() => {
      if (cart.isEmpty()) return;
      paintMode();
      paintAddress();
      paintTip();
      paintSummary();
      if (store.get().mode !== lastMode) {
        lastMode = store.get().mode;
        paintTime(); // only the wording changes; avoid resetting a chosen slot otherwise
      }
    });

    paintAll();
    return unsubscribe;
  }

  TM.views = TM.views || {};
  TM.views.checkout = { render };
})((window.TM = window.TM || {}));
