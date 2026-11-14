// Account: profile, saved addresses, vouchers and demo data controls
(function (TM) {
  "use strict";

  const { store, catalog, utils, forms, modal, dialogs } = TM;
  const { esc, $ } = utils;

  function render(container) {
    function paint() {
      const { user, addresses, addressId, orders } = store.get();
      const profile = user || {};

      container.innerHTML = `
        <div class="page page--narrow">
          <h1 class="page__title">Account</h1>

          <section class="panel">
            <h2 class="panel__title">Profile</h2>
            <form class="form" data-profile novalidate>
              <div class="form-grid">
                ${forms.field({ name: "name", label: "Full name", value: profile.name || "", attrs: 'autocomplete="name"' })}
                ${forms.field({ name: "phone", label: "Mobile number", type: "tel", value: profile.phone || "", placeholder: "03XX XXXXXXX", attrs: 'autocomplete="tel"' })}
              </div>
              ${forms.field({ name: "email", label: "Email (optional)", type: "email", value: profile.email || "", attrs: 'autocomplete="email"' })}
              <div class="form-actions"><button class="btn btn--primary" type="submit">Save profile</button></div>
            </form>
          </section>

          <section class="panel">
            <div class="panel__head"><h2 class="panel__title">Saved addresses</h2><button class="btn btn--outline" type="button" data-action="add-address">+ Add</button></div>
            ${
              addresses.length
                ? `<ul class="addr-list">${addresses
                    .map(
                      (a) => `
                  <li class="addr-row">
                    <div><strong>${esc(a.label)}</strong>${a.id === addressId ? ` <span class="badge badge--accent">Selected</span>` : ""}<p class="muted small">${esc(dialogs.addressLabel(a))}</p></div>
                    <div class="addr-row__actions">
                      ${a.id === addressId ? "" : `<button class="link-btn" type="button" data-address-use="${a.id}">Use</button>`}
                      <button class="link-btn link-btn--danger" type="button" data-address-delete="${a.id}">Delete</button>
                    </div>
                  </li>`,
                    )
                    .join("")}</ul>`
                : `<p class="muted">No addresses saved yet.</p>`
            }
          </section>

          <section class="panel">
            <h2 class="panel__title">Vouchers</h2>
            <ul class="voucher-list">${catalog.vouchers.map((v) => `<li><div><strong>${esc(v.title)}</strong><p class="muted small">${esc(v.desc)}</p></div><code>${v.code}</code></li>`).join("")}</ul>
          </section>

          <section class="panel">
            <h2 class="panel__title">Your data</h2>
            <p class="muted small">Everything is stored on this device only (${orders.length} order${orders.length === 1 ? "" : "s"}, ${addresses.length} address${addresses.length === 1 ? "" : "es"}).</p>
            <button class="btn btn--danger-outline" type="button" data-reset>Reset all demo data</button>
          </section>
        </div>`;
    }

    container.addEventListener("submit", (e) => {
      const form = e.target.closest("[data-profile]");
      if (!form) return;
      e.preventDefault();
      const data = forms.read(form);
      const errors = {};
      if (data.name.length < 2) errors.name = "Enter your full name.";
      const phone = utils.normalisePhone(data.phone);
      if (!phone)
        errors.phone = "Enter a valid mobile number, e.g. 0300 1234567.";
      if (data.email && !/^\S+@\S+\.\S+$/.test(data.email))
        errors.email = "Enter a valid email address.";
      if (!forms.showErrors(form, errors)) return;
      store.set({ user: { name: data.name, phone, email: data.email } });
      TM.toast("Profile saved");
    });

    container.addEventListener("click", async (e) => {
      const use = e.target.closest("[data-address-use]");
      const del = e.target.closest("[data-address-delete]");
      if (use) store.set({ addressId: use.dataset.addressUse });
      if (del) {
        const id = del.dataset.addressDelete;
        store.set((s) => {
          const addresses = s.addresses.filter((a) => a.id !== id);
          return {
            addresses,
            addressId:
              s.addressId === id
                ? addresses[0]
                  ? addresses[0].id
                  : null
                : s.addressId,
          };
        });
      }
      if (e.target.closest("[data-reset]")) {
        const yes = await modal.confirm({
          title: "Reset demo data?",
          message:
            "This deletes your profile, addresses, basket, favorites and orders from this device.",
          confirmLabel: "Reset everything",
          danger: true,
        });
        if (yes) {
          store.reset();
          TM.toast("Demo data cleared", "info");
        }
      }
    });

    paint();
    return store.subscribe(paint);
  }

  TM.views = TM.views || {};
  TM.views.account = { render };
})((window.TM = window.TM || {}));
