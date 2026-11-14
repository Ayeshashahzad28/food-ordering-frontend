// Application bootstrap: wire routes, global UI and start the router
(function (TM) {
  "use strict";

  const { router, actions, orders, views, header } = TM;

  router.add("/", views.home);
  router.add("/restaurant/:id", views.restaurant);
  router.add("/checkout", views.checkout);
  router.add("/track/:id", views.tracking);
  router.add("/orders", views.orders);
  router.add("/favorites", views.favorites);
  router.add("/account", views.account);
  router.add("/help", views.help);

  function start() {
    actions.init();
    orders.syncStatuses();
    header.mount();
    router.start(document.getElementById("view"));

    // Keep the "live order" dot accurate while the user browses.
    setInterval(() => orders.active().length && orders.syncStatuses(), 5000);
  }

  document.addEventListener("DOMContentLoaded", start);
})((window.TM = window.TM || {}));
