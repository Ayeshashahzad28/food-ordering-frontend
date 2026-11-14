// Form field templates and inline validation helpers
(function (TM) {
  "use strict";

  const { esc, $, $$ } = TM.utils;

  function field({
    name,
    label,
    type = "text",
    value = "",
    placeholder = "",
    hint = "",
    attrs = "",
  }) {
    return `
      <div class="field" data-field="${name}">
        <label class="field__label" for="f-${name}">${esc(label)}</label>
        <input class="input" id="f-${name}" name="${name}" type="${type}" value="${esc(value)}" placeholder="${esc(placeholder)}" ${attrs} />
        ${hint ? `<p class="field__hint">${esc(hint)}</p>` : ""}
        <p class="field__error" role="alert" hidden></p>
      </div>`;
  }

  function textarea({
    name,
    label,
    value = "",
    placeholder = "",
    rows = 3,
    maxlength = 200,
  }) {
    return `
      <div class="field" data-field="${name}">
        <label class="field__label" for="f-${name}">${esc(label)}</label>
        <textarea class="input" id="f-${name}" name="${name}" rows="${rows}" maxlength="${maxlength}" placeholder="${esc(placeholder)}">${esc(value)}</textarea>
        <p class="field__error" role="alert" hidden></p>
      </div>`;
  }

  function select({ name, label, options, value = "" }) {
    const opts = options
      .map(
        (o) =>
          `<option value="${esc(o)}" ${o === value ? "selected" : ""}>${esc(o)}</option>`,
      )
      .join("");
    return `
      <div class="field" data-field="${name}">
        <label class="field__label" for="f-${name}">${esc(label)}</label>
        <select class="input" id="f-${name}" name="${name}">${opts}</select>
        <p class="field__error" role="alert" hidden></p>
      </div>`;
  }

  // Read a form into a plain object with trimmed string values
  function read(form) {
    const data = {};
    new FormData(form).forEach(
      (value, key) =>
        (data[key] = typeof value === "string" ? value.trim() : value),
    );
    return data;
  }

  // Show errors ({name: message}); returns true when the form is valid
  function showErrors(form, errors) {
    $$(".field", form).forEach((fieldEl) => {
      const message = errors[fieldEl.dataset.field];
      const slot = $(".field__error", fieldEl);
      const input = $(".input", fieldEl);
      if (slot) {
        slot.textContent = message || "";
        slot.hidden = !message;
      }
      if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
    });
    const firstBad = Object.keys(errors)[0];
    if (firstBad) {
      const target = $(`[name="${firstBad}"]`, form);
      if (target) target.focus();
    }
    return Object.keys(errors).length === 0;
  }

  TM.forms = { field, textarea, select, read, showErrors };
})((window.TM = window.TM || {}));
