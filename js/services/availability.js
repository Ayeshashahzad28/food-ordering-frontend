// Opening-hours logic and delivery-slot generation
(function (TM) {
  "use strict";

  const decimalHour = (d) => d.getHours() + d.getMinutes() / 60;

  // Hours use [open, close] a close value above 24 means "after midnight"
  function isOpenAt(restaurant, date = new Date()) {
    const [open, close] = restaurant.hours;
    const h = decimalHour(date);
    return (h >= open && h < close) || (close > 24 && h + 24 < close);
  }

  // Next time (Date) the restaurant opens, for "Opens at …" labels
  function opensLabel(restaurant) {
    return TM.utils.hourLabel(restaurant.hours[0]);
  }

  // 30-minute delivery slots starting 45 minutes from now, within opening hours
  function deliverySlots(restaurant, count = 8, now = new Date()) {
    const slots = [];
    const first = new Date(now.getTime() + 45 * 60000);
    first.setMinutes(first.getMinutes() < 30 ? 30 : 60, 0, 0);

    for (let i = 0; slots.length < count && i < 48; i++) {
      const slot = new Date(first.getTime() + i * 30 * 60000);
      if (isOpenAt(restaurant, slot)) {
        slots.push({ value: slot.getTime(), label: TM.utils.dateTime(slot) });
      }
    }
    return slots;
  }

  TM.availability = { isOpenAt, opensLabel, deliverySlots };
})((window.TM = window.TM || {}));
