// Small, dependency-free helpers shared by every module
(function (TM) {
  "use strict";

  const HTML_ESCAPES = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  const utils = {
    // Escape text for safe interpolation into HTML templates
    esc: (value) =>
      String(value ?? "").replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]),

    // Format a number as Pakistani rupees: Rs 1,250
    money: (n) => `Rs ${Math.round(n).toLocaleString("en-PK")}`,

    $: (selector, root = document) => root.querySelector(selector),
    $$: (selector, root = document) =>
      Array.from(root.querySelectorAll(selector)),

    uid: (prefix = "id") =>
      `${prefix}-${Math.random().toString(36).slice(2, 8)}`,

    clamp: (n, min, max) => Math.min(max, Math.max(min, n)),

    debounce(fn, wait = 200) {
      let timer;
      return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), wait);
      };
    },

    // "12:05 PM" from a Date or timestamp
    time: (d) =>
      new Date(d).toLocaleTimeString("en-PK", {
        hour: "numeric",
        minute: "2-digit",
      }),

    // "14 Nov, 1:55 AM"
    dateTime: (d) =>
      new Date(d).toLocaleString("en-PK", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      }),

    // mm:ss countdown text from seconds
    clock(seconds) {
      const s = Math.max(0, Math.round(seconds));
      return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
    },

    // Format a decimal hour (e.g. 23.5, or 26 for 02:00 next day) as "11:30 PM"
    hourLabel(h) {
      const hh = Math.floor(h) % 24;
      const mm = Math.round((h % 1) * 60);
      const suffix = hh >= 12 ? "PM" : "AM";
      return `${hh % 12 || 12}${mm ? ":" + String(mm).padStart(2, "0") : ":00"} ${suffix}`;
    },

    // Luhn checksum for card number validation
    luhn(digits) {
      let sum = 0;
      let alt = false;
      for (let i = digits.length - 1; i >= 0; i--) {
        let n = Number(digits[i]);
        if (alt) {
          n *= 2;
          if (n > 9) n -= 9;
        }
        sum += n;
        alt = !alt;
      }
      return digits.length >= 13 && sum % 10 === 0;
    },

    // Pakistani mobile number: 03XXXXXXXXX (spaces/dashes/+92 tolerated)
    normalisePhone(raw) {
      const digits = String(raw || "").replace(/[^\d]/g, "");
      const local = digits.startsWith("92") ? "0" + digits.slice(2) : digits;
      return /^03\d{9}$/.test(local) ? local : null;
    },
  };

  TM.utils = utils;
})((window.TM = window.TM || {}));
