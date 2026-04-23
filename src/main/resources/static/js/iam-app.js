(function () {
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
  var selectedMembresiaUserId = null;
  var selectedBlockedId = null;

  var pantallasPage = 1;
  var rolesPage = 1;
  var usersPage = 1;
  var membresiasPage = 1;
  var blockedPage = 1;

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

  function showView(name) {
    var n = name || "inicio";
    if (!titles[n]) n = "inicio";
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
      loadUsersTable()
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

  /* ——— Pantallas ——— */
  function syncPantallaActivaCaption() {
    var cb = document.getElementById("p-activo");
    var cap = document.getElementById("p-activo-caption");
    if (!cb || !cap) return;
    var on = cb.checked;
    cap.textContent = on ? "Activa" : "Inactiva";
    cb.setAttribute("aria-checked", on ? "true" : "false");
    cap.classList.toggle("iam-caption-activa", on);
    cap.classList.toggle("iam-caption-inactiva", !on);
  }

  function clearPantallaForm() {
    editingPantallaId = null;
    document.getElementById("pantalla-form-title").textContent = "Nueva pantalla";
    document.getElementById("pantalla-form-sub").textContent =
      "Menú agrupa entradas (ruta #). Pantalla es una hoja con ruta real.";
    document.getElementById("p-codigo").value = "";
    document.getElementById("p-codigo").disabled = false;
    document.getElementById("p-nombre").value = "";
    document.getElementById("p-tipo").value = "PANTALLA";
    document.getElementById("p-ruta").value = "";
    document.getElementById("p-orden").value = "0";
    document.getElementById("p-activo").checked = true;
    refreshPantallaParentOptions();
    document.getElementById("p-parent").value = "";
    syncPantallaTipoUi();
    syncPantallaTipoLock();
    syncPantallaActivaCaption();
    var delBtn = document.getElementById("btn-pantalla-delete");
    if (delBtn) delBtn.style.display = "none";
    document.querySelectorAll("#pantallas-tbody tr").forEach(function (tr) {
      tr.classList.remove("iam-row-selected");
    });
  }

  function fillPantallaForm(p) {
    editingPantallaId = p.id;
    document.getElementById("pantalla-form-title").textContent = "Editar pantalla";
    document.getElementById("pantalla-form-sub").textContent = p.codigo + " — " + (p.nombre || "");
    document.getElementById("p-codigo").value = (p.codigo || "").toUpperCase();
    document.getElementById("p-codigo").disabled = true;
    document.getElementById("p-nombre").value = normalizeNombrePantalla(p.nombre || "");
    var tipo = p.tipo || "PANTALLA";
    document.getElementById("p-tipo").value = tipo;
    document.getElementById("p-ruta").value =
      tipo === "MENU" ? "#" : p.ruta && p.ruta !== "#" ? p.ruta : "";
    document.getElementById("p-orden").value = p.orden != null ? p.orden : 0;
    document.getElementById("p-activo").checked = !!p.activo;
    refreshPantallaParentOptions();
    document.getElementById("p-parent").value = p.parentId != null ? String(p.parentId) : "";
    syncPantallaTipoUi();
    syncPantallaTipoLock();
    syncPantallaActivaCaption();
    var delBtn = document.getElementById("btn-pantalla-delete");
    if (delBtn) delBtn.style.display = "inline-flex";
    document.querySelectorAll("#pantallas-tbody tr").forEach(function (tr) {
      tr.classList.toggle("iam-row-selected", parseInt(tr.getAttribute("data-row-id"), 10) === p.id);
    });
  }

  function renderPantallasTable() {
    var q = (document.getElementById("pantallas-search").value || "").toLowerCase().trim();
    var filtered = allPantallas.filter(function (p) {
      if (!q) return true;
      var tLabel = (p.tipo || "PANTALLA") === "MENU" ? "menú" : "pantalla";
      return (
        (p.codigo && p.codigo.toLowerCase().indexOf(q) >= 0) ||
        (p.nombre && p.nombre.toLowerCase().indexOf(q) >= 0) ||
        (p.ruta && String(p.ruta).toLowerCase().indexOf(q) >= 0) ||
        tLabel.indexOf(q) >= 0
      );
    });
    var total = filtered.length;
    pantallasPage = renderPaginationBar("pantallas-pagination", pantallasPage, total, function (np) {
      pantallasPage = np;
      renderPantallasTable();
    });
    var start = (pantallasPage - 1) * PAGE_SIZE;
    var slice = filtered.slice(start, start + PAGE_SIZE);

    var tb = document.getElementById("pantallas-tbody");
    tb.innerHTML = "";
    slice.forEach(function (p) {
      var tr = document.createElement("tr");
      tr.setAttribute("data-row-id", String(p.id));
      if (editingPantallaId === p.id) tr.classList.add("iam-row-selected");
      var est = p.activo ? '<span class="iam-badge iam-badge-activo">activo</span>' : '<span class="iam-badge iam-badge-pasivo">inactivo</span>';
      var tLab = (p.tipo || "PANTALLA") === "MENU" ? "Menú" : "Pantalla";
      tr.innerHTML =
        "<td>" +
        escapeHtml(p.nombre) +
        "</td><td>" +
        escapeHtml(tLab) +
        "</td><td>" +
        escapeHtml(p.ruta || "") +
        "</td><td>" +
        est +
        "</td>";
      tr.style.cursor = "pointer";
      tr.setAttribute("title", "Pulse para editar");
      tr.addEventListener("click", function () {
        fillPantallaForm(p);
      });
      tb.appendChild(tr);
    });
  }

  function loadPantallasTable() {
    return apiFetch("/api/iam/pantallas")
      .then(function (res) {
        if (res.status === 403) throw new Error("Sin permiso para IAM");
        if (!res.ok) throw new Error("Error al cargar pantallas");
        return res.json();
      })
      .then(function (rows) {
        allPantallas = rows;
        renderPantallasTable();
        refreshPantallaParentOptions();
        syncPantallaTipoLock();
      });
  }

  /* ——— Roles IAM ——— */
  function syncRoleActivoCaption() {
    var cb = document.getElementById("r-activo");
    var cap = document.getElementById("r-activo-caption");
    if (!cb || !cap) return;
    var on = cb.checked;
    cap.textContent = on ? "Activo" : "Inactivo";
    cb.setAttribute("aria-checked", on ? "true" : "false");
    cap.classList.toggle("iam-caption-activa", on);
    cap.classList.toggle("iam-caption-inactiva", !on);
  }

  function clearRoleForm() {
    editingRoleId = null;
    rolePantallaSelection = {};
    document.getElementById("role-form-title").textContent = "Nuevo rol";
    document.getElementById("role-form-sub").textContent =
      "Defina el código y el nombre. Marque las pantallas del menú a las que este rol tendrá acceso.";
    document.getElementById("r-codigo").value = "";
    document.getElementById("r-codigo").disabled = false;
    document.getElementById("r-nombre").value = "";
    document.getElementById("r-activo").checked = true;
    syncRoleActivoCaption();
    var ps = document.getElementById("role-pantallas-search");
    if (ps) ps.value = "";
    renderRolePantallasPicker();
    document.querySelectorAll("#roles-tbody tr").forEach(function (tr) {
      tr.classList.remove("iam-row-selected");
    });
  }

  function fillRoleFormFromDetail(detail) {
    editingRoleId = detail.id;
    document.getElementById("role-form-title").textContent = "Editar rol";
    document.getElementById("role-form-sub").textContent = (detail.codigo || "") + " — " + (detail.nombre || "");
    document.getElementById("r-codigo").value = detail.codigo || "";
    document.getElementById("r-codigo").disabled = true;
    document.getElementById("r-nombre").value = detail.nombre || "";
    document.getElementById("r-activo").checked = !!detail.activo;
    syncRoleActivoCaption();
    rolePantallaSelection = {};
    var ids = detail.pantallaIds;
    if (Array.isArray(ids)) {
      ids.forEach(function (pid) {
        rolePantallaSelection[pid] = true;
      });
    }
    renderRolePantallasPicker();
    document.querySelectorAll("#roles-tbody tr").forEach(function (tr) {
      tr.classList.toggle("iam-row-selected", parseInt(tr.getAttribute("data-role-id"), 10) === detail.id);
    });
  }

  function renderIamRolesTable() {
    var q = (document.getElementById("roles-search").value || "").toLowerCase().trim();
    var filtered = iamRolesList.filter(function (r) {
      if (!q) return true;
      return (
        (r.codigo && String(r.codigo).toLowerCase().indexOf(q) >= 0) ||
        (r.nombre && String(r.nombre).toLowerCase().indexOf(q) >= 0) ||
        (r.name && String(r.name).toLowerCase().indexOf(q) >= 0)
      );
    });
    var total = filtered.length;
    rolesPage = renderPaginationBar("roles-pagination", rolesPage, total, function (np) {
      rolesPage = np;
      renderIamRolesTable();
    });
    var start = (rolesPage - 1) * PAGE_SIZE;
    var slice = filtered.slice(start, start + PAGE_SIZE);

    var tb = document.getElementById("roles-tbody");
    tb.innerHTML = "";
    slice.forEach(function (r) {
      var tr = document.createElement("tr");
      tr.setAttribute("data-role-id", String(r.id));
      if (editingRoleId === r.id) tr.classList.add("iam-row-selected");
      var est = r.activo
        ? '<span class="iam-badge iam-badge-activo">activo</span>'
        : '<span class="iam-badge iam-badge-pasivo">inactivo</span>';
      tr.innerHTML =
        "<td>" +
        escapeHtml(r.codigo || "") +
        "</td><td>" +
        escapeHtml(r.nombre || "") +
        "</td><td>" +
        est +
        "</td>";
      tr.style.cursor = "pointer";
      tr.setAttribute("title", "Pulse para editar");
      tr.addEventListener("click", function () {
        apiFetch("/api/iam/roles/" + r.id)
          .then(function (res) {
            if (!res.ok) throw new Error("No se pudo cargar el rol");
            return res.json();
          })
          .then(function (detail) {
            fillRoleFormFromDetail(detail);
          })
          .catch(function (e) {
            showAlert(e.message, true);
          });
      });
      tb.appendChild(tr);
    });
  }

  function renderRolePantallasPicker() {
    var tb = document.getElementById("role-pantallas-tbody");
    if (!tb) return;
    var q = (document.getElementById("role-pantallas-search").value || "").toLowerCase().trim();
    var filtered = (allPantallas || []).filter(function (p) {
      if (!q) return true;
      var tLab = (p.tipo || "PANTALLA") === "MENU" ? "menú" : "pantalla";
      return (
        (p.codigo && p.codigo.toLowerCase().indexOf(q) >= 0) ||
        (p.nombre && p.nombre.toLowerCase().indexOf(q) >= 0) ||
        (p.ruta && String(p.ruta).toLowerCase().indexOf(q) >= 0) ||
        tLab.indexOf(q) >= 0
      );
    });
    tb.innerHTML = "";
    filtered.forEach(function (p) {
      var tr = document.createElement("tr");
      var checked = !!rolePantallaSelection[p.id];
      var tLab = (p.tipo || "PANTALLA") === "MENU" ? "Menú" : "Pantalla";
      tr.innerHTML =
        '<td class="iam-col-check"><input type="checkbox" data-pantalla-id="' +
        String(p.id) +
        '"' +
        (checked ? " checked" : "") +
        ' aria-label="Asociar ' +
        escapeHtml(p.nombre || "") +
        '" /></td><td>' +
        escapeHtml(p.nombre || "") +
        "</td><td>" +
        escapeHtml(p.codigo || "") +
        "</td><td>" +
        escapeHtml(tLab) +
        "</td>";
      var cb = tr.querySelector("input[type=checkbox]");
      cb.addEventListener("click", function (e) {
        e.stopPropagation();
      });
      cb.addEventListener("change", function () {
        if (this.checked) rolePantallaSelection[p.id] = true;
        else delete rolePantallaSelection[p.id];
      });
      tb.appendChild(tr);
    });
  }

  function collectRolePantallaIds() {
    var ids = [];
    document.querySelectorAll("#role-pantallas-tbody input[type=checkbox][data-pantalla-id]").forEach(function (cb) {
      if (cb.checked) ids.push(parseInt(cb.getAttribute("data-pantalla-id"), 10));
    });
    return ids;
  }

  function loadIamRolesTable() {
    return apiFetch("/api/iam/roles")
      .then(function (res) {
        if (res.status === 403) throw new Error("Sin permiso");
        if (!res.ok) throw new Error("Error al cargar roles");
        return res.json();
      })
      .then(function (rows) {
        iamRolesList = rows;
        allRoles = rows;
        renderIamRolesTable();
      });
  }

  /* ——— Users ——— */
  function loadUsersTable() {
    return apiFetch("/api/iam/users")
      .then(function (res) {
        if (!res.ok) throw new Error("Error al cargar usuarios");
        return res.json();
      })
      .then(function (users) {
        allUsers = users;
        renderUsersTbody(users);
      });
  }

  function renderUsersTbody(users) {
    var q = (document.getElementById("users-search").value || "").toLowerCase().trim();
    var filtered = users.filter(function (u) {
      if (!q) return true;
      var n = displayName(u).toLowerCase();
      return u.username.toLowerCase().indexOf(q) >= 0 || n.indexOf(q) >= 0;
    });
    var total = filtered.length;
    usersPage = renderPaginationBar("users-pagination", usersPage, total, function (np) {
      usersPage = np;
      renderUsersTbody(allUsers);
    });
    var start = (usersPage - 1) * PAGE_SIZE;
    var slice = filtered.slice(start, start + PAGE_SIZE);

    var tb = document.getElementById("users-tbody");
    tb.innerHTML = "";
    slice.forEach(function (u) {
      var tr = document.createElement("tr");
      var est = u.enabled
        ? '<span class="iam-badge iam-badge-activo">activo</span>'
        : '<span class="iam-badge iam-badge-pasivo">pasivo</span>';
      if (u.lockedAt) est = '<span class="iam-badge iam-badge-bloqueado">bloqueado</span>';
      if (editingUserId === u.id) tr.classList.add("iam-row-selected");
      tr.innerHTML =
        "<td>" +
        escapeHtml(u.username) +
        "</td><td>" +
        escapeHtml(displayName(u)) +
        "</td><td>" +
        est +
        '</td><td class="iam-cell-actions"><button type="button" class="btn-fluent btn-fluent-secondary iam-icon-btn btn-u-view" data-id="' +
        u.id +
        '" title="Editar"><i class="fa-solid fa-pen" aria-hidden="true"></i></button></td>';
      tr.addEventListener("click", function (e) {
        if (e.target.closest && e.target.closest("button")) return;
        var uu = allUsers.find(function (x) {
          return x.id === u.id;
        });
        if (uu) fillUserForm(uu);
      });
      tb.appendChild(tr);
    });
    tb.querySelectorAll(".btn-u-view").forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        var id = parseInt(btn.getAttribute("data-id"), 10);
        var uu = allUsers.find(function (x) {
          return x.id === id;
        });
        if (uu) fillUserForm(uu);
      };
    });
  }

  function fillUserForm(u) {
    editingUserId = u.id;
    document.getElementById("user-form-title").textContent = "Editar usuario";
    document.getElementById("btn-user-save").textContent = "Guardar";
    document.getElementById("u-username").value = u.username;
    document.getElementById("u-username").disabled = true;
    document.getElementById("u-primer-nombre").value = u.primerNombre || "";
    document.getElementById("u-segundo-nombre").value = u.segundoNombre || "";
    document.getElementById("u-primer-apellido").value = u.primerApellido || "";
    document.getElementById("u-segundo-apellido").value = u.segundoApellido || "";
    document.getElementById("u-email").value = u.email || "";
    document.getElementById("u-password").value = "";
    document.getElementById("u-password").type = "password";
    document.getElementById("u-password-eye").innerHTML = '<i class="fa-solid fa-eye" aria-hidden="true"></i>';
    document.getElementById("u-temporal").checked = false;
    document.getElementById("u-expira").value = u.cuentaExpiraEn || "";
    document.getElementById("u-enabled").checked = u.enabled;
    syncUserEnabledUi();
    document.getElementById("u-enabled-wrap").style.display = "flex";
    document.getElementById("u-password-wrap").style.display = "none";
    renderUsersTbody(allUsers);
  }

  function syncUserEnabledUi() {
    var cb = document.getElementById("u-enabled");
    var cap = document.getElementById("u-enabled-caption");
    if (!cb || !cap) return;
    userEnabled = cb.checked;
    cap.textContent = userEnabled ? "Activo" : "Pasivo";
    cb.setAttribute("aria-checked", userEnabled ? "true" : "false");
    cap.classList.toggle("iam-caption-activa", userEnabled);
    cap.classList.toggle("iam-caption-inactiva", !userEnabled);
  }

  function clearUserForm() {
    editingUserId = null;
    userEnabled = true;
    document.getElementById("user-form-title").textContent = "Nuevo usuario";
    document.getElementById("btn-user-save").textContent = "Agregar";
    document.getElementById("u-username").value = "";
    document.getElementById("u-username").disabled = false;
    document.getElementById("u-primer-nombre").value = "";
    document.getElementById("u-segundo-nombre").value = "";
    document.getElementById("u-primer-apellido").value = "";
    document.getElementById("u-segundo-apellido").value = "";
    document.getElementById("u-email").value = "";
    document.getElementById("u-password").value = "";
    document.getElementById("u-password").type = "password";
    document.getElementById("u-password-eye").innerHTML = '<i class="fa-solid fa-eye" aria-hidden="true"></i>';
    document.getElementById("u-temporal").checked = false;
    document.getElementById("u-expira").value = "";
    document.getElementById("u-enabled").checked = true;
    syncUserEnabledUi();
    document.getElementById("u-enabled-wrap").style.display = "none";
    document.getElementById("u-password-wrap").style.display = "";
    renderUsersTbody(allUsers);
  }

  function hideMembresiasDetail() {
    selectedMembresiaUserId = null;
    document.getElementById("membresias-detail-empty").style.display = "flex";
    document.getElementById("membresias-detail-form").style.display = "none";
  }

  function showMembresiasDetail(u) {
    selectedMembresiaUserId = u.id;
    document.getElementById("membresias-detail-empty").style.display = "none";
    document.getElementById("membresias-detail-form").style.display = "flex";
    document.getElementById("membresias-form-title").textContent = "Roles del usuario";
    document.getElementById("membresias-form-sub").textContent = u.username;
    var sel = {};
    (u.roles || []).forEach(function (r) {
      sel[r] = true;
    });
    renderRoleChecks(document.getElementById("membresias-role-checks"), sel, "mr");
  }

  function renderMembresias() {
    var q = (document.getElementById("membresias-search").value || "").toLowerCase().trim();
    var filtered = allUsers.filter(function (u) {
      if (!q) return true;
      return u.username.toLowerCase().indexOf(q) >= 0 || displayName(u).toLowerCase().indexOf(q) >= 0;
    });
    var total = filtered.length;
    membresiasPage = renderPaginationBar("membresias-pagination", membresiasPage, total, function (np) {
      membresiasPage = np;
      renderMembresias();
    });
    var start = (membresiasPage - 1) * PAGE_SIZE;
    var slice = filtered.slice(start, start + PAGE_SIZE);

    var tb = document.getElementById("membresias-tbody");
    tb.innerHTML = "";
    slice.forEach(function (u) {
      var rolesArr = u.roles ? Array.from(u.roles) : [];
      var tr = document.createElement("tr");
      if (selectedMembresiaUserId === u.id) tr.classList.add("iam-row-selected");
      tr.innerHTML =
        "<td>" +
        escapeHtml(u.username) +
        "</td><td>" +
        escapeHtml(rolesArr.sort().join(", ") || "—") +
        "</td>";
      tr.onclick = function () {
        selectedMembresiaUserId = u.id;
        renderMembresias();
      };
      tb.appendChild(tr);
    });

    if (selectedMembresiaUserId) {
      var selU = allUsers.find(function (x) {
        return x.id === selectedMembresiaUserId;
      });
      if (selU) showMembresiasDetail(selU);
      else hideMembresiasDetail();
    }
  }

  function hideBlockedDetail() {
    selectedBlockedId = null;
    document.getElementById("blocked-detail-empty").style.display = "flex";
    document.getElementById("blocked-detail-body").style.display = "none";
  }

  function showBlockedDetail(u) {
    selectedBlockedId = u.id;
    document.getElementById("blocked-detail-empty").style.display = "none";
    document.getElementById("blocked-detail-body").style.display = "flex";
    document.getElementById("blocked-detail-title").textContent = u.username;
    document.getElementById("blocked-detail-sub").textContent = "Revise los datos y desbloquee si corresponde.";
    var when = u.lockedAt ? new Date(u.lockedAt).toLocaleString() : "—";
    document.getElementById("blocked-detail-fields").innerHTML =
      "<dt>Usuario</dt><dd>" +
      escapeHtml(u.username) +
      "</dd><dt>Bloqueado el</dt><dd>" +
      escapeHtml(when) +
      "</dd><dt>Intentos fallidos</dt><dd>" +
      (u.failedLoginAttempts != null ? escapeHtml(String(u.failedLoginAttempts)) : "—") +
      "</dd>";
    document.getElementById("btn-blocked-unlock").onclick = function () {
      var id = u.id;
      apiFetch("/api/iam/blocked-users/" + id + "/unlock", { method: "POST" })
        .then(function (res) {
          if (!res.ok) throw new Error("No se pudo desbloquear");
          showAlert("Usuario desbloqueado", false);
          hideBlockedDetail();
          return loadBlocked();
        })
        .then(function () {
          return loadUsersTable();
        })
        .catch(function (e) {
          showAlert(e.message, true);
        });
    };
    document.querySelectorAll("#blocked-tbody tr").forEach(function (tr) {
      tr.classList.toggle("iam-row-selected", parseInt(tr.getAttribute("data-bid"), 10) === u.id);
    });
  }

  function renderBlockedTable() {
    var q = (document.getElementById("blocked-search").value || "").toLowerCase().trim();
    var filtered = allBlocked.filter(function (u) {
      if (!q) return true;
      return u.username.toLowerCase().indexOf(q) >= 0;
    });
    var total = filtered.length;
    blockedPage = renderPaginationBar("blocked-pagination", blockedPage, total, function (np) {
      blockedPage = np;
      renderBlockedTable();
    });
    var start = (blockedPage - 1) * PAGE_SIZE;
    var slice = filtered.slice(start, start + PAGE_SIZE);

    var tb = document.getElementById("blocked-tbody");
    tb.innerHTML = "";
    if (!allBlocked.length) {
      renderPaginationBar("blocked-pagination", 1, 0, function () {});
      tb.innerHTML = '<tr><td colspan="3" class="dyn-muted">No hay usuarios bloqueados</td></tr>';
      hideBlockedDetail();
      return;
    }
    slice.forEach(function (u) {
      var tr = document.createElement("tr");
      tr.setAttribute("data-bid", String(u.id));
      if (selectedBlockedId === u.id) tr.classList.add("iam-row-selected");
      var when = u.lockedAt ? new Date(u.lockedAt).toLocaleString() : "—";
      tr.innerHTML =
        "<td>" +
        escapeHtml(u.username) +
        "</td><td>" +
        escapeHtml(when) +
        "</td><td>" +
        (u.failedLoginAttempts != null ? escapeHtml(String(u.failedLoginAttempts)) : "—") +
        "</td>";
      tr.onclick = function () {
        showBlockedDetail(u);
      };
      tb.appendChild(tr);
    });

    if (selectedBlockedId) {
      var selU = allBlocked.find(function (x) {
        return x.id === selectedBlockedId;
      });
      if (selU && filtered.indexOf(selU) >= 0) showBlockedDetail(selU);
      else hideBlockedDetail();
    }
  }

  function loadBlocked() {
    return apiFetch("/api/iam/blocked-users")
      .then(function (res) {
        if (!res.ok) throw new Error("Error al cargar bloqueados");
        return res.json();
      })
      .then(function (rows) {
        allBlocked = rows;
        renderBlockedTable();
      });
  }

  /* ——— Wire events ——— */
  document.getElementById("logout").onclick = function () {
    HisAuth.logout();
  };

  document.querySelectorAll(".app-nav a").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      location.hash = a.getAttribute("href");
    });
  });

  window.addEventListener("hashchange", navigateToHash);

  document.getElementById("pantallas-search").addEventListener("input", function () {
    pantallasPage = 1;
    renderPantallasTable();
  });

  document.getElementById("p-activo").addEventListener("change", syncPantallaActivaCaption);

  (function wirePantallaFieldValidators() {
    var pc = document.getElementById("p-codigo");
    var pn = document.getElementById("p-nombre");
    var pr = document.getElementById("p-ruta");
    var po = document.getElementById("p-orden");
    var pt = document.getElementById("p-tipo");
    pc.addEventListener("input", function () {
      this.value = this.value.toUpperCase();
    });
    pn.addEventListener("input", function () {
      this.value = this.value.replace(/\d/g, "");
    });
    pn.addEventListener("blur", function () {
      var v = normalizeNombrePantalla(this.value);
      if (v) this.value = v;
    });
    pr.addEventListener("input", function () {
      var start = this.selectionStart;
      var v = this.value.toLowerCase();
      if (v !== this.value) {
        this.value = v;
        if (this.setSelectionRange) this.setSelectionRange(start, start);
      }
    });
    pr.addEventListener("blur", function () {
      var v = normalizeRutaPantalla(this.value);
      this.value = v || "";
    });
    po.addEventListener("change", function () {
      var n = parseInt(this.value, 10);
      if (isNaN(n) || n < 0) this.value = "0";
    });
    if (pt) {
      pt.addEventListener("change", function () {
        syncPantallaTipoUi();
        syncPantallaTipoLock();
      });
    }
  })();

  document.getElementById("roles-search").addEventListener("input", function () {
    rolesPage = 1;
    renderIamRolesTable();
  });

  document.getElementById("role-pantallas-search").addEventListener("input", function () {
    renderRolePantallasPicker();
  });

  document.getElementById("r-activo").addEventListener("change", syncRoleActivoCaption);

  document.getElementById("users-search").addEventListener("input", function () {
    usersPage = 1;
    renderUsersTbody(allUsers);
  });

  document.getElementById("membresias-search").addEventListener("input", function () {
    membresiasPage = 1;
    renderMembresias();
  });

  document.getElementById("blocked-search").addEventListener("input", function () {
    blockedPage = 1;
    renderBlockedTable();
  });

  document.getElementById("u-enabled").addEventListener("change", function () {
    if (!editingUserId) return;
    syncUserEnabledUi();
  });

  document.getElementById("u-expira-cal").addEventListener("click", function () {
    var el = document.getElementById("u-expira");
    if (el.showPicker) {
      try {
        el.showPicker();
      } catch (e) {
        el.focus();
      }
    } else {
      el.focus();
    }
  });

  document.getElementById("u-expira-clear").addEventListener("click", function () {
    document.getElementById("u-expira").value = "";
  });

  document.getElementById("u-gen-btn").onclick = function () {
    document.getElementById("u-password").value = randomPwd();
    document.getElementById("u-password").type = "text";
    document.getElementById("u-password-eye").innerHTML = '<i class="fa-solid fa-eye-slash" aria-hidden="true"></i>';
  };

  document.getElementById("u-password-eye").onclick = function () {
    var p = document.getElementById("u-password");
    var showing = p.type === "text";
    p.type = showing ? "password" : "text";
    this.innerHTML = showing
      ? '<i class="fa-solid fa-eye" aria-hidden="true"></i>'
      : '<i class="fa-solid fa-eye-slash" aria-hidden="true"></i>';
  };

  document.getElementById("btn-user-clear").onclick = function () {
    hideAlert();
    clearUserForm();
  };

  document.getElementById("btn-user-new").onclick = function () {
    hideAlert();
    clearUserForm();
  };

  document.getElementById("btn-pantalla-new").onclick = function () {
    hideAlert();
    clearPantallaForm();
  };

  document.getElementById("btn-pantalla-clear").onclick = function () {
    hideAlert();
    clearPantallaForm();
  };

  document.getElementById("btn-pantalla-delete").onclick = function () {
    if (!editingPantallaId) return;
    if (!confirm("¿Eliminar esta pantalla?")) return;
    var id = editingPantallaId;
    apiFetch("/api/iam/pantallas/" + id, { method: "DELETE" })
      .then(function (res) {
        if (!res.ok) {
          return res.json().then(function (j) {
            throw new Error(j.message || "No se pudo eliminar");
          });
        }
        clearPantallaForm();
        return loadPantallasTable();
      })
      .catch(function (e) {
        showAlert(e.message, true);
      });
  };

  document.getElementById("btn-user-save").onclick = function () {
    hideAlert();
    var username = document.getElementById("u-username").value.trim();
    var primerNombre = document.getElementById("u-primer-nombre").value.trim();
    var primerApellido = document.getElementById("u-primer-apellido").value.trim();
    if (!username) {
      showAlert("Indique el nombre de usuario", true);
      return;
    }
    if (!primerNombre || !primerApellido) {
      showAlert("Primer nombre y primer apellido son obligatorios", true);
      return;
    }

    if (editingUserId) {
      var body = {
        email: document.getElementById("u-email").value.trim() || null,
        primerNombre: primerNombre,
        segundoNombre: document.getElementById("u-segundo-nombre").value.trim() || null,
        primerApellido: primerApellido,
        segundoApellido: document.getElementById("u-segundo-apellido").value.trim() || null,
        cuentaExpiraEn: document.getElementById("u-expira").value || null,
        enabled: userEnabled,
      };
      apiFetch("/api/iam/users/" + editingUserId, { method: "PUT", body: body })
        .then(function (res) {
          if (!res.ok) {
            return res.json().then(function (j) {
              throw new Error(j.message || "Error");
            });
          }
          showAlert("Usuario actualizado", false);
          clearUserForm();
          return loadUsersTable();
        })
        .catch(function (e) {
          showAlert(e.message, true);
        });
      return;
    }

    var pwd = document.getElementById("u-password").value;
    if (!pwd) {
      showAlert("Indique o genere una contraseña", true);
      return;
    }
    var payload = {
      username: username,
      password: pwd,
      temporalPassword: document.getElementById("u-temporal").checked,
      generateRandomPassword: false,
      email: document.getElementById("u-email").value.trim() || null,
      primerNombre: primerNombre,
      segundoNombre: document.getElementById("u-segundo-nombre").value.trim() || null,
      primerApellido: primerApellido,
      segundoApellido: document.getElementById("u-segundo-apellido").value.trim() || null,
      cuentaExpiraEn: document.getElementById("u-expira").value || null,
      roles: [],
    };
    apiFetch("/api/iam/users", { method: "POST", body: payload })
      .then(function (res) {
        if (!res.ok) {
          return res.json().then(function (j) {
            throw new Error(j.message || "Error al crear");
          });
        }
        return res.json();
      })
      .then(function (data) {
        var msg = "Usuario creado. Asigne roles en Membresías.";
        if (data.generatedPassword) {
          msg += " Contraseña generada: " + data.generatedPassword;
        }
        showAlert(msg, false);
        clearUserForm();
        return loadUsersTable();
      })
      .catch(function (e) {
        showAlert(e.message, true);
      });
  };

  document.getElementById("btn-pantalla-save").onclick = function () {
    hideAlert();
    var tipo = document.getElementById("p-tipo").value;
    var codigo = document.getElementById("p-codigo").value.trim().toUpperCase();
    var nombreRaw = document.getElementById("p-nombre").value;
    var parentSel = document.getElementById("p-parent").value;
    var parentId = parentSel ? parseInt(parentSel, 10) : null;
    var rutaNorm =
      tipo === "MENU" ? "#" : normalizeRutaPantalla(document.getElementById("p-ruta").value);
    var ordenParsed = parseInt(document.getElementById("p-orden").value, 10);
    var orden = isNaN(ordenParsed) ? 0 : ordenParsed;
    var nombre = normalizeNombrePantalla(nombreRaw);
    document.getElementById("p-codigo").value = codigo;
    document.getElementById("p-nombre").value = nombre;
    if (tipo === "MENU") {
      document.getElementById("p-ruta").value = "#";
    } else {
      document.getElementById("p-ruta").value = rutaNorm || "";
    }
    document.getElementById("p-orden").value = String(orden);
    var err = validatePantallaClient(codigo, nombreRaw, tipo, rutaNorm, orden, parentId);
    if (err) {
      showAlert(err, true);
      return;
    }
    var body = {
      codigo: codigo,
      nombre: nombre,
      descripcion: null,
      ruta: tipo === "MENU" ? "#" : rutaNorm,
      tipo: tipo,
      parentId: parentId,
      orden: orden,
      activo: document.getElementById("p-activo").checked,
    };
    var url = "/api/iam/pantallas";
    var method = "POST";
    if (editingPantallaId) {
      url += "/" + editingPantallaId;
      method = "PUT";
    }
    apiFetch(url, { method: method, body: body })
      .then(function (res) {
        if (!res.ok) {
          return res.json().then(function (j) {
            throw new Error(j.message || "Error");
          });
        }
        var wasNew = !editingPantallaId;
        return loadPantallasTable().then(function () {
          if (wasNew) clearPantallaForm();
        });
      })
      .catch(function (e) {
        showAlert(e.message, true);
      });
  };

  document.getElementById("btn-role-new").onclick = function () {
    hideAlert();
    clearRoleForm();
  };

  document.getElementById("btn-role-clear").onclick = function () {
    hideAlert();
    clearRoleForm();
  };

  document.getElementById("btn-role-save").onclick = function () {
    hideAlert();
    var nombre = document.getElementById("r-nombre").value.trim();
    var activo = document.getElementById("r-activo").checked;
    var pantallaIds = collectRolePantallaIds();
    if (!nombre) {
      showAlert("El nombre es obligatorio", true);
      return;
    }
    function savePantallas(roleId) {
      return apiFetch("/api/iam/roles/" + roleId + "/pantallas", {
        method: "PUT",
        body: { pantallaIds: pantallaIds },
      }).then(function (res) {
        if (!res.ok) {
          return res.json().then(function (j) {
            throw new Error(j.message || "Error al guardar pantallas del rol");
          });
        }
        showAlert("Rol guardado", false);
        return loadIamRolesTable().then(function () {
          return loadPantallasTable();
        });
      });
    }
    if (!editingRoleId) {
      var codigo = document.getElementById("r-codigo").value.trim().toUpperCase();
      if (!codigo) {
        showAlert("El código es obligatorio", true);
        return;
      }
      apiFetch("/api/iam/roles", {
        method: "POST",
        body: { codigo: codigo, nombre: nombre, activo: activo },
      })
        .then(function (res) {
          if (!res.ok) {
            return res.json().then(function (j) {
              throw new Error(j.message || "Error al crear rol");
            });
          }
          return res.json();
        })
        .then(function (created) {
          return savePantallas(created.id).then(function () {
            clearRoleForm();
          });
        })
        .catch(function (e) {
          showAlert(e.message, true);
        });
      return;
    }
    apiFetch("/api/iam/roles/" + editingRoleId, {
      method: "PUT",
      body: { nombre: nombre, activo: activo },
    })
      .then(function (res) {
        if (!res.ok) {
          return res.json().then(function (j) {
            throw new Error(j.message || "Error al actualizar rol");
          });
        }
        return savePantallas(editingRoleId);
      })
      .then(function () {
        clearRoleForm();
      })
      .catch(function (e) {
        showAlert(e.message, true);
      });
  };

  document.getElementById("btn-membresias-save").onclick = function () {
    if (!selectedMembresiaUserId) return;
    var roles = collectChecked(document.getElementById("membresias-role-checks"));
    if (!roles.length) {
      showAlert("Debe quedar al menos un rol", true);
      return;
    }
    apiFetch("/api/iam/users/" + selectedMembresiaUserId + "/roles", {
      method: "PUT",
      body: { roles: roles },
    })
      .then(function (res) {
        if (!res.ok) {
          return res.json().then(function (j) {
            throw new Error(j.message || "Error");
          });
        }
        showAlert("Roles actualizados", false);
        return loadUsersTable();
      })
      .then(function () {
        renderMembresias();
      })
      .catch(function (e) {
        showAlert(e.message, true);
      });
  };

  document.getElementById("btn-membresias-cancel").onclick = function () {
    hideMembresiasDetail();
    renderMembresias();
  };

  document.getElementById("btn-membresias-refresh").onclick = function () {
    loadUsersTable()
      .then(function () {
        renderMembresias();
      })
      .catch(function (e) {
        showAlert(e.message, true);
      });
  };

  document.getElementById("btn-blocked-refresh").onclick = function () {
    loadBlocked().catch(function (e) {
      showAlert(e.message, true);
    });
  };

  /* ——— Init ——— */
  apiFetch("/api/auth/me")
    .then(function (res) {
      if (!res.ok) throw new Error("Sesión inválida");
      return res.json();
    })
    .then(function (me) {
      if (me.passwordMustChange) {
        window.location.replace("/change-password.html");
        return;
      }
      if (!me.iamMaster) {
        window.location.replace("/app/pages/inicio.html");
        return;
      }
      var sn = document.getElementById("session-user-name");
      if (sn) {
        var n = (me.displayName || me.username || "").trim() || "Usuario";
        sn.textContent = n;
        sn.setAttribute("title", n);
      }
      return loadRoles();
    })
    .then(function () {
      var dd = document.getElementById("session-actions-dropdown");
      if (dd && typeof ShellSessionDropdown !== "undefined") ShellSessionDropdown.attach(dd);
      setupIamSidebarToggle();
      navigateToHash();
    })
    .catch(function () {
      HisAuth.logout();
    });

  function loadRoles() {
    return apiFetch("/api/iam/roles")
      .then(function (res) {
        if (res.status === 403) throw new Error("Sin permiso");
        if (!res.ok) throw new Error("Error al cargar roles");
        return res.json();
      })
      .then(function (data) {
        allRoles = data;
      });
  }
})();
