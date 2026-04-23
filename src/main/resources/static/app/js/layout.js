/**
 * Layout compartido (sidebar + topbar). El menú lateral se arma con
 * GET /api/auth/mis-pantallas (pantallas permitidas según roles en IAM).
 */
(function () {
  "use strict";

  var BASE = "/app/pages";

  function href(page) {
    return BASE + "/" + page + ".html";
  }

  function escapeHtml(s) {
    if (!s) return "";
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  /** De "/app/pages/inicio.html" → "inicio"; "/iam/index.html" → "index" */
  function pageIdFromRuta(ruta) {
    if (!ruta) return "";
    var m = ruta.match(/\/([^/]+)\.html$/);
    return m ? m[1] : "";
  }

  /** Pantallas que no deben mostrarse en la barra lateral (siguen existiendo en IAM si hace falta). */
  function filterSidebarPantallas(pantallas) {
    if (!pantallas || !pantallas.length) return pantallas || [];
    return pantallas.filter(function (p) {
      var c = (p.codigo || "").toUpperCase();
      if (c === "GRAFICOS" || c === "IAM") return false;
      var r = (p.ruta || "").toLowerCase();
      if (r.indexOf("graficos.html") >= 0) return false;
      if (r.indexOf("/iam/") >= 0 || r.indexOf("iam/index") >= 0) return false;
      return true;
    });
  }

  var ICONS_BY_CODIGO = {
    INICIO: "fa-house",
    GRAFICOS: "fa-chart-column",
    AGENDA: "fa-calendar-days",
    CITAS: "fa-clipboard-list",
    PACIENTES: "fa-user-injured",
    ESPECIALIDADES: "fa-stethoscope",
    ESPECIALISTAS: "fa-user-doctor",
    REPORTES: "fa-chart-pie",
    RECURSOS: "fa-boxes-stacked",
    IAM: "fa-id-card-clip",
  };

  /** ¿Algún descendiente (pantalla o submenú activo) coincide con la página actual? */
  function menuHasActiveDescendant(menuId, currentPage, pantallas) {
    var children = pantallas.filter(function (p) {
      return p.parentId === menuId;
    });
    for (var i = 0; i < children.length; i++) {
      var c = children[i];
      if (c.tipo === "MENU") {
        if (menuHasActiveDescendant(c.id, currentPage, pantallas)) return true;
      } else if (pageIdFromRuta(c.ruta) === currentPage) {
        return true;
      }
    }
    return false;
  }

  function setSubmenuExpanded(btn, sub, expanded) {
    if (!btn || !sub) return;
    if (expanded) {
      sub.classList.remove("hidden");
      btn.setAttribute("aria-expanded", "true");
    } else {
      sub.classList.add("hidden");
      btn.setAttribute("aria-expanded", "false");
    }
    var ch = btn.querySelector(".his-nav-chevron");
    if (ch) {
      ch.classList.toggle("fa-chevron-right", !expanded);
      ch.classList.toggle("fa-chevron-down", expanded);
    }
  }

  function attachSidebarMenuToggles(pantallas, currentPage) {
    var nav = document.getElementById("his-sidebar-nav");
    if (!nav) return;
    nav.querySelectorAll(".his-nav-menu-group[data-his-menu-id]").forEach(function (li) {
      var raw = li.getAttribute("data-his-menu-id");
      var id = raw ? parseInt(raw, 10) : NaN;
      if (isNaN(id)) return;
      var btn = li.querySelector(".his-nav-menu-head");
      var sub = li.querySelector("[data-his-submenu]");
      if (!btn || !sub) return;
      var autoOpen = menuHasActiveDescendant(id, currentPage, pantallas);
      setSubmenuExpanded(btn, sub, autoOpen);
      btn.addEventListener("click", function () {
        var hidden = sub.classList.contains("hidden");
        setSubmenuExpanded(btn, sub, hidden);
      });
    });
  }

  function buildNavItemsHTML(currentPage, pantallas) {
    pantallas = filterSidebarPantallas(pantallas);
    if (!pantallas || !pantallas.length) {
      return (
        '<li class="px-6 py-3 text-ocean-400 text-sm">No tiene pantallas asignadas. ' +
        "Un administrador debe registrar la pantalla en IAM y vincularla a sus roles.</li>"
      );
    }
    var byParent = {};
    pantallas.forEach(function (p) {
      var key = p.parentId != null && p.parentId !== undefined ? String(p.parentId) : "root";
      if (!byParent[key]) byParent[key] = [];
      byParent[key].push(p);
    });
    Object.keys(byParent).forEach(function (k) {
      byParent[k].sort(function (a, b) {
        var o = (a.orden || 0) - (b.orden || 0);
        if (o !== 0) return o;
        return (a.nombre || "").localeCompare(b.nombre || "");
      });
    });
    function isMenu(p) {
      return p.tipo === "MENU";
    }
    function renderGroup(parentKey) {
      var items = byParent[parentKey] || [];
      var html = "";
      items.forEach(function (p) {
        var icon = ICONS_BY_CODIGO[p.codigo] || "fa-window-maximize";
        if (isMenu(p)) {
          var sub = renderGroup(String(p.id));
          if (sub) {
            html +=
              '<li class="his-nav-menu-group" data-his-menu-id="' +
              String(p.id) +
              '">' +
              '<button type="button" class="his-nav-menu-head w-full flex items-center gap-1 px-6 py-2.5 text-left text-ocean-200 text-xs font-semibold tracking-wide uppercase border-b border-ocean-800/50 hover:bg-ocean-800/40 transition-colors bg-transparent cursor-pointer text-inherit" aria-expanded="false">' +
              '<i class="fa-solid fa-chevron-right his-nav-chevron w-4 shrink-0 text-ocean-400" aria-hidden="true"></i>' +
              '<i class="fa-solid ' +
              icon +
              ' w-6 text-ocean-400 shrink-0" aria-hidden="true"></i>' +
              '<span class="truncate">' +
              escapeHtml(p.nombre) +
              "</span></button>" +
              '<ul class="space-y-0.5 py-1 pl-3 ml-1 border-l border-ocean-800/40 his-sidebar-submenu hidden" data-his-submenu>' +
              sub +
              "</ul></li>";
          } else {
            html +=
              '<li class="his-nav-menu-group"><div class="flex items-center px-6 py-2.5 text-ocean-200 text-xs font-semibold tracking-wide uppercase border-b border-ocean-800/50">' +
              '<span class="inline-block w-4 shrink-0" aria-hidden="true"></span>' +
              '<i class="fa-solid ' +
              icon +
              ' w-6 text-ocean-400 shrink-0"></i><span class="truncate">' +
              escapeHtml(p.nombre) +
              "</span></div></li>";
          }
        } else {
          var pid = pageIdFromRuta(p.ruta);
          var active = currentPage === pid ? "sidebar-item-active" : "";
          var fw = currentPage === pid ? "font-medium" : "";
          var href = escapeHtml(p.ruta || "#");
          html +=
            '<li><a href="' +
            href +
            '" class="' +
            active +
            ' flex items-center px-6 py-2.5 hover:bg-ocean-800 transition-colors group">' +
            '<i class="fa-solid ' +
            icon +
            ' w-6 text-ocean-300 group-hover:text-white transition-colors shrink-0"></i>' +
            '<span class="' +
            fw +
            ' truncate">' +
            escapeHtml(p.nombre) +
            "</span></a></li>";
        }
      });
      return html;
    }
    return renderGroup("root");
  }

  function getSidebarShell(currentPage) {
    return (
      '<aside class="w-64 bg-ocean-900 text-white flex flex-col shadow-2xl transition-all duration-300 z-20 hidden md:flex" id="sidebar">' +
      '<div class="h-16 flex items-center px-4 bg-ocean-950 border-b border-ocean-800 gap-2 min-w-0">' +
      '<img src="/img/logo-pipitos.png" alt="HIS-PIPITOS" class="his-sidebar-brand-logo h-9 w-auto object-contain object-left shrink-0" width="140" height="36" decoding="async" />' +
      '<span class="text-lg font-bold tracking-wide truncate">HIS-PIPITOS</span></div>' +
      '<nav class="flex-1 overflow-y-auto py-4"><ul class="space-y-1" id="his-sidebar-nav">' +
      '<li class="px-6 py-3 text-ocean-400 text-sm flex items-center gap-2"><i class="fa-solid fa-hourglass his-loading-ico" aria-hidden="true"></i><span>Cargando menú…</span></li></ul></nav>' +
      '<div class="p-4 bg-ocean-950 border-t border-ocean-800">' +
      '<button type="button" id="his-layout-logout" class="shell-logout-btn shell-logout-btn--sidebar">' +
      '<i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i><span>Cerrar sesión</span></button></div></aside>'
    );
  }

  function getTopbarHTML(pageTitle) {
    return (
      '<header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10">' +
      '<div class="flex items-center min-w-0 gap-2">' +
      '<img src="/img/logo-pipitos.png" alt="" class="his-topbar-brand-logo h-7 w-auto object-contain shrink-0 md:hidden" width="120" height="28" decoding="async" />' +
      '<button type="button" onclick="document.getElementById(\'sidebar\').classList.toggle(\'hidden\')" class="md:hidden mr-2 text-gray-500 hover:text-ocean-600 shrink-0">' +
      '<i class="fa-solid fa-bars text-xl"></i></button>' +
      '<h2 class="text-xl font-semibold text-ocean-900 truncate">' +
      pageTitle +
      "</h2></div>" +
      '<div class="flex items-center space-x-3 min-w-0" id="topbar-right">' +
      '<div id="topbar-extras"></div>' +
      '<div class="flex items-center space-x-3 pl-3 border-l border-gray-200 min-w-0">' +
      '<span id="session-user-name" class="shell-session-name shell-session-name--on-light min-w-0" title=""></span>' +
      '<div id="topbar-actions-menu" class="shrink-0"></div></div></div></header>'
    );
  }

  function updateSidebar(currentPage, pantallas) {
    var ul = document.getElementById("his-sidebar-nav");
    if (!ul) return;
    ul.innerHTML = buildNavItemsHTML(currentPage, pantallas);
    attachSidebarMenuToggles(pantallas, currentPage);
  }

  function mount(currentPage, pageTitle, rootEl) {
    rootEl.className = "flex w-full h-full";
    rootEl.innerHTML =
      getSidebarShell(currentPage) +
      '<div class="flex-1 flex flex-col h-screen overflow-hidden min-w-0">' +
      getTopbarHTML(pageTitle) +
      '<main class="flex-1 min-h-0 flex flex-col overflow-x-hidden overflow-y-auto bg-slate-50 p-6 relative">' +
      '<div id="page-root" class="min-h-0 flex-1 flex flex-col"></div></main></div>';

    var btn = document.getElementById("his-layout-logout");
    if (btn) {
      btn.onclick = function () {
        if (typeof HisAuth !== "undefined") HisAuth.logout();
      };
    }
  }

  window.HisLayout = {
    mount: mount,
    href: href,
    updateSidebar: updateSidebar,
    pageIdFromRuta: pageIdFromRuta,
  };
})();
