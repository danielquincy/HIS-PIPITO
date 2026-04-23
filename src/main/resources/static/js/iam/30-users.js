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
        "</td>";
      tr.addEventListener("click", function () {
        var uu = allUsers.find(function (x) {
          return x.id === u.id;
        });
        if (uu) fillUserForm(uu);
      });
      tb.appendChild(tr);
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
    membresiaRoleSelection = {};
    document.getElementById("membresias-detail-empty").style.display = "flex";
    document.getElementById("membresias-detail-form").style.display = "none";
  }

  function collectMembresiaRoleNames() {
    var names = [];
    allRoles.forEach(function (r) {
      if (membresiaRoleSelection[r.id]) names.push(r.name);
    });
    return names;
  }

  function renderMembresiaRolesTable() {
    var tb = document.getElementById("membresias-roles-tbody");
    if (!tb) return;
    var q = (document.getElementById("membresias-roles-search").value || "").toLowerCase().trim();
    var filtered = allRoles.filter(function (r) {
      if (!q) return true;
      return (
        (r.codigo && r.codigo.toLowerCase().indexOf(q) >= 0) ||
        (r.nombre && r.nombre.toLowerCase().indexOf(q) >= 0) ||
        (r.name && r.name.toLowerCase().indexOf(q) >= 0)
      );
    });
    tb.innerHTML = "";
    filtered.forEach(function (r) {
      var tr = document.createElement("tr");
      var checked = !!membresiaRoleSelection[r.id];
      var estado = r.activo
        ? '<span class="iam-badge iam-badge-activo">activo</span>'
        : '<span class="iam-badge iam-badge-pasivo">inactivo</span>';
      tr.innerHTML =
        '<td class="iam-col-check"><input type="checkbox" data-role-id="' +
        r.id +
        '"' +
        (checked ? " checked" : "") +
        ' /></td><td>' +
        escapeHtml(r.codigo || "") +
        "</td><td>" +
        escapeHtml(r.nombre || r.name || "") +
        "</td><td>" +
        estado +
        "</td>";
      var cb = tr.querySelector("input[type=checkbox]");
      cb.addEventListener("click", function (e) {
        e.stopPropagation();
      });
      cb.addEventListener("change", function () {
        if (this.checked) membresiaRoleSelection[r.id] = true;
        else delete membresiaRoleSelection[r.id];
      });
      tb.appendChild(tr);
    });
  }

  function showMembresiasDetail(u) {
    selectedMembresiaUserId = u.id;
    document.getElementById("membresias-detail-empty").style.display = "none";
    document.getElementById("membresias-detail-form").style.display = "flex";
    document.getElementById("membresias-form-title").textContent = "Roles del usuario";
    document.getElementById("membresias-form-sub").textContent = u.username;
    membresiaRoleSelection = {};
    (u.roles || []).forEach(function (roleName) {
      var rr = allRoles.find(function (x) {
        return x.name === roleName;
      });
      if (rr) membresiaRoleSelection[rr.id] = true;
    });
    renderMembresiaRolesTable();
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
      var tr = document.createElement("tr");
      if (selectedMembresiaUserId === u.id) tr.classList.add("iam-row-selected");
      tr.innerHTML =
        "<td>" +
        escapeHtml(u.username) +
        "</td><td>" +
        escapeHtml(displayName(u)) +
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

  function syncBlockedUnlockUi() {
    var cb = document.getElementById("b-unlock");
    var cap = document.getElementById("b-unlock-caption");
    if (!cb || !cap) return;
    var on = cb.checked;
    cap.textContent = on ? "Desbloquear: Sí" : "Desbloquear";
    cb.setAttribute("aria-checked", on ? "true" : "false");
    cap.classList.toggle("iam-caption-activa", on);
    cap.classList.toggle("iam-caption-inactiva", !on);
    document.getElementById("b-password-wrap").style.display = on ? "" : "none";
    if (!on) {
      document.getElementById("b-password").value = "";
      document.getElementById("b-password").type = "password";
      document.getElementById("b-password-eye").innerHTML = '<i class="fa-solid fa-eye" aria-hidden="true"></i>';
      document.getElementById("b-temporal").checked = false;
    }
  }

  function showBlockedDetail(u) {
    selectedBlockedId = u.id;
    document.getElementById("blocked-detail-empty").style.display = "none";
    document.getElementById("blocked-detail-body").style.display = "flex";
    document.getElementById("blocked-detail-title").textContent = "Usuario bloqueado";
    document.getElementById("blocked-detail-sub").textContent = u.username;
    var when = u.lockedAt ? new Date(u.lockedAt).toLocaleString() : "—";
    document.getElementById("b-username").value = u.username || "";
    document.getElementById("b-primer-nombre").value = u.primerNombre || "";
    document.getElementById("b-segundo-nombre").value = u.segundoNombre || "";
    document.getElementById("b-primer-apellido").value = u.primerApellido || "";
    document.getElementById("b-segundo-apellido").value = u.segundoApellido || "";
    document.getElementById("b-email").value = u.email || "";
    document.getElementById("b-locked-at").value = when;
    document.getElementById("b-failed-attempts").value = u.failedLoginAttempts != null ? String(u.failedLoginAttempts) : "0";
    document.getElementById("b-unlock").checked = false;
    syncBlockedUnlockUi();
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
