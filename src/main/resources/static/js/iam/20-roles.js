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

