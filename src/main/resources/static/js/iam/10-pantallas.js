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

