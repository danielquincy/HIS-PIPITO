  "use strict";

  if (!HisAuth.requireAuth()) {
    throw "";
  }

  var PAGE_SIZE = 5;

  var allRoles = [];
  var iamRolesList = [];
  var allUsers = [];
  var allPantallas = [];
  var allBlocked = [];
  var editingPantallaId = null;
  var editingRoleId = null;
  var editingUserId = null;
  var userEnabled = true;
  /** id de pantalla → true si el rol en edición debe tenerla */
  var rolePantallaSelection = {};
  /** id de rol → true si el usuario seleccionado en membresías lo tiene */
  var membresiaRoleSelection = {};
  var selectedMembresiaUserId = null;
  var selectedBlockedId = null;

  var pantallasPage = 1;
  var rolesPage = 1;
  var usersPage = 1;
  var membresiasPage = 1;
  var blockedPage = 1;

  /** Vista IAM activa (hash); sirve para limpiar la vista anterior al navegar. */
  var currentIamView = null;

  var titles = {
    inicio: "Inicio",
    pantallas: "Pantallas",
    roles: "Roles",
    usuarios: "Usuarios",
    membresias: "Membresías",
    bloqueados: "Usuarios bloqueados",
  };

  function showAlert(msg, isError) {
    var el = document.getElementById("iam-alert");
    el.style.display = "block";
    el.style.background = isError ? "#fde7e9" : "#fff4ce";
    el.style.borderColor = isError ? "#f1bbbc" : "#fdeeb8";
    el.textContent = msg;
  }

  function hideAlert() {
    document.getElementById("iam-alert").style.display = "none";
  }

  function escapeHtml(s) {
    if (!s) return "";
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function randomPwd() {
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnopqrstuvwxyz";
    var s = "";
    for (var i = 0; i < 12; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
    return s;
  }

  function displayName(u) {
    var parts = [u.primerNombre, u.segundoNombre, u.primerApellido, u.segundoApellido].filter(Boolean);
    if (parts.length) return parts.join(" ");
    return u.username;
  }

  /** Paginación: resumen + anterior/siguiente */
  function renderPaginationBar(containerId, page, totalItems, onPageChange) {
    var totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / PAGE_SIZE);
    if (page > totalPages) page = totalPages;
    if (page < 1) page = 1;
    var el = document.getElementById(containerId);
    if (!el) return page;
    var start = totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    var end = Math.min(page * PAGE_SIZE, totalItems);
    var summaryText = totalItems === 0 ? "Sin registros" : start + "–" + end + " de " + totalItems;
    var navHtml = "";
    if (totalItems > PAGE_SIZE) {
      navHtml =
        '<div class="iam-pagination">' +
        '<button type="button" class="iam-page-btn" data-iam-page="prev" ' +
        (page <= 1 ? "disabled" : "") +
        ">‹</button>" +
        '<span class="iam-page-info">Página ' +
        page +
        " de " +
        totalPages +
        "</span>" +
        '<button type="button" class="iam-page-btn" data-iam-page="next" ' +
        (page >= totalPages ? "disabled" : "") +
        ">›</button>" +
        "</div>";
    }
    el.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;width:100%;flex-wrap:wrap;gap:10px">' +
      '<span class="iam-page-summary">' +
      summaryText +
      "</span>" +
      navHtml +
      "</div>";
    el.querySelectorAll("[data-iam-page]").forEach(function (btn) {
      btn.onclick = function () {
        var dir = btn.getAttribute("data-iam-page");
        var np = page + (dir === "next" ? 1 : -1);
        if (np < 1 || np > totalPages) return;
        onPageChange(np);
      };
    });
    return page;
  }

  /**
   * Limpia formularios, búsquedas y selección de la vista que se abandona.
   * Las funciones clear* y hide* están definidas en los módulos iam/*.js.
   */
  function clearIamViewState(viewName) {
    hideAlert();
    switch (viewName) {
      case "pantallas":
        clearPantallaForm();
        var ps = document.getElementById("pantallas-search");
        if (ps) ps.value = "";
        pantallasPage = 1;
        break;
      case "roles":
        clearRoleForm();
        var rs = document.getElementById("roles-search");
        if (rs) rs.value = "";
        rolesPage = 1;
        break;
      case "usuarios":
        clearUserForm();
        var us = document.getElementById("users-search");
        if (us) us.value = "";
        usersPage = 1;
        break;
      case "membresias":
        hideMembresiasDetail();
        var ms = document.getElementById("membresias-search");
        if (ms) ms.value = "";
        var mrs = document.getElementById("membresias-roles-search");
        if (mrs) mrs.value = "";
        membresiasPage = 1;
        break;
      case "bloqueados":
        hideBlockedDetail();
        var bs = document.getElementById("blocked-search");
        if (bs) bs.value = "";
        blockedPage = 1;
        break;
      default:
        break;
    }
  }

  function showView(name) {
    var n = name || "inicio";
    if (!titles[n]) n = "inicio";
    var prev = currentIamView;
    if (prev && prev !== n) {
      clearIamViewState(prev);
    }
    currentIamView = n;
    document.querySelectorAll(".iam-view").forEach(function (v) {
      v.classList.toggle("active", v.id === "view-" + n);
    });
    document.querySelectorAll(".app-nav a").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-view") === n);
    });
    document.getElementById("iam-page-title").textContent = titles[n] || "IAM";
    if (n === "inicio") {
      hideAlert();
      return;
    }
    if (n === "pantallas")
      loadPantallasTable().catch(function (e) {
        showAlert(e.message, true);
      });
    if (n === "roles")
      Promise.all([loadIamRolesTable(), loadPantallasTable()])
        .then(function () {
          renderRolePantallasPicker();
        })
        .catch(function (e) {
          showAlert(e.message, true);
        });
    if (n === "usuarios")
      loadUsersTable().catch(function (e) {
        showAlert(e.message, true);
      });
    if (n === "membresias") {
      Promise.all([loadUsersTable(), loadRoles()])
        .then(function () {
          renderMembresias();
        })
        .catch(function (e) {
          showAlert(e.message, true);
        });
      return;
    }
    if (n === "bloqueados")
      loadBlocked().catch(function (e) {
        showAlert(e.message, true);
      });
  }

  function navigateToHash() {
    var h = (location.hash || "#inicio").replace(/^#/, "");
    if (!h) h = "inicio";
    showView(h);
  }

  function setupIamSidebarToggle() {
    var shell = document.getElementById("iam-app-shell") || document.querySelector(".app-shell");
    var btn = document.getElementById("nav-hamburger");
    if (!shell || !btn) return;
    function setCollapsed(collapsed) {
      shell.classList.toggle("iam-menu-collapsed", collapsed);
      btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
      btn.setAttribute("aria-label", collapsed ? "Mostrar menú lateral" : "Ocultar menú lateral");
    }
    setCollapsed(false);
    btn.onclick = function () {
      setCollapsed(!shell.classList.contains("iam-menu-collapsed"));
    };
  }

  /* ——— Roles checks ——— */
  function renderRoleChecks(container, selectedSet, namePrefix) {
    container.innerHTML = "";
    allRoles.forEach(function (r) {
      var id = namePrefix + "-" + r.id;
      var label = document.createElement("label");
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = r.name;
      cb.dataset.roleId = String(r.id);
      cb.id = id;
      if (selectedSet && selectedSet[r.name]) cb.checked = true;
      label.appendChild(cb);
      label.appendChild(document.createTextNode(" " + (r.nombre || r.name)));
      container.appendChild(label);
    });
  }

  function collectChecked(container) {
    var roles = [];
    container.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
      if (cb.checked) roles.push(cb.value);
    });
    return roles;
  }

  function collectCheckedRoleIds(container) {
    var ids = [];
    container.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
      if (cb.checked && cb.dataset.roleId) ids.push(parseInt(cb.dataset.roleId, 10));
    });
    return ids;
  }

  function normalizeNombrePantalla(s) {
    if (!s) return "";
    var t = String(s)
      .replace(/\d/g, "")
      .trim()
      .replace(/\s+/g, " ");
    if (!t) return "";
    return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  }

  function normalizeRutaPantalla(s) {
    if (!s || !String(s).trim()) return null;
    var t = String(s).trim().toLowerCase().replace(/\\/g, "/");
    if (t.charAt(0) !== "/") t = "/" + t;
    return t;
  }

  function validatePantallaClient(codigo, nombreRaw, tipo, rutaNorm, orden, parentId) {
    if (!codigo) return "El código es obligatorio.";
    if (/\d/.test(String(nombreRaw || ""))) return "El nombre no puede contener números.";
    var nombre = normalizeNombrePantalla(nombreRaw);
    if (!nombre) return "El nombre es obligatorio.";
    if (orden < 0 || !isFinite(orden)) return "El orden no puede ser menor que cero.";
    if (tipo === "PANTALLA") {
      if (!rutaNorm || rutaNorm === "#") return "Las pantallas deben tener una ruta válida (no # ni vacío).";
    }
    var excludeId = editingPantallaId;
    var pk = parentId != null && parentId !== undefined ? Number(parentId) : null;
    for (var i = 0; i < allPantallas.length; i++) {
      var p = allPantallas[i];
      if (excludeId && p.id === excludeId) continue;
      var op = p.parentId != null && p.parentId !== undefined ? Number(p.parentId) : null;
      if (op === pk && p.orden === orden) {
        return "Ya existe otra entrada con el mismo orden bajo este mismo padre.";
      }
    }
    return null;
  }

  function pantallaIsAncestorOf(ancestorId, nodeId) {
    if (!ancestorId || !nodeId) return false;
    var map = {};
    allPantallas.forEach(function (p) {
      map[p.id] = p.parentId;
    });
    var cur = nodeId;
    var guard = 0;
    while (cur != null && guard++ < 256) {
      if (cur === ancestorId) return true;
      cur = map[cur] != null && map[cur] !== undefined ? map[cur] : null;
    }
    return false;
  }

  function refreshPantallaParentOptions() {
    var sel = document.getElementById("p-parent");
    if (!sel) return;
    var prev = sel.value;
    sel.innerHTML = '<option value="">(Raíz)</option>';
    allPantallas.forEach(function (m) {
      if ((m.tipo || "PANTALLA") !== "MENU") return;
      if (editingPantallaId && m.id === editingPantallaId) return;
      if (editingPantallaId && pantallaIsAncestorOf(editingPantallaId, m.id)) return;
      var opt = document.createElement("option");
      opt.value = String(m.id);
      opt.textContent = (m.codigo || "") + " — " + (m.nombre || "");
      sel.appendChild(opt);
    });
    if (prev && Array.prototype.some.call(sel.options, function (o) { return o.value === prev; })) {
      sel.value = prev;
    }
  }

  function syncPantallaTipoUi() {
    var tipo = document.getElementById("p-tipo").value;
    var rowRuta = document.getElementById("p-ruta-row");
    var pr = document.getElementById("p-ruta");
    if (!rowRuta || !pr) return;
    if (tipo === "MENU") {
      rowRuta.style.display = "none";
      pr.value = "#";
    } else {
      rowRuta.style.display = "";
      if (pr.value === "#") pr.value = "";
    }
  }

  function pantallaDirectChildCount(parentId) {
    if (parentId == null) return 0;
    var n = 0;
    allPantallas.forEach(function (p) {
      if (p.parentId === parentId) n++;
    });
    return n;
  }

  /** Menú con hijos no puede pasar a Pantalla (coherente con el backend). */
  function syncPantallaTipoLock() {
    var sel = document.getElementById("p-tipo");
    if (!sel) return;
    var optPantalla = sel.querySelector('option[value="PANTALLA"]');
    if (!optPantalla) return;
    optPantalla.removeAttribute("title");
    sel.removeAttribute("title");
    if (editingPantallaId && sel.value === "MENU") {
      var n = pantallaDirectChildCount(editingPantallaId);
      if (n > 0) {
        optPantalla.disabled = true;
        optPantalla.title =
          "No puede cambiar a Pantalla mientras existan entradas hijas bajo este menú.";
        sel.title =
          "Este menú tiene hijos: debe permanecer como Menú hasta eliminar o mover los hijos.";
      } else {
        optPantalla.disabled = false;
      }
    } else {
      optPantalla.disabled = false;
    }
  }

