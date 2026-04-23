(function () {
  const TOKEN_KEY = "his_pipitos_access_token";

  window.HisAuth = {
    getToken: function () {
      return localStorage.getItem(TOKEN_KEY);
    },
    setToken: function (t) {
      if (t) localStorage.setItem(TOKEN_KEY, t);
      else localStorage.removeItem(TOKEN_KEY);
    },
    logout: function () {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = "/login.html";
    },
    requireAuth: function () {
      if (!this.getToken()) {
        window.location.href = "/login.html";
        return false;
      }
      return true;
    },
  };

  window.apiFetch = async function (path, options) {
    const opts = options || {};
    const headers = opts.headers || {};
    const token = HisAuth.getToken();
    if (token) {
      headers["Authorization"] = "Bearer " + token;
    }
    if (opts.body && typeof opts.body === "object" && !(opts.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(opts.body);
    }
    opts.headers = headers;
    const res = await fetch(path, opts);
    if (res.status === 401) {
      HisAuth.logout();
      throw new Error("No autorizado");
    }
    return res;
  };

  /**
   * Menú desplegable "Acciones" (Inicio / Cerrar sesión). El root debe contener
   * [data-shell-dropdown] con .shell-session-dropdown-trigger y .shell-session-dropdown-panel.
   */
  window.ShellSessionDropdown = {
    attach: function (root) {
      if (!root) return;
      var trigger = root.querySelector(".shell-session-dropdown-trigger");
      var panel = root.querySelector(".shell-session-dropdown-panel");
      if (!trigger || !panel) return;

      function close() {
        panel.hidden = true;
        root.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
      }
      function open() {
        panel.hidden = false;
        root.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      }
      trigger.addEventListener("click", function (e) {
        e.stopPropagation();
        if (panel.hidden) open();
        else close();
      });
      document.addEventListener("click", function (e) {
        if (!root.contains(e.target)) close();
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") close();
      });
    },
  };
})();
