(function (TM) {
  "use strict";

  const { store, cart, catalog, utils, modal, forms, ui } = TM;
  const { esc, money, $, $$ } = utils;

  const CITIES = [
    "Karachi",
    "Lahore",
    "Islamabad",
    "Rawalpindi",
    "Faisalabad",
    "Peshawar",
  ];

  // Address editor + picker

  function addressLabel(a) {
    return `${a.line}, ${a.area}, ${a.city}`;
  }

  function openAddressEditor(onSaved) {
    const dialog = modal.open({
      title: "Add delivery address",
      html: `
        <form class="form" novalidate>
          <div class="field">
            <span class="field__label">Save as</span>
            <div class="chip-row" role="radiogroup" aria-label="Address label">
              ${["Home", "Work", "Other"].map((l, i) => `<label class="chip-radio"><input type="radio" name="label" value="${l}" ${i === 0 ? "checked" : ""}/><span>${l}</span></label>`).join("")}
            </div>
          </div>
          ${forms.field({ name: "line", label: "House / street", placeholder: "e.g. House 12, Street 5, Block C" })}
          ${forms.field({ name: "area", label: "Area / neighbourhood", placeholder: "e.g. Gulberg III" })}
          ${forms.select({ name: "city", label: "City", options: CITIES })}
          ${forms.textarea({ name: "note", label: "Note for rider (optional)", placeholder: "Landmark, gate colour, floor…", rows: 2, maxlength: 120 })}
          <div class="form-actions">
            <button class="btn btn--ghost" type="button" data-modal-close>Cancel</button>
            <button class="btn btn--primary" type="submit">Save address</button>
          </div>
        </form>`,
    });

    const form = $("form", dialog.body);
    form
      .querySelector("[data-modal-close]")
      .addEventListener("click", dialog.close);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = forms.read(form);
      const errors = {};
      if (data.line.length < 5)
        errors.line = "Enter your house and street (at least 5 characters).";
      if (data.area.length < 2)
        errors.area = "Enter your area or neighbourhood.";
      if (!forms.showErrors(form, errors)) return;

      const address = {
        id: utils.uid("addr"),
        label: data.label,
        line: data.line,
        area: data.area,
        city: data.city,
        note: data.note,
      };
      store.set((s) => ({
        addresses: [...s.addresses, address],
        addressId: address.id,
      }));
      dialog.close();
      TM.toast("Address saved");
      if (onSaved) onSaved(address);
    });
  }

  function openAddressPicker() {
    const render = () => {
      const { addresses, addressId } = store.get();
      return addresses.length
        ? `<ul class="addr-list">${addresses
            .map(
              (a) => `
            <li>
              <button type="button" class="addr ${a.id === addressId ? "is-selected" : ""}" data-pick-address="${a.id}">
                <span class="addr__label">${esc(a.label)}</span>
                <span class="addr__text">${esc(addressLabel(a))}</span>
              </button>
            </li>`,
            )
            .join("")}</ul>`
        : `<p class="muted">You have no saved addresses yet.</p>`;
    };

    const dialog = modal.open({
      title: "Deliver to",
      html: `<div data-slot="list">${render()}</div><button class="btn btn--outline btn--block" type="button" data-add-address>+ Add new address</button>`,
    });
    dialog.body.addEventListener("click", (e) => {
      const pick = e.target.closest("[data-pick-address]");
      if (pick) {
        store.set({ addressId: pick.dataset.pickAddress });
        dialog.close();
      }
      if (e.target.closest("[data-add-address]")) {
        dialog.close();
        setTimeout(() => openAddressEditor(), 0);
      }
    });
  }

  // Item customiser

  // Pre-select the free option of each required single-choice group
  function defaultSelection(item) {
    const picked = [];
    item.options.forEach((g) => {
      if (g.type === "single" && g.required) {
        const free = g.options.find((o) => o.price === 0) || g.options[0];
        picked.push(free.id);
      }
    });
    return picked;
  }

  function openItemDialog(restaurantId, itemId) {
    const restaurant = catalog.byId(restaurantId);
    const item = restaurant && TM.menu.findItem(restaurant, itemId);
    if (!item) return;
    const isOpen = TM.availability.isOpenAt(restaurant);
    const initial = defaultSelection(item);

    const optionGroup = (g) => `
      <fieldset class="opt-group">
        <legend>${esc(g.title)} <span class="tag">${g.required ? "Required" : "Optional"}</span></legend>
        ${g.options
          .map(
            (o) => `
          <label class="opt">
            <input type="${g.type === "single" ? "radio" : "checkbox"}" name="${g.id}" value="${o.id}" ${initial.includes(o.id) ? "checked" : ""} />
            <span class="opt__name">${esc(o.name)}</span>
            <span class="opt__price">${o.price ? (o.price > 0 ? "+" : "−") + money(Math.abs(o.price)) : ""}</span>
          </label>`,
          )
          .join("")}
      </fieldset>`;

    const dialog = modal.open({
      title: item.name,
      html: `
        <form class="item-form" novalidate>
          <img class="item-form__img" src="${item.img}" alt="${esc(item.name)}" />
          <p class="muted">${esc(item.desc)}</p>
          ${item.options.map(optionGroup).join("")}
          <div class="field">
            <label class="field__label" for="item-note">Special instructions (optional)</label>
            <textarea class="input" id="item-note" name="note" rows="2" maxlength="140" placeholder="e.g. No onions"></textarea>
          </div>
          <div class="item-form__foot">
            <div class="stepper" role="group" aria-label="Quantity">
              <button type="button" class="stepper__btn" data-qty="-1" aria-label="Decrease quantity">−</button>
              <span class="stepper__qty" data-qty-value aria-live="polite">1</span>
              <button type="button" class="stepper__btn" data-qty="1" aria-label="Increase quantity">+</button>
            </div>
            <button class="btn btn--primary btn--grow" type="submit" ${isOpen ? "" : "disabled"}>
              ${isOpen ? `Add to basket · <span data-price>${money(item.price)}</span>` : "Restaurant is closed"}
            </button>
          </div>
        </form>`,
    });

    const form = $("form", dialog.body);
    let qty = 1;

    const selectedIds = () => $$("input:checked", form).map((i) => i.value);
    const unitPrice = () =>
      Math.max(
        0,
        item.price + TM.menu.resolveOptions(item, selectedIds()).extra,
      );
    const refresh = () => {
      $("[data-qty-value]", form).textContent = qty;
      const price = $("[data-price]", form);
      if (price) price.textContent = money(unitPrice() * qty);
    };

    form.addEventListener("change", refresh);
    form.addEventListener("click", (e) => {
      const step = e.target.closest("[data-qty]");
      if (!step) return;
      qty = utils.clamp(qty + Number(step.dataset.qty), 1, 20);
      refresh();
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const add = async () => {
        cart.add({
          restaurantId,
          itemId,
          optionIds: selectedIds(),
          note: $("#item-note", form).value,
          qty,
        });
        dialog.close();
        TM.toast(`${qty} × ${item.name} added to basket`);
      };

      if (!cart.conflictsWith(restaurantId)) return add();
      modal
        .confirm({
          title: "Start a new basket?",
          message: `Your basket has items from ${cart.restaurant().name}. Adding this will clear it and start a new basket from ${restaurant.name}.`,
          confirmLabel: "Start new basket",
          danger: true,
        })
        .then((yes) => {
          if (yes) {
            cart.clear();
            add();
          }
        });
    });
  }

  // Basket drawer

  function openCartDrawer() {
    const drawer = modal.open({
      title: "Your basket",
      variant: "drawer",
      html: `<div data-slot="cart"></div>`,
      onClose: () => unsubscribe(),
    });
    const slot = $("[data-slot=cart]", drawer.body);

    function render() {
      const restaurant = cart.restaurant();
      if (!restaurant) {
        slot.innerHTML = ui.emptyState({
          icon: "🛒",
          title: "Your basket is empty",
          text: "Add something delicious from a restaurant to get started.",
          cta: `<button class="btn btn--primary" type="button" data-action="browse-restaurants">Browse restaurants</button>`,
        });
        return;
      }

      const t = cart.totals();
      const mode = store.get().mode;
      slot.innerHTML = `
        <div class="cart-head">
          ${ui.logo(restaurant)}
          <div><strong>${esc(restaurant.name)}</strong><p class="muted small">${restaurant.eta[0]}–${restaurant.eta[1]} min</p></div>
        </div>
        ${ui.modeSwitch(mode)}
        <ul class="cart-lines">
          ${cart
            .lines()
            .map(
              (l) => `
            <li class="cart-line">
              <div class="cart-line__info">
                <strong>${esc(l.name)}</strong>
                ${l.labels.length ? `<p class="muted small">${esc(l.labels.join(", "))}</p>` : ""}
                ${l.note ? `<p class="muted small">“${esc(l.note)}”</p>` : ""}
                <button type="button" class="link-btn" data-action="line-remove" data-line="${l.id}">Remove</button>
              </div>
              <div class="cart-line__side">${ui.stepper(l.id, l.qty)}<strong>${money(l.unit * l.qty)}</strong></div>
            </li>`,
            )
            .join("")}
        </ul>
        ${voucherBlock(t)}
        ${totalsBlock(t, mode)}
        ${t.meetsMinimum ? "" : `<p class="notice notice--warn">Add ${money(t.shortBy)} more to reach the minimum order of ${money(restaurant.minOrder)}.</p>`}
        <div class="form-actions form-actions--stack">
          <button class="btn btn--primary btn--block" type="button" data-action="go-checkout" ${t.meetsMinimum ? "" : "disabled"}>Go to checkout · ${money(t.total)}</button>
          <button class="link-btn" type="button" data-action="clear-cart">Clear basket</button>
        </div>`;
    }

    // Re-render on every state change while the drawer is open.
    const unsubscribe = store.subscribe(() => {
      if (document.body.contains(slot)) render();
    });
    drawer.body.addEventListener("submit", (e) => {
      const form = e.target.closest("[data-voucher-form]");
      if (!form) return;
      e.preventDefault();
      const result = cart.applyVoucher($("input", form).value);
      if (!result.ok) TM.toast(result.reason, "error");
      else TM.toast(`${result.voucher.code} applied`);
    });
    render();
  }

  // reusable basket fragments (also used by checkout)

  function voucherBlock(t) {
    if (t.voucherCode) {
      return `<div class="voucher is-applied"><span>🎟️ <strong>${esc(t.voucherCode)}</strong> applied</span><button class="link-btn" type="button" data-action="remove-voucher">Remove</button></div>`;
    }
    return `
      <form class="voucher" data-voucher-form>
        <input class="input" name="code" placeholder="Voucher code" aria-label="Voucher code" autocomplete="off" />
        <button class="btn btn--outline" type="submit">Apply</button>
      </form>
      ${t.voucherError ? `<p class="field__error">${esc(t.voucherError)}</p>` : ""}`;
  }

  function totalsBlock(t, mode) {
    const row = (label, value, cls = "") =>
      `<div class="totals__row ${cls}"><span>${label}</span><span>${value}</span></div>`;
    return `
      <div class="totals">
        ${row("Subtotal", money(t.subtotal))}
        ${mode === "delivery" ? row("Delivery fee", t.deliveryFee === 0 ? "Free" : money(t.deliveryFee), t.deliveryFee === 0 ? "is-free" : "") : ""}
        ${row("Service fee", money(t.serviceFee))}
        ${t.tip ? row("Rider tip", money(t.tip)) : ""}
        ${t.discount ? row(`Discount (${esc(t.voucherCode)})`, "−" + money(t.discount), "is-free") : ""}
        ${row("Total", money(t.total), "totals__total")}
      </div>`;
  }

  // Global actions

  TM.actions.register({
    "set-mode"(el) {
      store.set({ mode: el.dataset.mode });
    },

    "toggle-fav"(el) {
      const id = el.dataset.id;
      store.set((s) => ({
        favorites: s.favorites.includes(id)
          ? s.favorites.filter((f) => f !== id)
          : [...s.favorites, id],
      }));
      const on = store.get().favorites.includes(id);
      TM.toast(on ? "Added to favorites" : "Removed from favorites", "info");
    },

    "open-item": (el) => openItemDialog(el.dataset.restaurant, el.dataset.item),
    "open-cart": openCartDrawer,
    "open-address": openAddressPicker,
    "add-address": () => openAddressEditor(),

    "line-inc"(el) {
      const line = cart.lines().find((l) => l.id === el.dataset.line);
      if (line) cart.setQty(line.id, line.qty + 1);
    },
    "line-dec"(el) {
      const line = cart.lines().find((l) => l.id === el.dataset.line);
      if (line) cart.setQty(line.id, line.qty - 1);
    },
    "line-remove": (el) => cart.setQty(el.dataset.line, 0),
    "clear-cart": () => cart.clear(),
    "remove-voucher": () => cart.removeVoucher(),

    "browse-restaurants"() {
      modal.closeAll();
      TM.router.go("/");
    },
    "go-checkout"() {
      modal.closeAll();
      TM.router.go("/checkout");
    },
  });

  TM.dialogs = {
    openAddressEditor,
    openAddressPicker,
    openItemDialog,
    openCartDrawer,
    voucherBlock,
    totalsBlock,
    addressLabel,
  };
})((window.TM = window.TM || {}));
