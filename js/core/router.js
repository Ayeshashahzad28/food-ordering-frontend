(function (TM) {
  "use strict";

  const routes = [];
  let cleanup = null;
  let outlet = null;

  // Turn "/restaurant/:id" into a matcher regexp plus param names /
  function compile(path) {
    const names = [];
    const source = path.replace(/:([^/]+)/g, (_, name) => {
      names.push(name);
      return "([^/]+)";
    });
    return { regex: new RegExp(`^${source}/?$`), names };
  }

  function parseHash() {
    const raw = location.hash.replace(/^#/, "") || "/";
    const [path, queryString = ""] = raw.split("?");
    return {
      path,
      query: Object.fromEntries(new URLSearchParams(queryString)),
    };
  }

  function resolve() {
    const { path, query } = parseHash();
    if (typeof cleanup === "function") cleanup();
    cleanup = null;

    for (const route of routes) {
      const match = path.match(route.regex);
      if (!match) continue;
      const params = {};
      route.names.forEach(
        (name, i) => (params[name] = decodeURIComponent(match[i + 1])),
      );
      // Each route renders into a fresh node so its event listeners are discarded with it.
      const mount = document.createElement("div");
      outlet.replaceChildren(mount);
      cleanup = route.view.render(mount, params, query) || null;
      window.scrollTo({ top: 0 });
      TM.router.current = { path, params, query };
      document.dispatchEvent(
        new CustomEvent("route:change", { detail: { path } }),
      );
      return;
    }
    location.hash = "#/";
  }

  TM.router = {
    current: { path: "/", params: {}, query: {} },

    add(path, view) {
      routes.push({ ...compile(path), view });
    },

    start(outletEl) {
      outlet = outletEl;
      window.addEventListener("hashchange", resolve);
      resolve();
    },

    go(path) {
      if (location.hash === `#${path}`) resolve();
      else location.hash = path;
    },
  };
})((window.TM = window.TM || {}));
