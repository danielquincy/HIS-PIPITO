(function () {
  "use strict";

  function getRoles() {
    const t = HisAuth.getToken();
    if (!t) return [];
    try {
      const parts = t.split(".");
      if (parts.length < 2) return [];
      let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      const payload = JSON.parse(atob(b64));
      return payload.roles || [];
    } catch (e) {
      return [];
    }
  }

  function hasAnyRole(roles) {
    const mine = getRoles();
    return roles.some(function (r) {
      return mine.indexOf(r) >= 0;
    });
  }

  function canReports() {
    return hasAnyRole(["ROLE_ADMIN", "ROLE_COORDINADOR"]);
  }

  async function apiJson(path, options) {
    const res = await apiFetch(path, options || {});
    if (res.status === 403) {
      const err = new Error("No tiene permiso para esta operación.");
      err.status = 403;
      throw err;
    }
    if (!res.ok) {
      let msg = "Error " + res.status;
      try {
        const j = await res.json();
        if (j.message) msg = j.message;
      } catch (e) {}
      throw new Error(msg);
    }
    const ct = res.headers.get("content-type");
    if (ct && ct.indexOf("application/json") >= 0) return res.json();
    return null;
  }

  function isoRangeDays(days) {
    const hasta = new Date();
    const desde = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return { desde: desde.toISOString(), hasta: hasta.toISOString() };
  }

  function rangeBackForward(past, future) {
    const now = new Date();
    return {
      desde: new Date(now.getTime() - past * 86400000).toISOString(),
      hasta: new Date(now.getTime() + future * 86400000).toISOString(),
    };
  }

  function fmtMoneyNI(n) {
    if (n == null || n === "") return "—";
    const x = Number(n);
    if (isNaN(x)) return String(n);
    return x.toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " C$";
  }

  function isTodayLocal(iso) {
    if (!iso) return false;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return false;
    const t = new Date();
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
  }

  function destroyDashCharts() {
    const arr = window.__hisDashChartInstances;
    if (!arr) return;
    arr.forEach(function (c) {
      try {
        c.destroy();
      } catch (e) {}
    });
    window.__hisDashChartInstances = [];
  }

  function registerDashChart(ch) {
    if (!window.__hisDashChartInstances) window.__hisDashChartInstances = [];
    window.__hisDashChartInstances.push(ch);
  }

  function analyzeCitasForDash(list) {
    const now = new Date();
    const ms7 = 7 * 86400000;
    const days14 = [];
    var i;
    for (i = 13; i >= 0; i--) {
      var day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - i);
      days14.push({ key: day.toDateString() });
    }
    var hoyN = 0;
    var prox7 = 0;
    var ult7 = 0;
    var progN = 0;
    const est = { PROGRAMADA: 0, COMPLETADA: 0, CANCELADA: 0, NO_ASISTIO: 0 };
    const byDay = {};
    days14.forEach(function (x) {
      byDay[x.key] = 0;
    });
    const prox = [];
    (list || []).forEach(function (c) {
      const t0 = c.inicioTs ? new Date(c.inicioTs) : null;
      if (!t0 || isNaN(t0.getTime())) return;
      const tt = t0.getTime();
      if (isTodayLocal(c.inicioTs)) hoyN++;
      if (tt >= now.getTime() && tt < now.getTime() + ms7) prox7++;
      if (tt < now.getTime() && tt >= now.getTime() - ms7) ult7++;
      const st = (c.estado || "").toUpperCase();
      if (st === "PROGRAMADA") progN++;
      if (est[st] !== undefined) est[st]++;
      const k = t0.toDateString();
      if (Object.prototype.hasOwnProperty.call(byDay, k)) byDay[k]++;
      if (tt >= now.getTime() && st !== "CANCELADA") prox.push(c);
    });
    prox.sort(function (a, b) {
      return new Date(a.inicioTs) - new Date(b.inicioTs);
    });
    const labels14 = (function () {
      const out = [];
      for (i = 13; i >= 0; i--) {
        var d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);
        out.push(d.toLocaleDateString("es-NI", { day: "2-digit", month: "short" }));
      }
      return out;
    })();
    const data14 = (function () {
      const out = [];
      for (i = 13; i >= 0; i--) {
        var d2 = new Date();
        d2.setHours(0, 0, 0, 0);
        d2.setDate(d2.getDate() - i);
        out.push(byDay[d2.toDateString()] || 0);
      }
      return out;
    })();
    return {
      hoyN: hoyN,
      prox7: prox7,
      ult7: ult7,
      progN: progN,
      total: (list || []).length,
      est: est,
      labels14: labels14,
      data14: data14,
      prox: prox.slice(0, 8),
    };
  }

  function fmtInstant(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d.getTime())
      ? String(iso)
      : d.toLocaleString("es-NI", { dateStyle: "short", timeStyle: "short" });
  }

  function fmtDate(isoDate) {
    if (!isoDate) return "—";
    return String(isoDate);
  }

  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstChild;
  }

  function escapeHtml(s) {
    if (s == null || s === "") return "";
    const d = document.createElement("div");
    d.textContent = String(s);
    return d.innerHTML;
  }

  function hisLoadingBlock(message, extraClass) {
    return (
      '<p class="his-loading' + (extraClass ? " " + extraClass : "") + '" role="status" aria-live="polite">' +
      '<i class="fa-solid fa-hourglass his-loading-ico" aria-hidden="true"></i><span>' +
      escapeHtml(message || "Cargando…") +
      "</span></p>"
    );
  }

  function hisLoadingTableRow(colspan, message) {
    return (
      '<tr class="his-loading-tr" role="status" aria-live="polite"><td class="his-loading-td" colspan="' +
      String(colspan) +
      '"><div class="his-loading"><i class="fa-solid fa-hourglass his-loading-ico" aria-hidden="true"></i><span>' +
      escapeHtml(message || "Cargando…") +
      "</span></div></td></tr>"
    );
  }

  /**
   * Abre el diálogo de impresión con un comprobante de cita (diseño tipo factura: encabezado, detalle, pie).
   * Requiere ventanas emergentes habilitadas.
   */
  function printCitaComprobanteAgenda(cita, options) {
    options = options || {};
    if (!cita || cita.id == null) return;
    var recursosLine = options.recursosLine != null && String(options.recursosLine).trim() !== ""
      ? String(options.recursosLine).trim()
      : "—";
    var exp =
      cita.pacienteNumeroExpediente != null && String(cita.pacienteNumeroExpediente).trim() !== ""
        ? String(cita.pacienteNumeroExpediente)
        : "—";
    var tipo = cita.tipoCitaNombre || cita.tipoCitaCodigo || "—";
    var sala = cita.salaNombre || "—";
    var espList =
      cita.especialidades && cita.especialidades.length
        ? cita.especialidades.join(", ")
        : "—";
    var dur = cita.duracionMinutos != null ? String(cita.duracionMinutos) + " minutos" : "—";
    var finStr = cita.finTs ? fmtInstant(cita.finTs) : "—";
    var iniStr = cita.inicioTs ? fmtInstant(cita.inicioTs) : "—";
    var notas = cita.notas && String(cita.notas).trim() ? String(cita.notas) : "—";
    var motivo = cita.motivoTexto && String(cita.motivoTexto).trim() ? String(cita.motivoTexto) : "—";
    var origen = cita.origen && String(cita.origen).trim() ? String(cita.origen) : "—";
    var estado = cita.estado || "—";
    var genTime = new Date().toLocaleString("es-NI", { dateStyle: "long", timeStyle: "short" });
    var logoSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56" aria-hidden="true"><rect width="56" height="56" rx="12" fill="#0c4a6e"/><path fill="#fff" d="M26 14h4v10h10v4H30v10h-4V28H16v-4h10V14z"/></svg>';
    var css =
      "@page{size:A4;margin:12mm}*{box-sizing:border-box}body{font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#0f172a;font-size:11pt;line-height:1.45;margin:0;background:#fff}" +
      ".sheet{max-width:190mm;margin:0 auto}.head{display:flex;align-items:center;gap:16px;padding-bottom:14px;border-bottom:3px solid #0c4a6e;margin-bottom:18px}" +
      ".head-logo{flex-shrink:0}.head-text h1{margin:0 0 4px;font-size:18pt;font-weight:700;color:#0c4a6e;letter-spacing:-.02em}" +
      ".head-text .sub{margin:0;font-size:9pt;color:#64748b}.doc-badge{text-align:right;flex:1}.doc-badge .dt{display:block;font-size:10pt;font-weight:600;color:#334155}" +
      ".doc-badge .folio{font-size:15pt;font-weight:700;color:#0c4a6e}.section{margin-bottom:16px}.section h2{font-size:9.5pt;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin:0 0 8px;font-weight:600}" +
      "table.details{width:100%;border-collapse:collapse}table.details th{text-align:left;width:34%;padding:7px 10px 7px 0;color:#475569;font-weight:600;font-size:9.5pt;vertical-align:top}" +
      "table.details td{padding:7px 0;border-bottom:1px solid #e2e8f0;font-size:10.5pt}table.details tr:last-child th,table.details tr:last-child td{border-bottom:none}" +
      ".td-pre{white-space:pre-wrap;word-break:break-word}.foot{margin-top:26px;padding-top:12px;border-top:1px solid #cbd5e1;font-size:8.5pt;color:#64748b}" +
      ".foot p{margin:4px 0}.hint{background:#f1f5f9;border-left:3px solid #0c4a6e;padding:8px 12px;font-size:9pt;color:#334155;margin-top:12px;border-radius:0 4px 4px 0}" +
      "@media print{.hint{-webkit-print-color-adjust:exact;print-color-adjust:exact}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}";
    function row(label, value, pre) {
      return (
        "<tr><th>" +
        escapeHtml(label) +
        "</th><td" +
        (pre ? ' class="td-pre"' : "") +
        ">" +
        escapeHtml(value) +
        "</td></tr>"
      );
    }
    var bodyHtml =
      '<div class="sheet"><header class="head"><div class="head-logo">' +
      logoSvg +
      '</div><div class="head-text"><h1>HIS PIPITOS</h1><p class="sub">Sistema de información hospitalaria</p></div>' +
      '<div class="doc-badge"><span class="dt">Comprobante de cita</span><span class="folio">Folio: #' +
      escapeHtml(String(cita.id)) +
      "</span></div></header>" +
      "<section class=\"section\"><h2>Datos de la cita</h2><table class=\"details\" role=\"presentation\">" +
      row("Fecha y hora de inicio", iniStr) +
      row("Fecha y hora de fin", finStr) +
      row("Duración", dur) +
      row("Estado", estado) +
      row("Tipo de consulta", tipo) +
      row("Sala asignada", sala) +
      row("Origen de registro", origen) +
      "</table></section>" +
      "<section class=\"section\"><h2>Paciente y atención</h2><table class=\"details\" role=\"presentation\">" +
      row("Paciente", cita.pacienteNombre || "—") +
      row("N° expediente", exp) +
      row("Especialista", cita.especialistaNombre || "—") +
      row("Especialidades (médico)", espList) +
      row("Recursos vinculados", recursosLine) +
      row("Motivo (registrado)", motivo) +
      "</table></section>" +
      "<section class=\"section\"><h2>Notas internas</h2><table class=\"details\" role=\"presentation\">" +
      row("Notas", notas, true) +
      "</table></section>" +
      '<p class="hint">Conserve este documento y preséntese con anticipación. Ante cambios de última hora, confirme con recepción.</p>' +
      '<footer class="foot"><p>Documento informativo generado electrónicamente. No reemplaza órdenes ni recetas médicas.</p><p>Impresión: ' +
      escapeHtml(genTime) +
      "</p></footer></div>";
    var docHtml =
      "<!DOCTYPE html><html lang=\"es\"><head><meta charset=\"utf-8\"/><title>Comprobante cita " +
      escapeHtml(String(cita.id)) +
      "</title><style>" +
      css +
      "</style></head><body>" +
      bodyHtml +
      "</body></html>";
    var w = window.open("", "_blank");
    if (!w) {
      notify("Permita ventanas emergentes para imprimir el comprobante de cita.", "warning");
      return;
    }
    w.document.open();
    w.document.write(docHtml);
    w.document.close();
    w.focus();
    setTimeout(function () {
      try {
        w.print();
      } catch (e) {}
    }, 300);
  }

  function openCitaDetalleModal(cita, recursos) {
    if (!cita) return;
    var recursosTxt = recursos && recursos.length ? recursos.join(", ") : "Sin recursos vinculados";
    var st = (cita.estado || "PROGRAMADA").toLowerCase();
    var backdrop = document.createElement("div");
    backdrop.className = "cita-picker-backdrop";
    backdrop.innerHTML =
      '<div class="cita-detalle-view dyn-card" role="dialog" aria-modal="true" aria-labelledby="cita-det-titulo">' +
      '<div class="cita-detalle-header">' +
      '<div class="cita-detalle-header-txt"><span class="esp-form-kicker">Cita clínica</span>' +
      '<h3 id="cita-det-titulo" class="esp-form-title">Detalle de cita</h3></div>' +
      '<div class="cita-detalle-header-right">' +
      '<span class="cita-detalle-estado cita-detalle-estado--' + escapeHtml(st) + '">' + escapeHtml(cita.estado || "PROGRAMADA") + "</span>" +
      '<button type="button" class="cita-detalle-print" id="cita-det-print" title="Imprimir comprobante" aria-label="Imprimir comprobante"><i class="fa-solid fa-print" aria-hidden="true"></i></button>' +
      '<button type="button" class="cita-detalle-close" id="cita-det-close" title="Cerrar" aria-label="Cerrar"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div></div>' +
      '<div class="cita-detalle-body">' +
      '<p class="esp-form-subtitle">Horario</p>' +
      '<div class="esp-form-grid esp-form-grid--edit cita-detalle-grid">' +
      '<div class="dyn-field"><label>Inicio</label><div class="cita-detalle-value cita-detalle-value--strong">' + escapeHtml(fmtInstant(cita.inicioTs)) + "</div></div>" +
      '<div class="dyn-field"><label>Fin</label><div class="cita-detalle-value cita-detalle-value--strong">' + escapeHtml(fmtInstant(cita.finTs)) + "</div></div>" +
      '<div class="dyn-field"><label>Tipo de consulta</label><div class="cita-detalle-value">' + escapeHtml(cita.tipoCitaNombre || cita.tipoCitaCodigo || "—") + "</div></div></div>" +
      '<p class="esp-form-subtitle">Equipo y paciente</p>' +
      '<div class="esp-form-grid esp-form-grid--edit cita-detalle-grid">' +
      '<div class="dyn-field esp-form-grid-span2"><label>Paciente</label><div class="cita-detalle-value">' + escapeHtml(cita.pacienteNombre || "—") + "</div></div>" +
      '<div class="dyn-field esp-form-grid-span2"><label>Especialista</label><div class="cita-detalle-value">' + escapeHtml(cita.especialistaNombre || "—") + "</div></div></div>" +
      '<p class="esp-form-subtitle">Sala y recursos reservados</p>' +
      '<div class="esp-form-grid esp-form-grid--edit cita-detalle-grid">' +
      '<div class="dyn-field"><label>Sala</label><div class="cita-detalle-value">' + escapeHtml(cita.salaNombre || "—") + "</div></div>" +
      '<div class="dyn-field"><label>Recursos vinculados</label><div class="cita-detalle-value">' + escapeHtml(recursosTxt) + "</div></div>" +
      '<div class="dyn-field esp-form-grid-span2"><label>Notas</label><div class="cita-detalle-value cita-detalle-value--block">' + escapeHtml(cita.notas || "—") + "</div></div></div></div></div>";
    document.body.appendChild(backdrop);
    function close() {
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    }
    var closeBtn = backdrop.querySelector("#cita-det-close");
    if (closeBtn) closeBtn.onclick = close;
    var printBtn = backdrop.querySelector("#cita-det-print");
    if (printBtn) {
      printBtn.onclick = function () {
        var line =
          recursosTxt && recursosTxt !== "Sin recursos vinculados" && String(recursosTxt).trim() !== ""
            ? recursosTxt
            : "—";
        printCitaComprobanteAgenda(cita, { recursosLine: line });
      };
    }
    backdrop.addEventListener("click", function (ev) {
      if (ev.target === backdrop) close();
    });
  }

  function openCitaDetalleFromApi(cita, recursoById) {
    return apiJson("/api/appointments/" + cita.id + "/vinculos")
      .then(function (vinculos) {
        var recursos = (vinculos || [])
          .filter(function (v) {
            return String(v.tipoVinculo || "").toUpperCase() === "RECURSO";
          })
          .map(function (v) {
            var rr = recursoById && recursoById[v.refId];
            return (rr && rr.nombre) || v.descripcion || ("Recurso #" + v.refId);
          });
        openCitaDetalleModal(cita, recursos);
      })
      .catch(function () {
        openCitaDetalleModal(cita, []);
      });
  }

  function ensureToastHost() {
    var host = document.getElementById("his-toast-host");
    if (host) return host;
    host = document.createElement("div");
    host.id = "his-toast-host";
    host.className = "his-toast-host";
    document.body.appendChild(host);
    return host;
  }

  function notify(message, kind) {
    var txt = String(message || "").trim();
    if (!txt) return;
    var tone = kind || "info";
    var host = ensureToastHost();
    var item = document.createElement("div");
    item.className = "his-toast his-toast--" + tone;
    item.setAttribute("role", "status");
    item.setAttribute("aria-live", "polite");
    item.innerHTML =
      '<span class="his-toast-msg">' +
      escapeHtml(txt) +
      '</span><button type="button" class="his-toast-close" aria-label="Cerrar notificación">×</button>';
    var closeBtn = item.querySelector(".his-toast-close");
    if (closeBtn) {
      closeBtn.onclick = function () {
        item.classList.add("is-leaving");
        setTimeout(function () {
          if (item.parentNode) item.parentNode.removeChild(item);
        }, 180);
      };
    }
    host.appendChild(item);
    setTimeout(function () {
      item.classList.add("is-leaving");
      setTimeout(function () {
        if (item.parentNode) item.parentNode.removeChild(item);
      }, 180);
    }, 3800);
  }

  function normalizePath(path) {
    if (!path) return "";
    return path.replace(/\/$/, "");
  }

  /** ¿Puede el usuario abrir esta página del HIS según IAM (ruta en mis-pantallas)? */
  function userCanOpenPage(pageId, pantallas) {
    var expected = normalizePath("/app/pages/" + pageId + ".html");
    return pantallas.some(function (p) {
      if (p.tipo === "MENU") return false;
      return normalizePath(p.ruta || "") === expected;
    });
  }

  function applySessionUserBar(me) {
    var el = document.getElementById("session-user-name");
    if (el) {
      var n = (me.displayName || me.username || "").trim() || "Usuario";
      el.textContent = n;
      el.setAttribute("title", n);
    }
  }

  function sessionDropdownHtml(isLight) {
    var theme = isLight ? "shell-session-dropdown--on-light" : "shell-session-dropdown--on-blue";
    var btn = isLight ? "shell-logout-btn--on-light" : "shell-logout-btn--on-blue";
    return (
      '<div class="shell-session-dropdown ' +
      theme +
      '" data-shell-dropdown>' +
      '<button type="button" class="shell-session-dropdown-trigger shell-logout-btn ' +
      btn +
      '" aria-expanded="false" aria-haspopup="menu">' +
      '<span>Acciones</span><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>' +
      '<div class="shell-session-dropdown-panel" role="menu" hidden>' +
      '<a href="/launcher.html" class="shell-session-dropdown-item" role="menuitem"><i class="fa-solid fa-house"></i> Inicio</a>' +
      '<button type="button" class="shell-session-dropdown-item" data-role="logout" role="menuitem">' +
      '<i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i> Cerrar sesión</button>' +
      "</div></div>"
    );
  }

  function setupTopbarSessionActions(me) {
    var slot = document.getElementById("topbar-actions-menu");
    if (!slot) return;
    if (me.iamMaster) {
      slot.innerHTML = sessionDropdownHtml(true);
      var wrap = slot.querySelector("[data-shell-dropdown]");
      if (wrap && typeof ShellSessionDropdown !== "undefined") ShellSessionDropdown.attach(wrap);
      var lo = slot.querySelector('[data-role="logout"]');
      if (lo) {
        lo.onclick = function () {
          if (typeof HisAuth !== "undefined") HisAuth.logout();
        };
      }
    } else {
      slot.innerHTML =
        '<button type="button" class="shell-logout-btn shell-logout-btn--on-light" data-role="logout">' +
        '<i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i><span>Cerrar sesión</span></button>';
      var b = slot.querySelector('[data-role="logout"]');
      if (b) {
        b.onclick = function () {
          if (typeof HisAuth !== "undefined") HisAuth.logout();
        };
      }
    }
  }

  function initPage(pageId) {
    if (!HisAuth.requireAuth()) return;
    var view = document.getElementById("page-root");
    if (!view) return;
    view.innerHTML = hisLoadingBlock("Cargando la pantalla…", "his-loading--page");
    Promise.all([
      apiFetch("/api/auth/me").then(function (res) {
        if (!res.ok) throw new Error("Sesión inválida");
        return res.json();
      }),
      apiJson("/api/auth/mis-pantallas"),
    ])
      .then(function (tuple) {
        var me = tuple[0];
        var pantallas = tuple[1];
        if (me.passwordMustChange) {
          window.location.replace("/change-password.html");
          return;
        }
        if (!pantallas || pantallas.length === 0) {
          view.innerHTML =
            '<div class="dyn-alert">Su usuario no tiene ninguna pantalla asignada mediante roles en IAM. Comuníquese con el administrador.</div>';
          return;
        }
        if (!userCanOpenPage(pageId, pantallas)) {
          view.innerHTML =
            '<div class="dyn-alert">No tiene permiso para esta pantalla. Redirigiendo al inicio…</div>';
          window.location.replace("/app/pages/inicio.html");
          return;
        }
        applySessionUserBar(me);
        setupTopbarSessionActions(me);
        if (typeof HisLayout !== "undefined" && HisLayout.updateSidebar) {
          HisLayout.updateSidebar(pageId, pantallas);
        }
        var runners = {
          inicio: renderInicio,
          graficos: renderGraficos,
          agenda: renderAgenda,
          citas: renderCitas,
          recursos: renderRecursos,
          pacientes: renderPacientes,
          especialidades: renderEspecialidades,
          especialistas: renderEspecialistas,
          reportes: renderReportes,
        };
        var fn = runners[pageId] || renderInicio;
        return Promise.resolve().then(function () {
          return fn(view);
        });
      })
      .catch(function (e) {
        view.innerHTML =
          '<div class="dyn-alert">' + (e.message || String(e)) + "</div>";
      });
  }

  function kpiNode(iconClass, value, label, sub) {
    return el(
      '<div class="dash-kpi"><div class="dash-kpi-ico" aria-hidden="true"><i class="fa-solid ' + iconClass + '"></i></div>' +
        '<div class="dash-kpi-body"><div class="dash-kpi-val">' +
        value +
        '</div><div class="dash-kpi-lbl">' +
        label +
        "</div>" +
        (sub ? '<div class="dash-kpi-sub">' + sub + "</div>" : "") +
        "</div></div>"
    );
  }

  function buildFinanceBlock(d, finDays) {
    const tasa = d.citas > 0 ? ((100 * d.inasistencias) / d.citas).toFixed(1) : "0";
    const h =
      '<div class="dyn-card dash-section" id="dash-finance-blk"><h3 class="dash-h3">Finanzas e indicadores clínicos</h3>' +
      '<p class="dash-finance-period">Acumulado en los últimos <strong>' +
      finDays +
      "</strong> días (según su selección arriba).</p>" +
      '<div class="dash-kpi-row">' +
      '<div class="dash-kpi"><div class="dash-kpi-ico"><i class="fa-solid fa-sack-dollar"></i></div><div class="dash-kpi-body"><div class="dash-kpi-val">' +
      fmtMoneyNI(d.ingresos) +
      '</div><div class="dash-kpi-lbl">Ingresos</div></div></div>' +
      '<div class="dash-kpi"><div class="dash-kpi-ico"><i class="fa-solid fa-receipt"></i></div><div class="dash-kpi-body"><div class="dash-kpi-val">' +
      fmtMoneyNI(d.costos) +
      '</div><div class="dash-kpi-lbl">Costos</div></div></div>' +
      '<div class="dash-kpi"><div class="dash-kpi-ico"><i class="fa-solid fa-scale-balanced"></i></div><div class="dash-kpi-body"><div class="dash-kpi-val">' +
      fmtMoneyNI(d.balance) +
      '</div><div class="dash-kpi-lbl">Balance (ing. − cost.)</div></div></div>' +
      '<div class="dash-kpi"><div class="dash-kpi-ico"><i class="fa-solid fa-coins"></i></div><div class="dash-kpi-body"><div class="dash-kpi-val">' +
      fmtMoneyNI(d.promedioIngresoPorCita) +
      '</div><div class="dash-kpi-lbl">Promedio ingreso / cita</div></div></div>' +
      '<div class="dash-kpi"><div class="dash-kpi-ico"><i class="fa-solid fa-clipboard-list"></i></div><div class="dash-kpi-body"><div class="dash-kpi-val">' +
      d.citas +
      '</div><div class="dash-kpi-lbl">Citas en periodo</div></div></div>' +
      '<div class="dash-kpi"><div class="dash-kpi-ico"><i class="fa-solid fa-user-xmark"></i></div><div class="dash-kpi-body"><div class="dash-kpi-val">' +
      d.inasistencias +
      '</div><div class="dash-kpi-lbl">Inasistencias (no asistió)</div><div class="dash-kpi-sub">Tasa ' +
      tasa +
      "% del total de citas</div></div></div></div>" +
      '<div class="dash-chart-finance"><canvas id="dash-chart-finance" height="200" aria-label="Ingresos, costos y balance"></canvas></div></div>';
    return h;
  }

  function mountFinanceChart(d) {
    const canvas = document.getElementById("dash-chart-finance");
    if (!canvas || !window.Chart) return;
    const ing = parseFloat(d.ingresos) || 0;
    const cos = parseFloat(d.costos) || 0;
    const bal = parseFloat(d.balance) || 0;
    const ch = new window.Chart(canvas, {
      type: "bar",
      data: {
        labels: ["Ingresos", "Costos", "Balance"],
        datasets: [
          {
            label: "Córdobas",
            data: [ing, cos, bal],
            backgroundColor: ["rgba(15, 118, 110, 0.75)", "rgba(100, 116, 139, 0.65)", "rgba(37, 99, 235, 0.7)"],
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (v) {
                var n = Number(v);
                if (n >= 1e3) return (n / 1e3).toFixed(1) + "k";
                return n;
              },
            },
          },
        },
      },
    });
    registerDashChart(ch);
  }

  function renderInicio(container) {
    container.innerHTML = "";
    destroyDashCharts();
    const showFin = canReports();
    const root = el(
      '<div class="dash-root">' +
        '<div class="dash-hero dyn-card">' +
        '<div class="dash-hero-txt"><p class="dash-hero-kicker">HIS-PIPITOS</p><h2 class="dash-hero-title">Panel de inicio</h2>' +
        '<p class="dash-hero-desc">Resumen de citas, tendencias y, si aplica, indicadores financieros acumulados. Los datos de agenda respetan su ámbito de acceso.</p></div>' +
        '<div class="dash-hero-date" id="dash-now-txt"></div></div>' +
        '<div class="dash-toolbar">' +
        '<div class="dash-quick" id="dash-quick"></div>' +
        '<div class="dash-period-wrap" id="dash-period-wrap" style="display:' +
        (showFin ? "flex" : "none") +
        '">' +
        '<span class="dash-toolbar-lbl">Finanzas</span>' +
        '<div class="dash-seg" role="group" aria-label="Días a sumar en reporte">' +
        '<button type="button" class="btn-fluent dash-pill" data-days="7">7 d</button>' +
        '<button type="button" class="btn-fluent esp-form-primary dash-pill" data-days="30">30 d</button>' +
        '<button type="button" class="btn-fluent dash-pill" data-days="90">90 d</button></div></div></div>' +
        '<p class="dyn-muted dash-hint" id="dash-hint" style="display:' +
        (showFin ? "none" : "block") +
        '">Los importes y reportes detallados están reservados a roles con acceso a reportes. Aún puede revisar su actividad de citas a continuación.</p>' +
        '<div class="dyn-card dash-load-card" id="dash-loading" style="margin-bottom:12px;padding:16px 18px;">' +
        hisLoadingBlock("Cargando resumen de agenda…") +
        "</div>" +
        '<div id="dash-main" class="dash-main" style="display:none"></div></div>'
    );
    container.appendChild(root);
    const nowTxt = document.getElementById("dash-now-txt");
    if (nowTxt) {
      nowTxt.textContent = new Date().toLocaleString("es-NI", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    const quick = document.getElementById("dash-quick");
    if (quick) {
      [
        { h: "/app/pages/agenda.html", i: "fa-calendar-days", t: "Agenda" },
        { h: "/app/pages/citas.html", i: "fa-clipboard-list", t: "Citas" },
        { h: "/app/pages/pacientes.html", i: "fa-user-injured", t: "Pacientes" },
        { h: "/app/pages/recursos.html", i: "fa-boxes-stacked", t: "Recursos" },
      ].forEach(function (L) {
        quick.appendChild(
          el(
            '<a class="dash-quick-btn" href="' +
              L.h +
              '"><i class="fa-solid ' +
              L.i +
              '"></i><span>' +
              L.t +
              "</span></a>"
          )
        );
      });
      if (showFin) {
        quick.appendChild(
          el(
            '<a class="dash-quick-btn dash-quick-btn--accent" href="/app/pages/reportes.html"><i class="fa-solid fa-chart-pie"></i><span>Reportes</span></a>'
          )
        );
      }
    }
    const main = document.getElementById("dash-main");
    const loadEl = document.getElementById("dash-loading");
    var finDays = 30;
    function setPillsActive() {
      root.querySelectorAll(".dash-pill").forEach(function (b) {
        b.classList.toggle("esp-form-primary", parseInt(b.getAttribute("data-days"), 10) === finDays);
      });
    }
    function loadAll() {
      const rng = rangeBackForward(21, 14);
      const citaP = apiJson(
        "/api/appointments/dashboard?desde=" + encodeURIComponent(rng.desde) + "&hasta=" + encodeURIComponent(rng.hasta)
      ).catch(function () {
        return [];
      });
      if (!showFin) {
        return citaP.then(function (list) {
          return { list: list, res: null, fin: finDays };
        });
      }
      const r0 = isoRangeDays(finDays);
      return Promise.all([
        citaP,
        apiJson(
          "/api/reports/resumen?desde=" + encodeURIComponent(r0.desde) + "&hasta=" + encodeURIComponent(r0.hasta)
        ),
      ]).then(function (pair) {
        return { list: pair[0] || [], res: pair[1], fin: finDays };
      });
    }
    function paint(pack) {
      const list = pack.list;
      const resumen = pack.res;
      const fd = pack.fin;
      const a = analyzeCitasForDash(list);
      loadEl.style.display = "none";
      main.style.display = "";
      main.innerHTML = "";
      const opWrap = el('<div class="dyn-card dash-section"></div>');
      const h3op = el('<h3 class="dash-h3">Actividad de citas (su ámbito)</h3>');
      const sub = el(
        '<p class="dash-ventana-hint">Ventana consultada: ~' +
          (list || []).length +
          " citas en los últimos 21 días y próximas 2 semanas.</p>"
      );
      const row = el('<div class="dash-kpi-row"></div>');
      row.appendChild(
        kpiNode("fa-sun", String(a.hoyN), "Citas hoy", "Inicio hoy (hora local)")
      );
      row.appendChild(
        kpiNode("fa-calendar-week", String(a.prox7), "Próx. 7 días", "Con inicio a futuro")
      );
      row.appendChild(
        kpiNode("fa-clock-rotate-left", String(a.ult7), "Últ. 7 días", "Ya ocurrieron en la semana")
      );
      row.appendChild(
        kpiNode("fa-list-check", String(a.progN), "Programadas", "Estado en agenda")
      );
      opWrap.appendChild(h3op);
      opWrap.appendChild(sub);
      opWrap.appendChild(row);
      main.appendChild(opWrap);
      const charts = el('<div class="dash-charts"></div>');
      const c1w = el(
        '<div class="dyn-card dash-section dash-chart-card"><h3 class="dash-h3">Citas por día (14 días)</h3><div class="dash-canvas-h"><canvas id="dash-chart-trend" height="220" aria-label="Tendencia de citas"></canvas></div></div>'
      );
      const c2w = el(
        '<div class="dyn-card dash-section dash-chart-card"><h3 class="dash-h3">Por estado (ventana actual)</h3><div class="dash-canvas-h"><canvas id="dash-chart-estado" height="220" aria-label="Citas por estado"></canvas></div></div>'
      );
      charts.appendChild(c1w);
      charts.appendChild(c2w);
      main.appendChild(charts);
      if (resumen) {
        main.insertAdjacentHTML("beforeend", buildFinanceBlock(resumen, fd));
      }
      const tb = el(
        '<div class="dyn-card dash-section"><h3 class="dash-h3">Próximas citas</h3><div class="dash-table-wrap"></div></div>'
      );
      const tw = tb.querySelector(".dash-table-wrap");
      if (a.prox.length === 0) {
        tw.appendChild(
          el('<p class="dyn-muted" style="margin:0">No hay citas futuras (no canceladas) en la ventana cargada o ya completó su agenda.</p>')
        );
      } else {
        const tbl =
          el('<table class="dyn-table dash-appointments"><thead><tr><th>Inicio</th><th>Paciente</th><th>Especialista</th><th>Estado</th></tr></thead><tbody></tbody></table>');
        const tbody = tbl.querySelector("tbody");
        a.prox.forEach(function (c) {
          const tr = document.createElement("tr");
          tr.innerHTML =
            "<td>" +
            escapeHtml(fmtInstant(c.inicioTs)) +
            "</td><td>" +
            escapeHtml(c.pacienteNombre || "—") +
            "</td><td>" +
            escapeHtml(c.especialistaNombre || "—") +
            "</td><td><span class=\"dash-badge\">" +
            escapeHtml(c.estado || "—") +
            "</span></td>";
          tbody.appendChild(tr);
        });
        tw.appendChild(tbl);
      }
      main.appendChild(tb);
      return ensureChart()
        .then(function () {
          destroyDashCharts();
          const tctx = document.getElementById("dash-chart-trend");
          if (tctx) {
            const tch = new window.Chart(tctx, {
              type: "line",
              data: {
                labels: a.labels14,
                datasets: [
                  {
                    label: "Citas",
                    data: a.data14,
                    borderColor: "rgb(15, 118, 110)",
                    backgroundColor: "rgba(15, 118, 110, 0.12)",
                    fill: true,
                    tension: 0.35,
                    pointRadius: 3,
                  },
                ],
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
              },
            });
            registerDashChart(tch);
          }
          const ect = document.getElementById("dash-chart-estado");
          if (ect) {
            const est = a.est;
            const labels = [];
            const dat = [];
            const colors = [];
            const map = [
              ["Programadas", est.PROGRAMADA, "rgba(15, 118, 110, 0.85)"],
              ["Completadas", est.COMPLETADA, "rgba(29, 78, 216, 0.8)"],
              ["Canceladas", est.CANCELADA, "rgba(100, 116, 139, 0.7)"],
              ["No asistió", est.NO_ASISTIO, "rgba(180, 83, 9, 0.75)"],
            ];
            map.forEach(function (m) {
              if (m[1] > 0) {
                labels.push(m[0]);
                dat.push(m[1]);
                colors.push(m[2]);
              }
            });
            if (labels.length === 0) {
              labels.push("Sin citas");
              dat.push(1);
              colors.push("rgba(148, 163, 184, 0.4)");
            }
            const ech = new window.Chart(ect, {
              type: "doughnut",
              data: {
                labels: labels,
                datasets: [
                  { data: dat, backgroundColor: colors, borderWidth: 0, hoverOffset: 6 },
                ],
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom" } },
              },
            });
            registerDashChart(ech);
          }
          if (resumen) {
            const canvas2 = document.getElementById("dash-chart-finance");
            if (canvas2) {
              mountFinanceChart(resumen);
            }
          }
        });
    }
    var dashPillsWired = false;
    function runDashLoad() {
      if (loadEl) {
        loadEl.innerHTML = hisLoadingBlock("Cargando indicadores de agenda…");
      }
      if (main) {
        main.style.display = "none";
      }
      return loadAll()
        .then(paint)
        .then(function () {
          if (loadEl) loadEl.style.display = "none";
          setPillsActive();
          if (showFin && !dashPillsWired) {
            dashPillsWired = true;
            root.querySelectorAll(".dash-pill").forEach(function (btn) {
              btn.addEventListener("click", function () {
                finDays = parseInt(btn.getAttribute("data-days"), 10) || 30;
                setPillsActive();
                main.style.opacity = "0.5";
                loadAll()
                  .then(paint)
                  .then(function () {
                    setPillsActive();
                  })
                  .catch(function (e) {
                    if (loadEl) {
                      loadEl.style.display = "";
                      loadEl.textContent = e.message || String(e);
                    }
                  })
                  .then(function () {
                    if (main) main.style.opacity = "1";
                  });
              });
            });
          }
        })
        .catch(function (e) {
          if (loadEl) {
            loadEl.style.display = "";
            loadEl.innerHTML =
              '<p class="dyn-muted">' +
              escapeHtml(e.message || String(e)) +
              '</p><button type="button" class="btn-fluent" id="dash-retry-load">Reintentar</button>';
            var rb = document.getElementById("dash-retry-load");
            if (rb) {
              rb.onclick = function () {
                runDashLoad();
              };
            }
          }
        });
    }
    runDashLoad();
  }

  let chartLoader = null;
  function ensureChart() {
    if (window.Chart) return Promise.resolve();
    if (chartLoader) return chartLoader;
    chartLoader = new Promise(function (resolve, reject) {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js";
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return chartLoader;
  }

  function renderGraficos(container) {
    container.innerHTML = hisLoadingBlock("Cargando indicadores…", "his-loading--page");
    const r = isoRangeDays(90);
    return apiJson(
      "/api/reports/resumen?desde=" +
        encodeURIComponent(r.desde) +
        "&hasta=" +
        encodeURIComponent(r.hasta)
    ).then(function (data) {
      container.innerHTML = "";
      const wrap = el('<div class="dyn-card"><h3>Indicadores (últimos 90 días)</h3><div class="chart-wrap"><canvas id="chart-resumen" height="220"></canvas></div></div>');
      container.appendChild(wrap);
      return ensureChart().then(function () {
        const ctx = document.getElementById("chart-resumen");
        if (!ctx) return;
        const ing = parseFloat(data.ingresos) || 0;
        const cos = parseFloat(data.costos) || 0;
        const bal = parseFloat(data.balance) || 0;
        new Chart(ctx, {
          type: "bar",
          data: {
            labels: ["Ingresos", "Costos", "Balance"],
            datasets: [
              {
                label: "Monto",
                data: [ing, cos, bal],
                backgroundColor: ["#0078d4", "#8764b8", "#107c10"],
              },
            ],
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } },
          },
        });
      });
    });
  }

  function loadScopeData() {
    const staffP = apiJson("/api/staff/especialistas").catch(function () {
      return null;
    });
    const tiposP = apiJson("/api/catalog/by-tipo/TIPO_CITA").catch(function () {
      return [];
    });
    const salasP = apiJson("/api/salas").catch(function () {
      return [];
    });
    const recursosP = apiJson("/api/catalog/by-tipo/RECURSO_CLINICO").catch(function () {
      return [];
    });
    return Promise.all([staffP, tiposP, salasP, recursosP]).then(function (arr) {
      return {
        patients: [],
        especialistas: arr[0],
        tiposCita: arr[1] || [],
        salas: arr[2] || [],
        recursos: arr[3] || [],
      };
    });
  }

  function renderAgenda(container) {
    container.innerHTML = hisLoadingBlock("Cargando agenda…", "his-loading--page");
    return loadScopeData().then(function (scope) {
      var espById = {};
      (scope.especialistas || []).forEach(function (e) {
        espById[e.id] = e;
      });
      var espEspecialidadesStr = {};
      (scope.especialistas || []).forEach(function (e) {
        espEspecialidadesStr[e.id] = (e.especialidades || []).join(" ").toLowerCase();
      });

      var viewMode = "semana";
      var anchorDate = new Date();
      anchorDate.setHours(12, 0, 0, 0);
      var agendaListRange = "mes";
      var searchQ = "";
      var lastUnfiltered = null;
      var searchDebounce = null;

      function startOfDay(d) {
        var x = new Date(d);
        x.setHours(0, 0, 0, 0);
        return x;
      }

      function endOfDay(d) {
        var x = new Date(d);
        x.setHours(23, 59, 59, 999);
        return x;
      }

      function mondayOfWeek(d) {
        var x = startOfDay(d);
        var wd = x.getDay();
        var diff = x.getDate() - wd + (wd === 0 ? -6 : 1);
        x.setDate(diff);
        return x;
      }

      function dayIsoKey(dateObj) {
        return (
          dateObj.getFullYear() +
          "-" +
          String(dateObj.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(dateObj.getDate()).padStart(2, "0")
        );
      }

      function dayShortLabel(dateObj) {
        return dateObj.toLocaleDateString("es-NI", { weekday: "short", day: "2-digit", month: "short" });
      }

      function fmtTimeShort(iso) {
        if (!iso) return "—";
        var d = new Date(iso);
        return isNaN(d.getTime()) ? "—" : d.toLocaleTimeString("es-NI", { hour: "numeric", minute: "2-digit" });
      }

      function fmtTimeRange(c) {
        if (!c || !c.inicioTs) return "—";
        var a = fmtTimeShort(c.inicioTs);
        var b = c.finTs ? fmtTimeShort(c.finTs) : "";
        return b ? a + " – " + b : a;
      }

      function citaTipoDescripcion(c) {
        var n = (c.notas || "").trim();
        if (n) return n;
        if (c.especialidades && c.especialidades.length) {
          return "Consulta — " + c.especialidades.join(", ");
        }
        var esp = espById[c.especialistaId];
        var labs =
          esp && esp.especialidades && esp.especialidades.length ? esp.especialidades.join(", ") : "";
        if (labs) return "Consulta — " + labs;
        return "Cita médica (" + (c.estado || "PROGRAMADA") + ")";
      }

      function citaMatches(c, q) {
        if (!q) return true;
        var exp = String(c.pacienteNumeroExpediente || "").toLowerCase();
        var pacN = String(c.pacienteNombre || "").toLowerCase();
        var espN = String(c.especialistaNombre || "").toLowerCase();
        var espList = "";
        if (c.especialidades && c.especialidades.length) {
          espList = c.especialidades.join(" ").toLowerCase();
        } else {
          espList = String(espEspecialidadesStr[c.especialistaId] || "");
        }
        return (
          exp.indexOf(q) >= 0 ||
          pacN.indexOf(q) >= 0 ||
          espN.indexOf(q) >= 0 ||
          espList.indexOf(q) >= 0
        );
      }

      function applyFilter(list) {
        var q = searchQ.trim().toLowerCase();
        if (!q) return list || [];
        return (list || []).filter(function (c) {
          return citaMatches(c, q);
        });
      }

      function getQueryRange() {
        var a = anchorDate;
        if (viewMode === "dia") {
          var d0 = startOfDay(a);
          return { desde: d0.toISOString(), hasta: endOfDay(d0).toISOString() };
        }
        if (viewMode === "semana") {
          var mon = mondayOfWeek(a);
          var hasta = new Date(mon);
          hasta.setDate(hasta.getDate() + 6);
          hasta.setHours(23, 59, 59, 999);
          return { desde: mon.toISOString(), hasta: hasta.toISOString() };
        }
        if (viewMode === "agenda" && agendaListRange === "4sem") {
          var mon4 = mondayOfWeek(a);
          var hasta4 = new Date(mon4);
          hasta4.setDate(hasta4.getDate() + 27);
          hasta4.setHours(23, 59, 59, 999);
          return { desde: mon4.toISOString(), hasta: hasta4.toISOString() };
        }
        var y = a.getFullYear();
        var m = a.getMonth();
        var desde = new Date(y, m, 1, 0, 0, 0, 0);
        var hastaM = new Date(y, m + 1, 0, 23, 59, 59, 999);
        return { desde: desde.toISOString(), hasta: hastaM.toISOString() };
      }

      function toolbarTitle() {
        var a = anchorDate;
        if (viewMode === "dia") {
          return a.toLocaleDateString("es-NI", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          });
        }
        if (viewMode === "semana") {
          var mon = mondayOfWeek(a);
          var sun = new Date(mon);
          sun.setDate(sun.getDate() + 6);
          if (mon.getFullYear() === sun.getFullYear() && mon.getMonth() === sun.getMonth()) {
            return (
              mon.getDate() +
              "–" +
              sun.getDate() +
              " " +
              mon.toLocaleDateString("es-NI", { month: "long", year: "numeric" })
            );
          }
          return (
            mon.toLocaleDateString("es-NI", { day: "numeric", month: "short" }) +
            " – " +
            sun.toLocaleDateString("es-NI", { day: "numeric", month: "long", year: "numeric" })
          );
        }
        if (viewMode === "agenda" && agendaListRange === "4sem") {
          var m0 = mondayOfWeek(a);
          var s0 = new Date(m0);
          s0.setDate(s0.getDate() + 27);
          return (
            m0.toLocaleDateString("es-NI", { day: "numeric", month: "short" }) +
            " – " +
            s0.toLocaleDateString("es-NI", { day: "numeric", month: "long", year: "numeric" })
          );
        }
        return a.toLocaleDateString("es-NI", { month: "long", year: "numeric" });
      }

      function agendaRangeHint() {
        if (viewMode !== "agenda") return "";
        if (agendaListRange === "4sem") {
          return "Mostrando citas de las próximas 4 semanas (lunes a domingo) desde la semana seleccionada.";
        }
        return "Mostrando citas del mes calendario completo.";
      }

      function navHint() {
        if (viewMode === "dia") return "Día anterior / siguiente";
        if (viewMode === "semana") {
          return "Semana anterior / siguiente";
        }
        if (viewMode === "agenda" && agendaListRange === "4sem") {
          return "Periodo de 4 semanas anterior / siguiente";
        }
        return "Mes anterior / siguiente";
      }

      function renderCitaCard(c) {
        return (
          '<article class="agenda-cal-item agenda-cal-item--' +
          escapeHtml((c.estado || "PROGRAMADA").toLowerCase()) +
          '">' +
          '<div class="agenda-cal-time">' +
          escapeHtml(fmtTimeRange(c)) +
          "</div>" +
          '<div class="agenda-cal-main">' +
          '<div class="agenda-cal-title">' +
          escapeHtml(c.pacienteNombre || "Paciente") +
          "</div>" +
          '<div class="agenda-cal-sub">' +
          escapeHtml(c.especialistaNombre || "Especialista") +
          "</div>" +
          '<div class="agenda-cal-state">' +
          escapeHtml(c.estado || "PROGRAMADA") +
          "</div></div></article>"
        );
      }

      function buildDayColumns(list, weekMonday) {
        var map = {};
        (list || []).forEach(function (c) {
          var d = new Date(c.inicioTs);
          var key = dayIsoKey(d);
          if (!map[key]) map[key] = [];
          map[key].push(c);
        });
        var html = "";
        var w0 = startOfDay(weekMonday);
        for (var i = 0; i < 7; i++) {
          var d = new Date(w0);
          d.setDate(d.getDate() + i);
          var key = dayIsoKey(d);
          var items = (map[key] || []).sort(function (a, b) {
            return new Date(a.inicioTs).getTime() - new Date(b.inicioTs).getTime();
          });
          html += '<section class="agenda-cal-day">';
          html += '<header class="agenda-cal-day-head">' + escapeHtml(dayShortLabel(d)) + "</header>";
          html += '<div class="agenda-cal-day-body">';
          if (!items.length) {
            html += '<p class="agenda-cal-empty">Sin citas</p>';
          } else {
            items.forEach(function (c) {
              html += renderCitaCard(c);
            });
          }
          html += "</div></section>";
        }
        return html;
      }

      function buildSingleDayList(list, dayDate) {
        var key = dayIsoKey(startOfDay(dayDate));
        var map = {};
        (list || []).forEach(function (c) {
          var d = new Date(c.inicioTs);
          var k = dayIsoKey(d);
          if (!map[k]) map[k] = [];
          map[k].push(c);
        });
        var items = (map[key] || []).sort(function (a, b) {
          return new Date(a.inicioTs).getTime() - new Date(b.inicioTs).getTime();
        });
        var html = '<div class="agenda-day-panel dyn-card">';
        if (!items.length) {
          html += '<p class="agenda-cal-empty agenda-day-panel-empty">No hay citas para este día.</p>';
        } else {
          items.forEach(function (c) {
            html += renderCitaCard(c);
          });
        }
        html += "</div>";
        return html;
      }

      function buildMonthGrid(list, anchor) {
        var y = anchor.getFullYear();
        var m = anchor.getMonth();
        var first = new Date(y, m, 1);
        var lastDay = new Date(y, m + 1, 0).getDate();
        var startPad = (first.getDay() + 6) % 7;
        var map = {};
        (list || []).forEach(function (c) {
          var d = new Date(c.inicioTs);
          var key = dayIsoKey(d);
          if (!map[key]) map[key] = [];
          map[key].push(c);
        });
        var html = '<div class="agenda-month-wrap">';
        html += '<div class="agenda-month-dow">';
        ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].forEach(function (w) {
          html += '<div class="agenda-month-dow-cell">' + w + "</div>";
        });
        html += '</div><div class="agenda-month-cells">';
        var totalCells = Math.ceil((startPad + lastDay) / 7) * 7;
        var todayKey = dayIsoKey(new Date());
        for (var i = 0; i < totalCells; i++) {
          var cellDay = i - startPad + 1;
          if (cellDay < 1 || cellDay > lastDay) {
            html += '<div class="agenda-month-cell agenda-month-cell--outside"></div>';
            continue;
          }
          var d = new Date(y, m, cellDay);
          var key = dayIsoKey(d);
          var items = (map[key] || []).sort(function (a, b) {
            return new Date(a.inicioTs).getTime() - new Date(b.inicioTs).getTime();
          });
          var isToday = key === todayKey;
          html +=
            '<div class="agenda-month-cell agenda-month-cell--pickable' +
            (isToday ? " agenda-month-cell--today" : "") +
            '" data-day-iso="' +
            escapeHtml(key) +
            '" role="button" tabindex="0" title="Ver este día">' +
            '<div class="agenda-month-cell-num">' +
            cellDay +
            '</div><div class="agenda-month-cell-body">';
          var maxShow = 3;
          for (var j = 0; j < Math.min(items.length, maxShow); j++) {
            var c = items[j];
            html +=
              '<div class="agenda-month-pill agenda-cal-item--' +
              escapeHtml((c.estado || "PROGRAMADA").toLowerCase()) +
              '"><span class="agenda-month-pill-time">' +
              escapeHtml(fmtTimeShort(c.inicioTs)) +
              "</span> " +
              escapeHtml((c.pacienteNombre || "Paciente").split(/\s+/)[0]) +
              "</div>";
          }
          if (items.length > maxShow) {
            html +=
              '<div class="agenda-month-more">+' + (items.length - maxShow) + " más</div>";
          }
          html += "</div></div>";
        }
        html += "</div></div>";
        return html;
      }

      function buildAgendaTable(list) {
        var sorted = (list || [])
          .slice()
          .sort(function (a, b) {
            return new Date(a.inicioTs).getTime() - new Date(b.inicioTs).getTime();
          });
        var hint = agendaRangeHint();
        var html = "";
        if (hint) {
          html += '<p class="agenda-agenda-range-hint dyn-muted">' + escapeHtml(hint) + "</p>";
        }
        html +=
          '<div class="dyn-table-wrap agenda-agenda-table-wrap"><table class="dyn-table agenda-agenda-table"><thead><tr>' +
          "<th>Fecha</th><th>Hora</th><th>Tipo / descripción</th>" +
          "</tr></thead><tbody>";
        if (!sorted.length) {
          html +=
            '<tr><td colspan="3" class="dyn-muted" style="padding:16px">No hay citas en este periodo.</td></tr>';
        } else {
          sorted.forEach(function (c) {
            var fd = new Date(c.inicioTs);
            var fechaStr = fd.toLocaleDateString("es-NI", {
              weekday: "short",
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
            html +=
              "<tr><td>" +
              escapeHtml(fechaStr) +
              "</td><td>" +
              escapeHtml(fmtTimeRange(c)) +
              "</td><td>" +
              escapeHtml(citaTipoDescripcion(c)) +
              "</td></tr>";
          });
        }
        html += "</tbody></table></div>";
        return html;
      }

      function buildMainBody(filtered) {
        if (viewMode === "dia") {
          return buildSingleDayList(filtered, anchorDate);
        }
        if (viewMode === "semana") {
          return (
            '<div class="agenda-cal-grid" id="agenda-cal-grid">' +
            buildDayColumns(filtered, mondayOfWeek(anchorDate)) +
            "</div>"
          );
        }
        if (viewMode === "mes") {
          return buildMonthGrid(filtered, anchorDate);
        }
        return buildAgendaTable(filtered);
      }

      function renderBodyFromCache() {
        var body = document.getElementById("agenda-body-main");
        if (!body || lastUnfiltered === null) return;
        var filtered = applyFilter(lastUnfiltered);
        body.innerHTML = buildMainBody(filtered);
        var st = document.getElementById("agenda-search-status");
        if (st) {
          var t = (lastUnfiltered || []).length;
          var n = filtered.length;
          st.textContent =
            searchQ.trim() && t
              ? n + " citas coincidentes de " + t + "."
              : searchQ.trim()
                ? "Sin coincidencias."
                : "";
        }
        attachAgendaBodyHandlers();
      }

      function attachAgendaBodyHandlers() {
        var main = document.getElementById("agenda-body-main");
        if (!main) return;
        main.onclick = function (ev) {
          var pick = ev.target.closest(".agenda-month-cell--pickable");
          if (!pick) return;
          var iso = pick.getAttribute("data-day-iso");
          if (!iso) return;
          var parts = iso.split("-");
          anchorDate = new Date(
            parseInt(parts[0], 10),
            parseInt(parts[1], 10) - 1,
            parseInt(parts[2], 10),
            12,
            0,
            0,
            0
          );
          viewMode = "dia";
          runFetch();
        };
        main.onkeydown = function (ev) {
          var pick = ev.target.closest(".agenda-month-cell--pickable");
          if (!pick || (ev.key !== "Enter" && ev.key !== " ")) return;
          ev.preventDefault();
          var iso = pick.getAttribute("data-day-iso");
          if (!iso) return;
          var parts = iso.split("-");
          anchorDate = new Date(
            parseInt(parts[0], 10),
            parseInt(parts[1], 10) - 1,
            parseInt(parts[2], 10),
            12,
            0,
            0,
            0
          );
          viewMode = "dia";
          runFetch();
        };
      }

      function attachToolbarHandlers() {
        var viewEl = document.getElementById("agenda-view-mode");
        var rangeEl = document.getElementById("agenda-range-mode");
        var prevBtn = document.getElementById("agenda-prev");
        var nextBtn = document.getElementById("agenda-next");
        var todayBtn = document.getElementById("agenda-today");
        var nuevaBtn = document.getElementById("agenda-nueva-cita");
        var searchEl = document.getElementById("agenda-search");

        if (viewEl) {
          viewEl.value = viewMode;
          viewEl.onchange = function () {
            viewMode = viewEl.value || "semana";
            runFetch();
          };
        }
        if (rangeEl) {
          rangeEl.value = agendaListRange;
          rangeEl.onchange = function () {
            agendaListRange = rangeEl.value || "mes";
            runFetch();
          };
        }
        if (todayBtn) {
          todayBtn.onclick = function () {
            anchorDate = new Date();
            anchorDate.setHours(12, 0, 0, 0);
            runFetch();
          };
        }
        if (nuevaBtn) {
          nuevaBtn.onclick = function () {
            try {
              var ymd = dayIsoKey(startOfDay(anchorDate));
              sessionStorage.setItem(
                "hisAgendaNovaCita",
                JSON.stringify({ nueva: true, fecha: ymd, hora: "" })
              );
            } catch (e) {}
            window.location.href = "/app/pages/citas.html";
          };
        }
        if (prevBtn) {
          prevBtn.onclick = function () {
            var a = new Date(anchorDate);
            if (viewMode === "dia") {
              a.setDate(a.getDate() - 1);
            } else if (viewMode === "semana") {
              a.setDate(a.getDate() - 7);
            } else if (viewMode === "agenda" && agendaListRange === "4sem") {
              a.setDate(a.getDate() - 28);
            } else {
              a.setMonth(a.getMonth() - 1);
            }
            anchorDate = a;
            runFetch();
          };
        }
        if (nextBtn) {
          nextBtn.onclick = function () {
            var a = new Date(anchorDate);
            if (viewMode === "dia") {
              a.setDate(a.getDate() + 1);
            } else if (viewMode === "semana") {
              a.setDate(a.getDate() + 7);
            } else if (viewMode === "agenda" && agendaListRange === "4sem") {
              a.setDate(a.getDate() + 28);
            } else {
              a.setMonth(a.getMonth() + 1);
            }
            anchorDate = a;
            runFetch();
          };
        }
        if (searchEl) {
          searchEl.value = searchQ;
          searchEl.oninput = function () {
            searchQ = searchEl.value;
            clearTimeout(searchDebounce);
            searchDebounce = setTimeout(function () {
              renderBodyFromCache();
            }, 200);
          };
        }
      }

      function runFetch() {
        if (viewMode === "semana_detalle") viewMode = "semana";
        var range = getQueryRange();
        var url =
          "/api/appointments?desde=" +
          encodeURIComponent(range.desde) +
          "&hasta=" +
          encodeURIComponent(range.hasta);
        return apiJson(url)
          .then(function (list) {
            lastUnfiltered = list || [];
            var filtered = applyFilter(lastUnfiltered);
            var html = '<div class="agenda-gc-wrap" role="region" aria-label="Agenda clínica">';
            html += '<div class="agenda-gc-toolbar">';
            html += '<div class="agenda-gc-nav">';
            html +=
              '<button type="button" class="btn-fluent agenda-gc-nueva" id="agenda-nueva-cita" title="Crear una nueva cita">Nueva cita</button>';
            html +=
              '<button type="button" class="btn-fluent btn-fluent-secondary agenda-gc-today" id="agenda-today" aria-label="Ir a la fecha de hoy" title="Ir a hoy">Hoy</button>';
            html +=
              '<button type="button" class="btn-fluent btn-fluent-secondary agenda-gc-arrow" id="agenda-prev" aria-label="Periodo anterior" title="' +
              escapeHtml(navHint()) +
              '">‹</button>';
            html +=
              '<button type="button" class="btn-fluent btn-fluent-secondary agenda-gc-arrow" id="agenda-next" aria-label="Periodo siguiente" title="' +
              escapeHtml(navHint()) +
              '">›</button>';
            html += '<h2 class="agenda-gc-title" id="agenda-title">' + escapeHtml(toolbarTitle()) + "</h2>";
            html += "</div>";
            html += '<div class="agenda-gc-filters">';
            html +=
              '<div class="agenda-gc-search-wrap"><i class="fa-solid fa-magnifying-glass agenda-gc-search-ico" aria-hidden="true"></i>';
            html +=
              '<input type="search" id="agenda-search" class="agenda-gc-search" placeholder="Buscar por expediente, paciente, especialidad o especialista…" autocomplete="off" aria-label="Buscar citas" /></div>';
            html +=
              '<div id="agenda-search-status" class="agenda-search-status visually-hidden" role="status" aria-live="polite"></div>';
            html += '<label class="agenda-gc-view-label"><span>Vista</span>';
            html +=
              '<select id="agenda-view-mode" class="agenda-gc-view-select" aria-label="Tipo de vista del calendario">' +
              '<option value="dia">Día</option>' +
              '<option value="semana">Semana</option>' +
              '<option value="mes">Mes</option>' +
              '<option value="agenda">Agenda</option>' +
              "</select></label>";
            html +=
              '<label class="agenda-gc-range-label" id="agenda-range-label" style="' +
              (viewMode === "agenda" ? "" : "display:none") +
              '"><span>Rango lista</span>';
            html +=
              '<select id="agenda-range-mode" class="agenda-gc-view-select" aria-label="Rango de fechas para la vista Agenda">' +
              '<option value="mes">Este mes</option>' +
              '<option value="4sem">Próximas 4 semanas</option>' +
              "</select></label>";
            html += "</div></div>";
            html += '<div id="agenda-body-main" class="agenda-body-main">' + buildMainBody(filtered) + "</div>";
            html += "</div>";
            container.innerHTML = html;
            var st = document.getElementById("agenda-search-status");
            if (st) {
              var t = (lastUnfiltered || []).length;
              var n = filtered.length;
              st.textContent =
                searchQ.trim() && t
                  ? n + " citas coincidentes de " + t + "."
                  : searchQ.trim()
                    ? "Sin coincidencias."
                    : "";
            }
            attachToolbarHandlers();
            attachAgendaBodyHandlers();
          })
          .catch(function (err) {
            container.innerHTML =
              '<div class="dyn-alert">' + escapeHtml(err.message || "No se pudo cargar la agenda.") + "</div>";
          });
      }

      return runFetch();
    });
  }

  /** Mismo modal que en Citas: búsqueda + tabla; doble clic para elegir. */
  function citaModalOpenPicker(items, titleText, placeholderText, rowBuilder, onPick) {
    var backdrop = document.createElement("div");
    backdrop.className = "cita-picker-backdrop";
    backdrop.innerHTML =
      '<div class="cita-picker-modal dyn-card">' +
      '<div class="cita-picker-head"><h3>' + escapeHtml(titleText) + "</h3>" +
      '<button type="button" class="cita-picker-close" id="cita-picker-close" aria-label="Cerrar"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>' +
      '<div class="cita-picker-search-wrap">' +
      '<i class="fa-solid fa-magnifying-glass cita-picker-search-ico" aria-hidden="true"></i>' +
      '<input type="search" id="cita-picker-search" class="cita-picker-search-input" placeholder="' + escapeHtml(placeholderText) + '" autocomplete="off" />' +
      "</div>" +
      '<div class="dyn-table-wrap cita-picker-table-wrap">' +
      '<table class="dyn-table"><thead><tr><th>Expediente</th><th>Nombre</th><th>Teléfono</th></tr></thead><tbody id="cita-picker-body"></tbody></table>' +
      "</div></div>";
    document.body.appendChild(backdrop);

    var bodyEl = backdrop.querySelector("#cita-picker-body");
    var searchEl = backdrop.querySelector("#cita-picker-search");
    var closeBtn = backdrop.querySelector("#cita-picker-close");

    function renderRows() {
      var q = String(searchEl.value || "").trim().toLowerCase();
      var rows = "";
      (items || [])
        .filter(function (p) {
          if (!q) return true;
          var bag = String((rowBuilder.searchText && rowBuilder.searchText(p)) || "").toLowerCase();
          return bag.indexOf(q) >= 0;
        })
        .forEach(function (it) {
          rows += rowBuilder.html(it);
        });
      if (!rows) rows = '<tr><td colspan="3" class="dyn-muted" style="padding:16px">Sin resultados.</td></tr>';
      bodyEl.innerHTML = rows;
      bodyEl.querySelectorAll("tr[data-pid]").forEach(function (row) {
        row.ondblclick = function () {
          var id = parseInt(row.getAttribute("data-pid"), 10);
          var found = (items || []).find(function (p) {
            return p.id === id;
          });
          if (found) onPick(found);
          if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        };
      });
    }

    searchEl.oninput = renderRows;
    closeBtn.onclick = function () {
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    };
    backdrop.addEventListener("click", function (ev) {
      if (ev.target === backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    });
    renderRows();
    searchEl.focus();
  }

  /**
   * Selector de paciente con búsqueda en servidor (no carga el listado completo al abrir).
   */
  function citaModalOpenPatientSearchPicker(onPick) {
    var backdrop = document.createElement("div");
    backdrop.className = "cita-picker-backdrop";
    backdrop.innerHTML =
      '<div class="cita-picker-modal dyn-card">' +
      '<div class="cita-picker-head"><h3>Seleccionar paciente</h3>' +
      '<button type="button" class="cita-picker-close" id="cita-picker-pacapi-close" aria-label="Cerrar"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>' +
      '<div class="cita-picker-search-wrap">' +
      '<i class="fa-solid fa-magnifying-glass cita-picker-search-ico" aria-hidden="true"></i>' +
      '<input type="search" id="cita-picker-pacapi-search" class="cita-picker-search-input" placeholder="Buscar por expediente, nombre o teléfono (servidor)…" autocomplete="off" />' +
      "</div>" +
      '<div class="dyn-table-wrap cita-picker-table-wrap">' +
      '<table class="dyn-table"><thead><tr><th>Expediente</th><th>Nombre</th><th>Teléfono</th></tr></thead><tbody id="cita-picker-pacapi-body"></tbody></table></div></div>';
    document.body.appendChild(backdrop);
    var bodyEl = backdrop.querySelector("#cita-picker-pacapi-body");
    var searchEl = backdrop.querySelector("#cita-picker-pacapi-search");
    var closeBtn = backdrop.querySelector("#cita-picker-pacapi-close");
    var debT = null;
    function bindDbl() {
      bodyEl.querySelectorAll("tr[data-pid]").forEach(function (row) {
        row.ondblclick = function () {
          var id = parseInt(row.getAttribute("data-pid"), 10);
          if (isNaN(id)) return;
          var p = (bindDbl._lastList || []).find(function (x) { return x.id === id; });
          if (p) onPick(p);
          if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        };
      });
    }
    function setLoading() {
      bodyEl.innerHTML =
        hisLoadingTableRow(3, "Buscando…");
    }
    function fetchList() {
      var q = String(searchEl.value || "").trim();
      if (q.length < 1) {
        bodyEl.innerHTML =
          '<tr><td colspan="3" class="dyn-muted" style="padding:16px">Escriba al menos un carácter. La búsqueda se hace en el servidor.</td></tr>';
        return;
      }
      setLoading();
      apiJson("/api/patients/search?q=" + encodeURIComponent(q) + "&page=0&size=50")
        .then(function (page) {
          var list = (page && page.content) || [];
          bindDbl._lastList = list;
          var rows = "";
          list.forEach(function (p) {
            rows +=
              '<tr data-pid="' +
              p.id +
              '" style="cursor:pointer"><td>' +
              escapeHtml(p.numeroExpediente || "—") +
              "</td><td>" +
              escapeHtml(((p.nombres || "") + " " + (p.apellidos || "")).trim()) +
              "</td><td>" +
              escapeHtml(p.telefono || "—") +
              "</td></tr>";
          });
          if (!rows) {
            rows = '<tr><td colspan="3" class="dyn-muted" style="padding:16px">Sin resultados. Pruebe otro texto.</td></tr>';
          }
          bodyEl.innerHTML = rows;
          bindDbl();
        })
        .catch(function (e) {
          bodyEl.innerHTML =
            '<tr><td colspan="3" class="dyn-muted" style="padding:16px">' + escapeHtml(e.message || "Error de búsqueda") + "</td></tr>";
        });
    }
    searchEl.oninput = function () {
      clearTimeout(debT);
      debT = setTimeout(fetchList, 350);
    };
    closeBtn.onclick = function () {
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    };
    backdrop.addEventListener("click", function (ev) {
      if (ev.target === backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    });
    bodyEl.innerHTML =
      '<tr><td colspan="3" class="dyn-muted" style="padding:16px">Escriba para buscar (mín. 1 carácter)…</td></tr>';
    searchEl.focus();
  }

  /**
   * Igual que en nueva cita: lista de especialidades (con unidad) + especialistas; doble clic.
   * `especialistasAll` = respuesta de GET /api/staff/especialistas.
   */
  function citaModalOpenEspecialistaPorEspecialidad(especialistasAll, onPick) {
    apiJson("/api/catalog/by-tipo/ESPECIALIDAD")
      .then(function (catsRaw) {
        var cats = (catsRaw || [])
          .filter(function (c) {
            return c.parentCatalogoId != null;
          })
          .sort(function (a, b) {
            return String(a.nombre || "").localeCompare(String(b.nombre || ""), "es", {
              sensitivity: "base",
            });
          });
        var backdrop = document.createElement("div");
        backdrop.className = "cita-picker-backdrop";
        backdrop.innerHTML =
          '<div class="cita-picker-modal cita-picker-modal--espesp dyn-card">' +
          '<div class="cita-picker-head"><h3>Seleccionar especialista</h3>' +
          '<button type="button" class="cita-picker-close" id="cita-espesp-close" aria-label="Cerrar"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>' +
          '<div class="cita-espesp-body">' +
          '<div class="cita-espesp-col">' +
          '<p class="cita-espesp-col-title">Especialidades</p>' +
          '<div class="cita-picker-search-wrap cita-espesp-search-wrap">' +
          '<i class="fa-solid fa-magnifying-glass cita-picker-search-ico" aria-hidden="true"></i>' +
          '<input type="search" id="cita-espesp-cat-search" class="cita-picker-search-input" placeholder="Buscar especialidad..." autocomplete="off" />' +
          "</div>" +
          '<div class="dyn-table-wrap cita-espesp-table-wrap"><table class="dyn-table"><thead><tr><th>Especialidad</th></tr></thead><tbody id="cita-espesp-cat-body"></tbody></table></div>' +
          '<div class="esp-staff-pagination"><span id="cita-espesp-cat-summary">Sin registros</span><span id="cita-espesp-cat-pager"></span></div></div>' +
          '<div class="cita-espesp-col">' +
          '<p class="cita-espesp-col-title">Especialistas</p>' +
          '<div class="cita-picker-search-wrap cita-espesp-search-wrap">' +
          '<i class="fa-solid fa-magnifying-glass cita-picker-search-ico" aria-hidden="true"></i>' +
          '<input type="search" id="cita-espesp-staff-search" class="cita-picker-search-input" placeholder="Buscar especialista..." autocomplete="off" />' +
          "</div>" +
          '<div class="dyn-table-wrap cita-espesp-table-wrap"><table class="dyn-table"><thead><tr><th>Nombre</th><th>Correo</th></tr></thead><tbody id="cita-espesp-staff-body"></tbody></table></div>' +
          '<div class="esp-staff-pagination"><span id="cita-espesp-staff-summary">Sin registros</span><span id="cita-espesp-staff-pager"></span></div></div>' +
          "</div></div>";
        document.body.appendChild(backdrop);

        var catBody = backdrop.querySelector("#cita-espesp-cat-body");
        var staffBody = backdrop.querySelector("#cita-espesp-staff-body");
        var closeBtn = backdrop.querySelector("#cita-espesp-close");
        var catSearchEl = backdrop.querySelector("#cita-espesp-cat-search");
        var staffSearchEl = backdrop.querySelector("#cita-espesp-staff-search");
        var catSummaryEl = backdrop.querySelector("#cita-espesp-cat-summary");
        var staffSummaryEl = backdrop.querySelector("#cita-espesp-staff-summary");
        var catPagerEl = backdrop.querySelector("#cita-espesp-cat-pager");
        var staffPagerEl = backdrop.querySelector("#cita-espesp-staff-pager");
        var selectedCatId = null;
        var catPage = 1;
        var staffPage = 1;
        var PAGE_SIZE = 10;

        function tieneEspecialidad(esp, catId) {
          var det = esp.especialidadesDetalle || [];
          for (var i = 0; i < det.length; i++) {
            if (det[i].id === catId) return true;
          }
          return false;
        }

        function setPagination(pagerEl, page, totalPages, onNav) {
          if (!pagerEl) return;
          if (totalPages <= 1) {
            pagerEl.innerHTML = "";
            return;
          }
          pagerEl.innerHTML =
            '<div class="esp-staff-page-nav">' +
            '<button type="button" class="esp-staff-page-btn" data-dir="prev" ' +
            (page <= 1 ? "disabled" : "") +
            ">‹</button>" +
            "<span>Página " +
            page +
            " de " +
            totalPages +
            "</span>" +
            '<button type="button" class="esp-staff-page-btn" data-dir="next" ' +
            (page >= totalPages ? "disabled" : "") +
            ">›</button></div>";
          pagerEl.querySelectorAll("[data-dir]").forEach(function (btn) {
            btn.onclick = function () {
              onNav(btn.getAttribute("data-dir"));
            };
          });
        }

        function renderStaffRows() {
          if (selectedCatId == null) {
            staffBody.innerHTML =
              '<tr><td colspan="2" class="dyn-muted" style="padding:12px">Seleccione una especialidad.</td></tr>';
            if (staffSummaryEl) staffSummaryEl.textContent = "Sin registros";
            if (staffPagerEl) staffPagerEl.innerHTML = "";
            return;
          }
          var q = String((staffSearchEl && staffSearchEl.value) || "")
            .trim()
            .toLowerCase();
          var list = (especialistasAll || [])
            .filter(function (e) {
              return tieneEspecialidad(e, selectedCatId);
            })
            .filter(function (e) {
              if (!q) return true;
              var bag =
                String(e.nombres || "").toLowerCase() +
                " " +
                String(e.apellidos || "").toLowerCase() +
                " " +
                String(e.email || "").toLowerCase();
              return bag.indexOf(q) >= 0;
            });
          var total = list.length;
          var totalPages = total === 0 ? 1 : Math.ceil(total / PAGE_SIZE);
          if (staffPage < 1) staffPage = 1;
          if (staffPage > totalPages) staffPage = totalPages;
          var start = (staffPage - 1) * PAGE_SIZE;
          var pageSlice = list.slice(start, start + PAGE_SIZE);
          var rows = "";
          pageSlice.forEach(function (e) {
            rows +=
              '<tr data-eid="' +
              e.id +
              '" style="cursor:pointer"><td>' +
              escapeHtml(((e.nombres || "") + " " + (e.apellidos || "")).trim() || "—") +
              "</td><td>" +
              escapeHtml(e.email || "—") +
              "</td></tr>";
          });
          if (!rows) {
            rows =
              '<tr><td colspan="2" class="dyn-muted" style="padding:12px">Ningún especialista con esta especialidad.</td></tr>';
          }
          staffBody.innerHTML = rows;
          if (staffSummaryEl) {
            var end = Math.min(start + PAGE_SIZE, total);
            staffSummaryEl.textContent = total === 0 ? "Sin registros" : start + 1 + "–" + end + " de " + total;
          }
          setPagination(staffPagerEl, staffPage, totalPages, function (dir) {
            staffPage = staffPage + (dir === "next" ? 1 : -1);
            renderStaffRows();
          });
          staffBody.querySelectorAll("tr[data-eid]").forEach(function (row) {
            row.ondblclick = function () {
              var id = parseInt(row.getAttribute("data-eid"), 10);
              var found = (especialistasAll || []).find(function (x) {
                return x.id === id;
              });
              if (found) onPick(found);
              if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
            };
          });
        }

        function renderCatRows() {
          var q = String((catSearchEl && catSearchEl.value) || "")
            .trim()
            .toLowerCase();
          var filteredCats = cats.filter(function (c) {
            if (!q) return true;
            return String(c.nombre || "").toLowerCase().indexOf(q) >= 0;
          });
          var total = filteredCats.length;
          var totalPages = total === 0 ? 1 : Math.ceil(total / PAGE_SIZE);
          if (catPage < 1) catPage = 1;
          if (catPage > totalPages) catPage = totalPages;
          var start = (catPage - 1) * PAGE_SIZE;
          var pageSlice = filteredCats.slice(start, start + PAGE_SIZE);
          var rows = "";
          pageSlice.forEach(function (c) {
            rows +=
              '<tr data-cid="' +
              c.id +
              '" class="cita-espesp-cat-row" style="cursor:pointer"><td>' +
              escapeHtml(c.nombre || "—") +
              "</td></tr>";
          });
          if (!rows) {
            catBody.innerHTML =
              '<tr><td colspan="1" class="dyn-muted" style="padding:12px">No hay especialidades en catálogo.</td></tr>';
            if (catSummaryEl) catSummaryEl.textContent = "Sin registros";
            if (catPagerEl) catPagerEl.innerHTML = "";
            return;
          }
          catBody.innerHTML = rows;
          if (catSummaryEl) {
            var end = Math.min(start + PAGE_SIZE, total);
            catSummaryEl.textContent = total === 0 ? "Sin registros" : start + 1 + "–" + end + " de " + total;
          }
          setPagination(catPagerEl, catPage, totalPages, function (dir) {
            catPage = catPage + (dir === "next" ? 1 : -1);
            renderCatRows();
          });
          catBody.querySelectorAll("tr[data-cid]").forEach(function (row) {
            row.onclick = function () {
              var cid = parseInt(row.getAttribute("data-cid"), 10);
              selectedCatId = cid;
              staffPage = 1;
              catBody.querySelectorAll(".cita-espesp-cat-row").forEach(function (r) {
                r.classList.remove("cita-espesp-cat-row--active");
              });
              row.classList.add("cita-espesp-cat-row--active");
              renderStaffRows();
            };
          });
          renderStaffRows();
        }

        if (catSearchEl) {
          catSearchEl.oninput = function () {
            catPage = 1;
            renderCatRows();
          };
        }
        if (staffSearchEl) {
          staffSearchEl.oninput = function () {
            staffPage = 1;
            renderStaffRows();
          };
        }

        closeBtn.onclick = function () {
          if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        };
        backdrop.addEventListener("click", function (ev) {
          if (ev.target === backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        });
        renderCatRows();
      })
      .catch(function (e) {
        notify(e.message || "No se pudo cargar especialidades", "error");
      });
  }

  /**
   * Modal estilo "tipo de consulta" para elegir una fila de ESPECIALIDAD (misma UX que en Citas: búsqueda + doble clic).
   */
  function citaModalOpenEspecialidadCatalogoPicker(onPick) {
    apiJson("/api/catalog/by-tipo/ESPECIALIDAD")
      .then(function (raw) {
        var items = (raw || [])
          .filter(function (c) {
            return c.parentCatalogoId != null;
          })
          .sort(function (a, b) {
            return String(a.nombre || "").localeCompare(String(b.nombre || ""), "es", { sensitivity: "base" });
          });
        var backdrop = document.createElement("div");
        backdrop.className = "cita-picker-backdrop";
        backdrop.innerHTML =
          '<div class="cita-picker-modal dyn-card">' +
          '<div class="cita-picker-head"><h3>Seleccionar especialidad</h3>' +
          '<button type="button" class="cita-picker-close" id="cita-esp2-close" aria-label="Cerrar"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>' +
          '<div class="cita-picker-search-wrap"><i class="fa-solid fa-magnifying-glass cita-picker-search-ico" aria-hidden="true"></i>' +
          '<input type="search" id="cita-esp2-search" class="cita-picker-search-input" placeholder="Buscar especialidad..." autocomplete="off" /></div>' +
          '<div class="dyn-table-wrap cita-picker-table-wrap"><table class="dyn-table"><thead><tr><th>Código</th><th>Especialidad</th></tr></thead><tbody id="cita-esp2-body"></tbody></table></div></div>';
        document.body.appendChild(backdrop);
        var bodyEl = backdrop.querySelector("#cita-esp2-body");
        var searchEl = backdrop.querySelector("#cita-esp2-search");
        function renderRows() {
          var q = String(searchEl.value || "").trim().toLowerCase();
          var html = "";
          (items || [])
            .filter(function (t) {
              if (!q) return true;
              var bag = (String(t.codigo || "") + " " + String(t.nombre || "")).toLowerCase();
              return bag.indexOf(q) >= 0;
            })
            .forEach(function (t) {
              html +=
                '<tr data-eid2="' +
                t.id +
                '" style="cursor:pointer"><td>' +
                escapeHtml(t.codigo || "—") +
                "</td><td>" +
                escapeHtml(t.nombre || "—") +
                "</td></tr>";
            });
          if (!html) html = '<tr><td colspan="2" class="dyn-muted" style="padding:16px">Sin resultados.</td></tr>';
          bodyEl.innerHTML = html;
          bodyEl.querySelectorAll("tr[data-eid2]").forEach(function (tr) {
            tr.ondblclick = function () {
              var id = parseInt(tr.getAttribute("data-eid2"), 10);
              var found = (items || []).find(function (x) {
                return x.id === id;
              });
              if (found) onPick(found);
              if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
            };
          });
        }
        searchEl.oninput = renderRows;
        backdrop.querySelector("#cita-esp2-close").onclick = function () {
          if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        };
        backdrop.addEventListener("click", function (ev) {
          if (ev.target === backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        });
        renderRows();
        searchEl.focus();
      })
      .catch(function (e) {
        notify(e.message || "No se pudo cargar especialidades", "error");
      });
  }

  function renderCitas(container) {
    container.innerHTML = hisLoadingBlock("Cargando citas…", "his-loading--page");
    return loadScopeData().then(function (scope) {
      try {
        var raw = sessionStorage.getItem("hisAgendaNovaCita");
        if (raw) {
          sessionStorage.removeItem("hisAgendaNovaCita");
          var o = JSON.parse(raw);
          if (o && o.nueva) {
            window.__hisCitasSel = { kind: "new" };
            window.__hisCitasPrefillFecha = o.fecha || "";
            window.__hisCitasPrefillHora = o.hora || "";
          }
        }
      } catch (e) {}
      var sel = window.__hisCitasSel || { kind: "none" };
      var draftPac = window.__hisCitasDraftPac || null;
      var draftEsp = window.__hisCitasDraftEsp || null;
      var draftSala = window.__hisCitasDraftSala || null;
      var draftTipo = window.__hisCitasDraftTipo || null;
      var draftEstado = window.__hisCitasDraftEstado || "PROGRAMADA";
      var draftRecursos = window.__hisCitasDraftRecursos || [];
      var CITAS_PAGE_SIZE = 20;
      if (window.__hisCitasFechaDesde == null || String(window.__hisCitasFechaDesde).trim() === "") {
        var tfd = new Date();
        var ffd = new Date(tfd.getTime());
        ffd.setDate(ffd.getDate() - 90);
        window.__hisCitasFechaDesde = ffd.toISOString().slice(0, 10);
        window.__hisCitasFechaHasta = tfd.toISOString().slice(0, 10);
      }
      if (window.__hisCitasApiPage == null || !Number.isFinite(Number(window.__hisCitasApiPage)) || window.__hisCitasApiPage < 0) {
        window.__hisCitasApiPage = 0;
      }
      if (window.__hisCitasQueried == null) {
        window.__hisCitasQueried = false;
      }
      var searchQ = String(window.__hisCitasSearch || "").trim();

      function buildFormPanel() {
        if (sel.kind !== "new" && sel.kind !== "edit") {
          return (
            '<div class="esp-form-placeholder">' +
            '<i class="fa-regular fa-calendar-plus esp-form-placeholder-icon" aria-hidden="true"></i>' +
            '<p class="esp-form-placeholder-title">Citas clínicas</p>' +
            '<p class="dyn-muted">Use <strong>+ Agregar</strong> para crear una nueva cita.</p></div>'
          );
        }
        if (!scope.especialistas || !scope.especialistas.length) {
          return '<p class="dyn-muted">Para crear citas necesita especialistas visibles en su alcance.</p>';
        }
        var isEdit = sel.kind === "edit" && sel.id != null;
        var pacName = draftPac && draftPac.nombre ? draftPac.nombre : "";
        var pacId = draftPac && draftPac.id != null ? draftPac.id : "";
        var espName = draftEsp && draftEsp.nombre ? draftEsp.nombre : "";
        var espId = draftEsp && draftEsp.id != null ? draftEsp.id : "";
        var salaName = draftSala && draftSala.nombre ? draftSala.nombre : "";
        var salaId = draftSala && draftSala.id != null ? draftSala.id : "";
        var tipoName = draftTipo && draftTipo.nombre ? draftTipo.nombre : "";
        var tipoId = draftTipo && draftTipo.id != null ? draftTipo.id : "";
        var notasVal = window.__hisCitasDraftNotas != null ? String(window.__hisCitasDraftNotas) : "";
        var recursosById = {};
        (scope.recursos || []).forEach(function (r) {
          recursosById[String(r.id)] = r;
        });
        var recursosNombres = (draftRecursos || [])
          .map(function (rid) {
            var rr = recursosById[String(rid)];
            return rr ? rr.nombre || rr.codigo || "" : "";
          })
          .filter(function (x) {
            return !!x;
          });
        var recursosTxt = recursosNombres.length ? recursosNombres.join(", ") : "";
        var printBtnHtml = isEdit
          ? '<button type="button" class="btn-fluent btn-fluent-secondary" id="nc-print" title="Imprimir comprobante de cita">' +
            '<i class="fa-solid fa-print" aria-hidden="true"></i> Imprimir</button>'
          : "";
        return (
          '<div class="esp-form-header"><span class="esp-form-kicker">Agenda clínica</span><h3 class="esp-form-title">' +
          (isEdit ? "Editar cita" : "Nueva cita") +
          "</h3></div>" +
          '<div class="esp-form-body esp-form-body--with-footer"><div class="esp-form-main">' +
          '<div class="esp-form-grid esp-form-grid--edit">' +
          '<div class="dyn-field"><label>Paciente</label>' +
          '<div class="cita-picker-field">' +
          '<input type="text" id="nc-p-text" class="esp-form-input cita-picker-input" value="' +
          escapeHtml(pacName) +
          '" placeholder="Buscar Paciente..." readonly />' +
          '<input type="hidden" id="nc-p-id" value="' +
          escapeHtml(pacId) +
          '" />' +
          '<button type="button" class="cita-picker-btn" id="nc-p-pick" title="Buscar paciente">' +
          '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i></button></div></div>' +
          '<div class="dyn-field"><label>Especialista</label>' +
          '<div class="cita-picker-field">' +
          '<input type="text" id="nc-e-text" class="esp-form-input cita-picker-input" value="' +
          escapeHtml(espName) +
          '" placeholder="Buscar Especialista..." readonly />' +
          '<input type="hidden" id="nc-e-id" value="' +
          escapeHtml(espId) +
          '" />' +
          '<button type="button" class="cita-picker-btn" id="nc-e-pick" title="Buscar especialista">' +
          '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i></button></div></div>' +
          '<div class="dyn-field"><label>Fecha</label><input type="date" id="nc-d" class="esp-form-input" /></div>' +
          '<div class="dyn-field"><label>Hora</label><input type="time" id="nc-h" class="esp-form-input cita-time-input" step="900" /></div>' +
          '<div class="dyn-field"><label>Estado</label><select id="nc-estado" class="esp-form-input">' +
          '<option value="PROGRAMADA"' + (draftEstado === "PROGRAMADA" ? " selected" : "") + ">PROGRAMADA</option>" +
          '<option value="COMPLETADA"' + (draftEstado === "COMPLETADA" ? " selected" : "") + ">COMPLETADA</option>" +
          '<option value="CANCELADA"' + (draftEstado === "CANCELADA" ? " selected" : "") + ">CANCELADA</option>" +
          '<option value="NO_ASISTIO"' + (draftEstado === "NO_ASISTIO" ? " selected" : "") + ">NO_ASISTIO</option>" +
          "</select></div>" +
          '<div class="dyn-field"><label>Tipo de consulta</label>' +
          '<div class="cita-picker-field">' +
          '<input type="text" id="nc-t-text" class="esp-form-input cita-picker-input" value="' +
          escapeHtml(tipoName) +
          '" placeholder="Seleccionar tipo..." readonly />' +
          '<input type="hidden" id="nc-t-id" value="' +
          escapeHtml(tipoId) +
          '" />' +
          '<button type="button" class="cita-picker-btn" id="nc-t-pick" title="Buscar tipo de consulta">' +
          '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i></button></div></div>' +
          '<div class="dyn-field"><label>Sala</label>' +
          '<div class="cita-picker-field">' +
          '<input type="text" id="nc-s-text" class="esp-form-input cita-picker-input" value="' +
          escapeHtml(salaName) +
          '" placeholder="Seleccionar sala..." readonly />' +
          '<input type="hidden" id="nc-s-id" value="' +
          escapeHtml(salaId) +
          '" />' +
          '<button type="button" class="cita-picker-btn" id="nc-s-pick" title="Buscar sala">' +
          '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i></button></div></div>' +
          '<div class="dyn-field esp-form-grid-span2"><label>Recursos</label>' +
          '<div class="cita-picker-field">' +
          '<input type="text" id="nc-r-text" class="esp-form-input cita-picker-input" value="' +
          escapeHtml(recursosTxt) +
          '" placeholder="Seleccionar recursos..." readonly />' +
          '<button type="button" class="cita-picker-btn" id="nc-r-pick" title="Buscar recursos">' +
          '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i></button></div>' +
          '<small class="dyn-muted">Puede seleccionar uno o más recursos adicionales para la cita.</small></div>' +
          '<div class="dyn-field esp-form-grid-span2"><label>Notas</label><textarea id="nc-n" class="esp-form-input" rows="3">' +
          escapeHtml(notasVal) +
          "</textarea></div>" +
          "</div></div>" +
          '<div class="esp-form-actions esp-form-actions--footer">' +
          '<button type="button" class="btn-fluent esp-form-primary" id="nc-go">Guardar</button>' +
          printBtnHtml +
          '<button type="button" class="btn-fluent esp-form-btn-cancel" id="nc-cancel">Cancelar</button></div></div>'
        );
      }

      function openSalaPicker(items, onPick) {
        var rows = (items || []).map(function (s) {
          return {
            id: s.id,
            c1: s.codigo || "—",
            c2: s.nombre || "—",
          };
        });
        var backdrop = document.createElement("div");
        backdrop.className = "cita-picker-backdrop";
        backdrop.innerHTML =
          '<div class="cita-picker-modal dyn-card">' +
          '<div class="cita-picker-head"><h3>Seleccionar sala</h3>' +
          '<button type="button" class="cita-picker-close" id="cita-sala-close" aria-label="Cerrar"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>' +
          '<div class="cita-picker-search-wrap"><i class="fa-solid fa-magnifying-glass cita-picker-search-ico" aria-hidden="true"></i>' +
          '<input type="search" id="cita-sala-search" class="cita-picker-search-input" placeholder="Buscar sala..." autocomplete="off" /></div>' +
          '<div class="dyn-table-wrap cita-picker-table-wrap"><table class="dyn-table"><thead><tr><th>Código</th><th>Sala</th></tr></thead><tbody id="cita-sala-body"></tbody></table></div></div>';
        document.body.appendChild(backdrop);
        var bodyEl = backdrop.querySelector("#cita-sala-body");
        var searchEl = backdrop.querySelector("#cita-sala-search");
        function renderRows() {
          var q = String(searchEl.value || "").trim().toLowerCase();
          var html = "";
          rows
            .filter(function (r) {
              if (!q) return true;
              return (String(r.c1) + " " + String(r.c2)).toLowerCase().indexOf(q) >= 0;
            })
            .forEach(function (r) {
              html +=
                '<tr data-sid="' +
                r.id +
                '" style="cursor:pointer"><td>' +
                escapeHtml(r.c1) +
                "</td><td>" +
                escapeHtml(r.c2) +
                "</td></tr>";
            });
          if (!html) html = '<tr><td colspan="2" class="dyn-muted" style="padding:16px">Sin resultados.</td></tr>';
          bodyEl.innerHTML = html;
          bodyEl.querySelectorAll("tr[data-sid]").forEach(function (tr) {
            tr.ondblclick = function () {
              var id = parseInt(tr.getAttribute("data-sid"), 10);
              var found = (items || []).find(function (x) {
                return x.id === id;
              });
              if (found) onPick(found);
              if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
            };
          });
        }
        searchEl.oninput = renderRows;
        backdrop.querySelector("#cita-sala-close").onclick = function () {
          if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        };
        backdrop.addEventListener("click", function (ev) {
          if (ev.target === backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        });
        renderRows();
        searchEl.focus();
      }

      function openTipoPicker(items, onPick) {
        var backdrop = document.createElement("div");
        backdrop.className = "cita-picker-backdrop";
        backdrop.innerHTML =
          '<div class="cita-picker-modal dyn-card">' +
          '<div class="cita-picker-head"><h3>Seleccionar tipo de consulta</h3>' +
          '<button type="button" class="cita-picker-close" id="cita-tipo-close" aria-label="Cerrar"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>' +
          '<div class="cita-picker-search-wrap"><i class="fa-solid fa-magnifying-glass cita-picker-search-ico" aria-hidden="true"></i>' +
          '<input type="search" id="cita-tipo-search" class="cita-picker-search-input" placeholder="Buscar tipo..." autocomplete="off" /></div>' +
          '<div class="dyn-table-wrap cita-picker-table-wrap"><table class="dyn-table"><thead><tr><th>Código</th><th>Tipo</th></tr></thead><tbody id="cita-tipo-body"></tbody></table></div></div>';
        document.body.appendChild(backdrop);
        var bodyEl = backdrop.querySelector("#cita-tipo-body");
        var searchEl = backdrop.querySelector("#cita-tipo-search");
        function renderRows() {
          var q = String(searchEl.value || "").trim().toLowerCase();
          var html = "";
          (items || [])
            .filter(function (t) {
              if (!q) return true;
              var bag = (String(t.codigo || "") + " " + String(t.nombre || "")).toLowerCase();
              return bag.indexOf(q) >= 0;
            })
            .forEach(function (t) {
              html +=
                '<tr data-tid="' +
                t.id +
                '" style="cursor:pointer"><td>' +
                escapeHtml(t.codigo || "—") +
                "</td><td>" +
                escapeHtml(t.nombre || "—") +
                "</td></tr>";
            });
          if (!html) html = '<tr><td colspan="2" class="dyn-muted" style="padding:16px">Sin resultados.</td></tr>';
          bodyEl.innerHTML = html;
          bodyEl.querySelectorAll("tr[data-tid]").forEach(function (tr) {
            tr.ondblclick = function () {
              var id = parseInt(tr.getAttribute("data-tid"), 10);
              var found = (items || []).find(function (x) {
                return x.id === id;
              });
              if (found) onPick(found);
              if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
            };
          });
        }
        searchEl.oninput = renderRows;
        backdrop.querySelector("#cita-tipo-close").onclick = function () {
          if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        };
        backdrop.addEventListener("click", function (ev) {
          if (ev.target === backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        });
        renderRows();
        searchEl.focus();
      }

      function openRecursosPicker(items, selectedIds, onApply) {
        var selected = {};
        (selectedIds || []).forEach(function (id) {
          selected[String(id)] = true;
        });
        var backdrop = document.createElement("div");
        backdrop.className = "cita-picker-backdrop";
        backdrop.innerHTML =
          '<div class="cita-picker-modal dyn-card">' +
          '<div class="cita-picker-head"><h3>Seleccionar recursos</h3>' +
          '<button type="button" class="cita-picker-close" id="cita-rec-close" aria-label="Cerrar"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>' +
          '<div class="cita-picker-search-wrap"><i class="fa-solid fa-magnifying-glass cita-picker-search-ico" aria-hidden="true"></i>' +
          '<input type="search" id="cita-rec-search" class="cita-picker-search-input" placeholder="Buscar recurso..." autocomplete="off" /></div>' +
          '<div class="dyn-table-wrap cita-picker-table-wrap"><table class="dyn-table"><thead><tr><th></th><th>Código</th><th>Recurso</th></tr></thead><tbody id="cita-rec-body"></tbody></table></div>' +
          '<div class="esp-form-actions esp-form-actions--footer"><button type="button" class="btn-fluent esp-form-primary" id="cita-rec-apply">Guardar</button><button type="button" class="btn-fluent esp-form-btn-cancel" id="cita-rec-cancel">Cancelar</button></div></div>';
        document.body.appendChild(backdrop);
        var bodyEl = backdrop.querySelector("#cita-rec-body");
        var searchEl = backdrop.querySelector("#cita-rec-search");
        function renderRows() {
          var q = String(searchEl.value || "").trim().toLowerCase();
          var html = "";
          (items || [])
            .filter(function (r) {
              if (!q) return true;
              var bag = (String(r.codigo || "") + " " + String(r.nombre || "")).toLowerCase();
              return bag.indexOf(q) >= 0;
            })
            .forEach(function (r) {
              var checked = selected[String(r.id)] ? " checked" : "";
              html +=
                '<tr data-rid="' +
                r.id +
                '" style="cursor:pointer"><td><input type="checkbox" data-rchk="' +
                r.id +
                '"' +
                checked +
                " /></td><td>" +
                escapeHtml(r.codigo || "—") +
                "</td><td>" +
                escapeHtml(r.nombre || "—") +
                "</td></tr>";
            });
          if (!html) html = '<tr><td colspan="3" class="dyn-muted" style="padding:16px">Sin resultados.</td></tr>';
          bodyEl.innerHTML = html;
          bodyEl.querySelectorAll("input[data-rchk]").forEach(function (chk) {
            chk.onchange = function () {
              var id = String(chk.getAttribute("data-rchk"));
              if (chk.checked) selected[id] = true;
              else delete selected[id];
            };
          });
          bodyEl.querySelectorAll("tr[data-rid]").forEach(function (tr) {
            tr.onclick = function (ev) {
              if (ev.target && ev.target.tagName === "INPUT") return;
              var id = String(tr.getAttribute("data-rid"));
              var chk = tr.querySelector('input[data-rchk="' + id + '"]');
              if (!chk) return;
              chk.checked = !chk.checked;
              chk.dispatchEvent(new Event("change"));
            };
          });
        }
        searchEl.oninput = renderRows;
        backdrop.querySelector("#cita-rec-apply").onclick = function () {
          var ids = Object.keys(selected);
          onApply(ids);
          if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        };
        backdrop.querySelector("#cita-rec-cancel").onclick = function () {
          if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        };
        backdrop.querySelector("#cita-rec-close").onclick = function () {
          if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        };
        backdrop.addEventListener("click", function (ev) {
          if (ev.target === backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        });
        renderRows();
        searchEl.focus();
      }

      function bindCitasDblClick(allList) {
        container.querySelectorAll("#citas-table-body tr[data-cita-id]").forEach(function (row) {
          row.ondblclick = function () {
            var id = parseInt(row.getAttribute("data-cita-id"), 10);
            if (isNaN(id)) return;
            var cita = (allList || []).find(function (x) {
              return x.id === id;
            });
            if (!cita) return;
            window.__hisCitasSel = { kind: "edit", id: cita.id };
            window.__hisCitasDraftPac = {
              id: cita.pacienteId,
              nombre: cita.pacienteNombre || "",
            };
            window.__hisCitasDraftEsp = {
              id: cita.especialistaId,
              nombre: cita.especialistaNombre || "",
            };
            window.__hisCitasDraftSala = cita.salaId
              ? { id: cita.salaId, nombre: cita.salaNombre || "" }
              : null;
            window.__hisCitasDraftTipo = cita.tipoCitaCatalogoId
              ? { id: cita.tipoCitaCatalogoId, nombre: cita.tipoCitaNombre || cita.tipoCitaCodigo || "" }
              : null;
            window.__hisCitasDraftEstado = cita.estado || "PROGRAMADA";
            window.__hisCitasDraftNotas = cita.notas || "";
            apiJson("/api/appointments/" + cita.id + "/vinculos")
              .then(function (vinculos) {
                var ids = (vinculos || [])
                  .filter(function (v) {
                    return String(v.tipoVinculo || "").toUpperCase() === "RECURSO";
                  })
                  .map(function (v) {
                    return String(v.refId);
                  });
                window.__hisCitasDraftRecursos = ids;
                renderCitas(container);
              })
              .catch(function () {
                window.__hisCitasDraftRecursos = [];
                renderCitas(container);
              });
          };
        });
      }

      function buildCitasListPartsFromPageRes(pageRes) {
        var citasList = (pageRes && pageRes.content) || [];
        var totalElements = pageRes && pageRes.totalElements != null ? pageRes.totalElements : 0;
        var totalPagesApi = pageRes && pageRes.totalPages != null ? pageRes.totalPages : 0;
        var pageNum0 = pageRes && pageRes.number != null ? pageRes.number : 0;
        var sizePg = pageRes && pageRes.size != null ? pageRes.size : CITAS_PAGE_SIZE;
        var citasTotal = totalElements;
        var citasTotalPages = totalElements === 0 ? 1 : Math.max(1, totalPagesApi);
        var citasPage = totalElements === 0 ? 1 : pageNum0 + 1;
        var citasStart = totalElements === 0 ? 0 : pageNum0 * sizePg;
        var citasSlice = citasList;
        var rowsHtml = "";
        citasSlice.forEach(function (c) {
          rowsHtml +=
            '<tr data-cita-id="' +
            c.id +
            '"><td>' +
            escapeHtml(fmtInstant(c.inicioTs)) +
            "</td><td>" +
            escapeHtml(c.pacienteNombre || "") +
            "</td><td>" +
            escapeHtml(c.especialistaNombre || "") +
            "</td><td>" +
            escapeHtml(c.estado || "") +
            "</td></tr>";
        });
        if (!rowsHtml) {
          rowsHtml =
            '<tr><td colspan="4" class="dyn-muted" style="padding:16px">' +
            (window.__hisCitasQueried
              ? "Sin citas en este rango o con el criterio indicado. Ajuste fechas, texto o página."
              : "Indique <strong>Desde / Hasta</strong> y pulse <strong>Buscar</strong> para cargar citas (listado paginado en el servidor, sin descargar todo el histórico).") +
            "</td></tr>";
        }
        var endIdx = citasTotal ? Math.min(citasStart + sizePg, citasTotal) : 0;
        var summaryText = window.__hisCitasQueried
          ? "Mostrando " + (citasTotal ? citasStart + 1 : 0) + "–" + endIdx + " de " + citasTotal + " citas (pág. " + citasPage + " de " + citasTotalPages + ")"
          : "Sin resultados hasta que busque (paginado en servidor).";
        var canPrev = window.__hisCitasQueried && citasTotal > 0 && pageNum0 > 0;
        var canNext = window.__hisCitasQueried && citasTotal > 0 && totalPagesApi > 0 && pageNum0 < totalPagesApi - 1;
        var pagerHtml =
          '<div class="esp-staff-page-nav">' +
          '<button type="button" class="esp-staff-page-btn" data-citas-page="prev" ' +
          (canPrev ? "" : "disabled") +
          '>‹</button><span class="esp-staff-page-indicator">Página ' +
          citasPage +
          " / " +
          citasTotalPages +
          '</span><button type="button" class="esp-staff-page-btn" data-citas-page="next" ' +
          (canNext ? "" : "disabled") +
          ">›</button></div>";
        return { rowsHtml: rowsHtml, summaryText: summaryText, pagerHtml: pagerHtml, list: citasList };
      }

      function getCitasListUrl() {
        var searchQ2 = String(window.__hisCitasSearch || "").trim();
        var dIsoC = repHistLocalDateStartIso(window.__hisCitasFechaDesde);
        var hIsoC = repHistLocalDateEndExclusiveIso(window.__hisCitasFechaHasta);
        var u =
          "/api/appointments/page?desde=" +
          encodeURIComponent(dIsoC) +
          "&hasta=" +
          encodeURIComponent(hIsoC) +
          "&page=" +
          window.__hisCitasApiPage +
          "&size=" +
          CITAS_PAGE_SIZE +
          "&sort=inicioTs,desc";
        if (searchQ2) {
          u += "&q=" + encodeURIComponent(searchQ2);
        }
        return u;
      }

      function updateCitasTableAndPagerFromPageRes(pageRes) {
        if (!pageRes) return;
        if (pageRes.number != null) {
          window.__hisCitasApiPage = pageRes.number;
        }
        var elBody = document.getElementById("citas-table-body");
        var elSum = document.getElementById("citas-page-summary");
        var elNav = document.getElementById("citas-page-nav-wrap");
        if (!elBody || !elSum || !elNav) return;
        var parts = buildCitasListPartsFromPageRes(pageRes);
        elBody.innerHTML = parts.rowsHtml;
        elSum.textContent = parts.summaryText;
        elNav.innerHTML = parts.pagerHtml;
        window.__hisCitasPageList = parts.list;
        bindCitasDblClick(parts.list);
        wireCitasPager();
      }

      function refreshCitasListData() {
        if (!window.__hisCitasQueried) return Promise.resolve();
        return apiJson(getCitasListUrl())
          .then(function (pageRes) {
            if (!document.getElementById("citas-table-body")) {
              return renderCitas(container);
            }
            return updateCitasTableAndPagerFromPageRes(pageRes);
          })
          .catch(function (e) {
            notify((e && e.message) || "No se pudo actualizar el listado de citas", "error");
          });
      }

      function wireCitasPager() {
        container.querySelectorAll("[data-citas-page]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            if (!window.__hisCitasQueried) {
              return;
            }
            var dir = btn.getAttribute("data-citas-page");
            var p0 = window.__hisCitasApiPage != null ? Number(window.__hisCitasApiPage) : 0;
            if (!Number.isFinite(p0) || p0 < 0) p0 = 0;
            if (dir === "prev") {
              window.__hisCitasApiPage = Math.max(0, p0 - 1);
            } else {
              window.__hisCitasApiPage = p0 + 1;
            }
            refreshCitasListData();
          });
        });
      }

      function mountCitasFromPageResult(pageRes) {
        var parts = buildCitasListPartsFromPageRes(pageRes);
        var filtered = parts.list;
        window.__hisCitasPageList = parts.list;

        function citaSnapshotForFormPrint(base) {
          base = base || {};
          var id = sel.id;
          var dVal = (document.getElementById("nc-d") || {}).value;
          var hVal = (document.getElementById("nc-h") || {}).value;
          var inicio = base.inicioTs;
          if (dVal && hVal) {
            var hps = String(hVal).split(":");
            var timeLocal = hps.length >= 3 ? hVal : hVal + ":00";
            inicio = new Date(dVal + "T" + timeLocal).toISOString();
          }
          var dur = base.duracionMinutos != null ? base.duracionMinutos : 45;
          var fin = inicio
            ? new Date(new Date(inicio).getTime() + dur * 60000).toISOString()
            : base.finTs;
          return {
            id: id,
            pacienteNombre: (document.getElementById("nc-p-text") || {}).value || base.pacienteNombre || "",
            pacienteNumeroExpediente: base.pacienteNumeroExpediente,
            especialistaNombre: (document.getElementById("nc-e-text") || {}).value || base.especialistaNombre || "",
            especialidades: base.especialidades,
            inicioTs: inicio,
            finTs: fin,
            duracionMinutos: dur,
            estado: String(
              (document.getElementById("nc-estado") && document.getElementById("nc-estado").value) || base.estado || "PROGRAMADA"
            ),
            notas: (document.getElementById("nc-n") || {}).value || null,
            tipoCitaNombre: (document.getElementById("nc-t-text") || {}).value || base.tipoCitaNombre || "",
            tipoCitaCodigo: base.tipoCitaCodigo,
            salaNombre: (document.getElementById("nc-s-text") || {}).value || base.salaNombre || null,
            motivoTexto: base.motivoTexto,
            origen: base.origen,
          };
        }

        function recursosLineForFormPrint() {
          var byId = {};
          (scope.recursos || []).forEach(function (r) {
            byId[String(r.id)] = r;
          });
          var ids = window.__hisCitasDraftRecursos || [];
          var parts = (ids || [])
            .map(function (rid) {
              var rr = byId[String(rid)];
              return rr ? rr.nombre || rr.codigo || "" : "";
            })
            .filter(function (x) {
              return !!x;
            });
          return parts.length ? parts.join(", ") : "—";
        }

        var html = '<div class="esp-split-layout">';
        html += '<div class="esp-tree-panel dyn-card">';
        html += '<div class="esp-tree-toolbar citas-page-toolbar">';
        html += '<div class="citas-toolbar-fechas">';
        html += '<div class="dyn-field citas-toolbar-field"><label for="citas-fecha-desde">Desde</label>';
        html +=
          '<input type="date" id="citas-fecha-desde" class="esp-form-input" value="' +
          escapeHtml(String(window.__hisCitasFechaDesde || "")) +
          '" /></div>';
        html += '<div class="dyn-field citas-toolbar-field"><label for="citas-fecha-hasta">Hasta</label>';
        html +=
          '<input type="date" id="citas-fecha-hasta" class="esp-form-input" value="' +
          escapeHtml(String(window.__hisCitasFechaHasta || "")) +
          '" /></div>';
        html += '<button type="button" class="btn-fluent" id="citas-buscar">Buscar</button>';
        html += "</div>";
        html += '<div class="citas-toolbar-actions">';
        html += '<div class="esp-tree-search-wrap citas-toolbar-search-wrap">';
        html += '<i class="fa-solid fa-magnifying-glass esp-tree-search-ico" aria-hidden="true"></i>';
        html +=
          '<input type="search" id="citas-search" class="esp-tree-search-input" placeholder="Tras buscar: paciente, especialista, expediente, estado, sala…" autocomplete="off" ' +
          (window.__hisCitasQueried ? "" : 'disabled="disabled" title="Primero pulse Buscar"') +
          " />";
        html += "</div>";
        html += '<button type="button" class="btn-fluent esp-tree-add-btn" id="citas-new">+ Agregar</button>';
        html += "</div></div>";
        html += '<div class="esp-tree-scroll"><table class="dyn-table esp-table-in-panel"><thead><tr><th>Inicio</th><th>Paciente</th><th>Especialista</th><th>Estado</th></tr></thead><tbody id="citas-table-body">';
        html += parts.rowsHtml + "</tbody></table></div>";
        html +=
          '<div class="esp-staff-pagination" id="citas-pagination"><span id="citas-page-summary">' +
          escapeHtml(parts.summaryText) +
          '</span><span id="citas-page-nav-wrap">' +
          parts.pagerHtml +
          "</span></div></div>";
        html += '<div class="esp-form-panel dyn-card" id="citas-form-panel">' + buildFormPanel() + "</div></div>";
        container.innerHTML = html;

        var dPref = document.getElementById("nc-d");
        var hPref = document.getElementById("nc-h");
        var nPref = document.getElementById("nc-n");
        if (dPref && window.__hisCitasPrefillFecha) {
          dPref.value = window.__hisCitasPrefillFecha;
          window.__hisCitasPrefillFecha = "";
        }
        if (hPref && window.__hisCitasPrefillHora) {
          hPref.value = window.__hisCitasPrefillHora;
          window.__hisCitasPrefillHora = "";
        }
        if (sel.kind === "edit" && sel.id != null) {
          var editCita = filtered.find(function (x) {
            return x.id === sel.id;
          });
          if (editCita && editCita.inicioTs) {
            var editDate = new Date(editCita.inicioTs);
            if (!isNaN(editDate.getTime())) {
              dPref.value = editDate.toISOString().slice(0, 10);
              var hh = String(editDate.getHours()).padStart(2, "0");
              var mm = String(editDate.getMinutes()).padStart(2, "0");
              hPref.value = hh + ":" + mm;
            }
          }
          if (nPref && window.__hisCitasDraftNotas != null) {
            nPref.value = String(window.__hisCitasDraftNotas || "");
          }
        }

        var fDesde = document.getElementById("citas-fecha-desde");
        var fHasta = document.getElementById("citas-fecha-hasta");
        var btnBuscar = document.getElementById("citas-buscar");
        if (btnBuscar) {
          btnBuscar.onclick = function () {
            if (fDesde && fDesde.value) {
              window.__hisCitasFechaDesde = fDesde.value;
            }
            if (fHasta && fHasta.value) {
              window.__hisCitasFechaHasta = fHasta.value;
            }
            window.__hisCitasQueried = true;
            window.__hisCitasApiPage = 0;
            renderCitas(container);
          };
        }
        var searchEl = document.getElementById("citas-search");
        if (searchEl) {
          searchEl.value = window.__hisCitasSearch || "";
          var searchT = null;
          searchEl.addEventListener("input", function () {
            window.__hisCitasSearch = searchEl.value;
            if (!window.__hisCitasQueried) {
              return;
            }
            window.__hisCitasApiPage = 0;
            if (searchT) {
              clearTimeout(searchT);
            }
            searchT = setTimeout(function () {
              refreshCitasListData();
            }, 400);
          });
        }
        wireCitasPager();

        var btnNew = document.getElementById("citas-new");
        if (btnNew) {
          btnNew.onclick = function () {
            window.__hisCitasDraftPac = null;
            window.__hisCitasDraftEsp = null;
            window.__hisCitasDraftSala = null;
            window.__hisCitasDraftTipo = null;
            window.__hisCitasDraftEstado = "PROGRAMADA";
            window.__hisCitasDraftNotas = "";
            window.__hisCitasDraftRecursos = [];
            window.__hisCitasSel = { kind: "new" };
            renderCitas(container);
          };
        }

        var btnCancel = document.getElementById("nc-cancel");
        if (btnCancel) {
          btnCancel.onclick = function () {
            window.__hisCitasSel = { kind: "none" };
            window.__hisCitasDraftPac = null;
            window.__hisCitasDraftEsp = null;
            window.__hisCitasDraftSala = null;
            window.__hisCitasDraftTipo = null;
            window.__hisCitasDraftEstado = "PROGRAMADA";
            window.__hisCitasDraftNotas = "";
            window.__hisCitasDraftRecursos = [];
            renderCitas(container);
          };
        }

        var btnPrint = document.getElementById("nc-print");
        if (btnPrint) {
          btnPrint.onclick = function () {
            if (sel.kind !== "edit" || sel.id == null) {
              return;
            }
            var pl = window.__hisCitasPageList || [];
            var base = pl.find(function (x) {
              return x.id === sel.id;
            });
            if (!base) {
              notify("No se encontraron los datos de la cita para imprimir.", "warning");
              return;
            }
            var merged = citaSnapshotForFormPrint(base);
            printCitaComprobanteAgenda(merged, { recursosLine: recursosLineForFormPrint() });
          };
        }

        bindCitasDblClick(filtered);

        var btnPickPaciente = document.getElementById("nc-p-pick");
        if (btnPickPaciente) {
          btnPickPaciente.onclick = function () {
            citaModalOpenPatientSearchPicker(function (paciente) {
              var txt = document.getElementById("nc-p-text");
              var hid = document.getElementById("nc-p-id");
              var name = ((paciente.nombres || "") + " " + (paciente.apellidos || "")).trim();
              if (txt) txt.value = name;
              if (hid) hid.value = String(paciente.id);
              window.__hisCitasDraftPac = { id: paciente.id, nombre: name };
            });
          };
        }

        var btnPickEsp = document.getElementById("nc-e-pick");
        if (btnPickEsp) {
          btnPickEsp.onclick = function () {
            citaModalOpenEspecialistaPorEspecialidad(scope.especialistas || [], function (esp) {
              var txt = document.getElementById("nc-e-text");
              var hid = document.getElementById("nc-e-id");
              var name = ((esp.nombres || "") + " " + (esp.apellidos || "")).trim();
              if (txt) txt.value = name;
              if (hid) hid.value = String(esp.id);
              window.__hisCitasDraftEsp = { id: esp.id, nombre: name };
            });
          };
        }

        var btnPickSala = document.getElementById("nc-s-pick");
        if (btnPickSala) {
          btnPickSala.onclick = function () {
            openSalaPicker(scope.salas || [], function (sala) {
              var txt = document.getElementById("nc-s-text");
              var hid = document.getElementById("nc-s-id");
              var name = sala.nombre || sala.codigo || "";
              if (txt) txt.value = name;
              if (hid) hid.value = String(sala.id);
              window.__hisCitasDraftSala = { id: sala.id, nombre: name };
            });
          };
        }

        var btnPickTipo = document.getElementById("nc-t-pick");
        if (btnPickTipo) {
          btnPickTipo.onclick = function () {
            openTipoPicker(scope.tiposCita || [], function (tipo) {
              var txt = document.getElementById("nc-t-text");
              var hid = document.getElementById("nc-t-id");
              var name = tipo.nombre || tipo.codigo || "";
              if (txt) txt.value = name;
              if (hid) hid.value = String(tipo.id);
              window.__hisCitasDraftTipo = { id: tipo.id, nombre: name };
            });
          };
        }

        var btnPickRecursos = document.getElementById("nc-r-pick");
        if (btnPickRecursos) {
          btnPickRecursos.onclick = function () {
            openRecursosPicker(scope.recursos || [], window.__hisCitasDraftRecursos || [], function (ids) {
              window.__hisCitasDraftRecursos = ids || [];
              var byId = {};
              (scope.recursos || []).forEach(function (r) {
                byId[String(r.id)] = r;
              });
              var names = (ids || [])
                .map(function (id) {
                  var rr = byId[String(id)];
                  return rr ? rr.nombre || rr.codigo || "" : "";
                })
                .filter(function (x) {
                  return !!x;
                });
              var txt = document.getElementById("nc-r-text");
              if (txt) txt.value = names.join(", ");
            });
          };
        }

        var btnCreate = document.getElementById("nc-go");
        if (btnCreate) {
          btnCreate.onclick = function () {
            var pacienteId = parseInt((document.getElementById("nc-p-id") || {}).value, 10);
            var especialistaId = parseInt((document.getElementById("nc-e-id") || {}).value, 10);
            var salaId = parseInt((document.getElementById("nc-s-id") || {}).value, 10);
            var dVal = (document.getElementById("nc-d") || {}).value;
            var hVal = (document.getElementById("nc-h") || {}).value;
            var notas = document.getElementById("nc-n").value || null;
            var estadoVal = String((document.getElementById("nc-estado") || {}).value || "PROGRAMADA").trim();
            if (!dVal || !hVal) {
              notify("Indique fecha y hora de inicio", "warning");
              return;
            }
            if (isNaN(pacienteId)) {
              notify("Seleccione un paciente", "warning");
              return;
            }
            if (isNaN(especialistaId)) {
              notify("Seleccione un especialista", "warning");
              return;
            }
            var hp = String(hVal).split(":");
            var timeLocal = hp.length >= 3 ? hVal : hVal + ":00";
            var inicio = new Date(dVal + "T" + timeLocal).toISOString();
            var tipoId = parseInt((document.getElementById("nc-t-id") || {}).value, 10);
            var postBody = {
              pacienteId: pacienteId,
              especialistaId: especialistaId,
              inicio: inicio,
              notas: notas,
            };
            if (estadoVal) postBody.estadoCodigo = estadoVal;
            if (!isNaN(tipoId)) postBody.tipoCitaCatalogoId = tipoId;
            if (!isNaN(salaId)) postBody.salaId = salaId;
            var recursosIds = (window.__hisCitasDraftRecursos || [])
              .map(function (rid) {
                return parseInt(rid, 10);
              })
              .filter(function (rid) {
                return !isNaN(rid);
              });
            var recursosByIdForPrint = {};
            (scope.recursos || []).forEach(function (r) {
              recursosByIdForPrint[r.id] = r;
            });
            var recursosLinePrint = recursosIds
              .map(function (rid) {
                var rr = recursosByIdForPrint[rid];
                return rr ? rr.nombre || rr.codigo || "" : "";
              })
              .filter(function (x) {
                return !!x;
              })
              .join(", ");
            if (!recursosLinePrint) {
              recursosLinePrint = "—";
            }
            function syncRecursos(citaId) {
              return apiJson("/api/appointments/" + citaId + "/vinculos")
                .then(function (existing) {
                  var current = (existing || []).filter(function (v) {
                    return String(v.tipoVinculo || "").toUpperCase() === "RECURSO";
                  });
                  var currentIds = current.map(function (v) {
                    return parseInt(v.refId, 10);
                  });
                  var toDelete = current.filter(function (v) {
                    return recursosIds.indexOf(parseInt(v.refId, 10)) < 0;
                  });
                  var toAdd = recursosIds.filter(function (rid) {
                    return currentIds.indexOf(rid) < 0;
                  });
                  var recursosById = {};
                  (scope.recursos || []).forEach(function (r) {
                    recursosById[r.id] = r;
                  });
                  var delCalls = toDelete.map(function (v) {
                    return apiJson("/api/appointments/" + citaId + "/vinculos/" + v.id, { method: "DELETE" });
                  });
                  var addCalls = toAdd.map(function (rid) {
                    var rr = recursosById[rid];
                    return apiJson("/api/appointments/" + citaId + "/vinculos", {
                      method: "POST",
                      body: { tipoVinculo: "RECURSO", refId: rid, descripcion: rr ? rr.nombre : "" },
                    });
                  });
                  return Promise.all(delCalls.concat(addCalls));
                })
                .catch(function () {
                  return null;
                });
            }
            var isEdit = sel.kind === "edit" && sel.id != null;
            var endpoint = isEdit ? "/api/appointments/" + sel.id : "/api/appointments";
            var method = isEdit ? "PATCH" : "POST";
            apiJson(endpoint, { method: method, body: postBody })
              .then(function (saved) {
                var citaId = saved && saved.id != null ? saved.id : sel.id;
                if (citaId == null) return Promise.resolve(null);
                return syncRecursos(citaId).then(function () {
                  if (isEdit) {
                    var plEd = window.__hisCitasPageList || [];
                    var actual = plEd.find(function (x) {
                      return x.id === sel.id;
                    });
                    var beforeEstado = actual ? String(actual.estado || "PROGRAMADA") : "PROGRAMADA";
                    if (estadoVal && estadoVal !== beforeEstado) {
                      return apiFetch("/api/appointments/" + citaId + "/estado", {
                        method: "PATCH",
                        body: { estadoCodigo: estadoVal },
                      }).then(function (res) {
                        if (!res.ok) throw new Error("No se pudo actualizar estado");
                        return saved;
                      });
                    }
                  }
                  return saved;
                });
              })
              .then(function (saved) {
                notify(isEdit ? "Cita actualizada correctamente" : "Cita creada correctamente", "success");
                if (!isEdit && saved) {
                  printCitaComprobanteAgenda(saved, { recursosLine: recursosLinePrint });
                }
                window.__hisCitasSel = { kind: "none" };
                window.__hisCitasDraftPac = null;
                window.__hisCitasDraftEsp = null;
                window.__hisCitasDraftSala = null;
                window.__hisCitasDraftTipo = null;
                window.__hisCitasDraftNotas = "";
                window.__hisCitasDraftRecursos = [];
                window.__hisCitasQueried = true;
                window.__hisCitasApiPage = 0;
                renderCitas(container);
              })
              .catch(function (e) {
                notify(e.message, "error");
              });
          };
        }
      }

      if (!window.__hisCitasQueried) {
        mountCitasFromPageResult(null);
        return Promise.resolve();
      }
      var dIsoC = repHistLocalDateStartIso(window.__hisCitasFechaDesde);
      var hIsoC = repHistLocalDateEndExclusiveIso(window.__hisCitasFechaHasta);
      var listUrlC =
        "/api/appointments/page?desde=" +
        encodeURIComponent(dIsoC) +
        "&hasta=" +
        encodeURIComponent(hIsoC) +
        "&page=" +
        window.__hisCitasApiPage +
        "&size=" +
        CITAS_PAGE_SIZE +
        "&sort=inicioTs,desc";
      if (searchQ) {
        listUrlC += "&q=" + encodeURIComponent(searchQ);
      }
      return apiJson(listUrlC).then(mountCitasFromPageResult);
    });
  }

  function renderRecursos(container) {
    container.innerHTML = hisLoadingBlock("Cargando recursos…", "his-loading--page");
    var sel = window.__hisRecursosSel || { kind: "none" };
    var PAGE_SIZE = 10;

    function pagerHtml(page, totalPages, key) {
      if (totalPages <= 1) return "";
      return (
        '<div class="esp-staff-page-nav">' +
        '<button type="button" class="esp-staff-page-btn rec-page-btn" data-key="' +
        key +
        '" data-dir="prev" ' +
        (page <= 1 ? "disabled" : "") +
        ">‹</button>" +
        "<span>Página " +
        page +
        " de " +
        totalPages +
        "</span>" +
        '<button type="button" class="esp-staff-page-btn rec-page-btn" data-key="' +
        key +
        '" data-dir="next" ' +
        (page >= totalPages ? "disabled" : "") +
        ">›</button></div>"
      );
    }

    function buildCatalogForm(allCatalog) {
      if (sel.kind === "edit" && sel.id != null) {
        var cur = allCatalog.find(function (x) {
          return x.id === sel.id;
        });
        if (!cur) sel = { kind: "none" };
        else {
          return (
            '<div class="esp-form-header"><span class="esp-form-kicker">Catálogo de recursos</span><h3 class="esp-form-title">Editar recurso</h3></div>' +
            '<div class="esp-form-body esp-form-body--with-footer"><div class="esp-form-main"><div class="esp-form-grid esp-form-grid--edit">' +
            '<div class="dyn-field"><label>Código</label><input id="rec-codigo" class="esp-form-input" value="' +
            escapeHtml(cur.codigo || "") +
            '" /></div>' +
            '<div class="dyn-field"><label>Nombre</label><input id="rec-nombre" class="esp-form-input" value="' +
            escapeHtml(cur.nombre || "") +
            '" /></div>' +
            '<div class="esp-status-row esp-form-grid-span2"><span class="esp-status-label" id="rec-activo-caption">Activo</span>' +
            '<div class="esp-switch" title="Estado del recurso"><input type="checkbox" id="rec-activo" class="esp-switch-input" ' +
            (cur.activo ? "checked " : "") +
            'role="switch" aria-labelledby="rec-activo-caption" />' +
            '<label for="rec-activo" class="esp-switch-track"><span class="esp-switch-thumb"></span></label></div></div>' +
            "</div></div>" +
            '<div class="esp-form-actions esp-form-actions--footer"><button type="button" class="btn-fluent esp-form-primary" id="rec-save" data-mode="edit" data-id="' +
            cur.id +
            '">Guardar</button><button type="button" class="btn-fluent esp-form-btn-cancel" id="rec-cancel">Cancelar</button></div></div>'
          );
        }
      }
      return (
        '<div class="esp-form-header"><span class="esp-form-kicker">Catálogo de recursos</span><h3 class="esp-form-title">Nuevo recurso</h3></div>' +
        '<div class="esp-form-body esp-form-body--with-footer"><div class="esp-form-main"><div class="esp-form-grid esp-form-grid--edit">' +
        '<div class="dyn-field"><label>Código</label><input id="rec-codigo" class="esp-form-input" placeholder="EQUIPO_NUEVO" /></div>' +
        '<div class="dyn-field"><label>Nombre</label><input id="rec-nombre" class="esp-form-input" placeholder="Nombre del recurso" /></div>' +
        "</div></div>" +
        '<div class="esp-form-actions esp-form-actions--footer"><button type="button" class="btn-fluent esp-form-primary" id="rec-save" data-mode="new">Guardar</button><button type="button" class="btn-fluent esp-form-btn-cancel" id="rec-cancel">Cancelar</button></div></div>'
      );
    }

    return Promise.all([
      loadScopeData(),
      apiJson("/api/catalog/recursos").catch(function () {
        return [];
      }),
    ]).then(function (arr) {
      var scope = arr[0] || {};
      var catalogoRecursos = arr[1] || [];
      var now = Date.now();
      var tabSelected = null;
      var citas = [];
      var reservas = [];
      var vinculosByCitaId = {};
      var resumenSalas = [];
      var resumenRecursos = [];
      var recTabDataCargada = false;
      var recursoById = {};
      catalogoRecursos.forEach(function (r) {
        recursoById[r.id] = r;
      });
      var activeTab = "recursos";
      window.__hisRecTab = "recursos";

      /** Rango acotado para el panel: menos datos y una sola petición al servidor. */
      function periodoCitasRecurso() {
        return {
          desde: new Date(now - 45 * 24 * 60 * 60 * 1000).toISOString(),
          hasta: new Date(now + 90 * 24 * 60 * 60 * 1000).toISOString(),
        };
      }

      function rebuildFromPanelCitas(citasList) {
        vinculosByCitaId = {};
        var nowTs = Date.now();
        var item = catalogoRecursos.find(function (x) {
          return x.id === tabSelected.recursoId;
        });
        citas = citasList || [];
        reservas = (citasList || [])
          .map(function (c) {
            return {
              id: c.id,
              inicioTs: c.inicioTs,
              finTs: c.finTs,
              pacienteNombre: c.pacienteNombre || "—",
              especialistaNombre: c.especialistaNombre || "—",
              salaNombre: c.salaNombre || "—",
              salaId: c.salaId,
              recursoIds: tabSelected.tipo === "INMUEBLE" ? [] : [tabSelected.recursoId],
            };
          })
          .sort(function (a, b) {
            return new Date(a.inicioTs).getTime() - new Date(b.inicioTs).getTime();
          });
        if (tabSelected.tipo === "INMUEBLE") {
          var s = (scope.salas || []).find(function (x) {
            return x.id === tabSelected.salaId;
          });
          var nombreSala = s ? s.nombre || s.codigo || "—" : "—";
          var citasSala = reservas;
          var activasAhora = citasSala.some(function (r) {
            return new Date(r.inicioTs).getTime() <= nowTs && new Date(r.finTs).getTime() > nowTs;
          });
          var proximaS = citasSala.find(function (r) {
            return new Date(r.inicioTs).getTime() >= nowTs;
          });
          resumenSalas = [
            {
              id: tabSelected.salaId,
              codigo: s ? s.codigo || "" : "",
              nombre: nombreSala,
              totalReservas: citasSala.length,
              disponibilidad: activasAhora ? "Ocupada" : "Disponible",
              proximaReserva: proximaS ? fmtInstant(proximaS.inicioTs) : "Sin reservas próximas",
            },
          ];
          resumenRecursos = [];
        } else {
          resumenSalas = [];
          var cr = reservas;
          var proximaR = cr.find(function (x) {
            return new Date(x.inicioTs).getTime() >= nowTs;
          });
          resumenRecursos = [
            {
              id: item ? item.id : tabSelected.recursoId,
              codigo: item ? item.codigo || "—" : "—",
              nombre: item ? item.nombre || "—" : "—",
              totalReservas: cr.length,
              proximaReserva: proximaR ? fmtInstant(proximaR.inicioTs) : "Sin reservas próximas",
            },
          ];
        }
        recTabDataCargada = true;
      }

      function fetchPestanaData() {
        var p = periodoCitasRecurso();
        var url =
          "/api/appointments/panel-recurso?desde=" +
          encodeURIComponent(p.desde) +
          "&hasta=" +
          encodeURIComponent(p.hasta) +
          "&";
        if (tabSelected.tipo === "INMUEBLE") {
          url += "salaId=" + encodeURIComponent(String(tabSelected.salaId));
        } else {
          url += "refId=" + encodeURIComponent(String(tabSelected.recursoId));
        }
        return apiJson(url).then(function (list) {
          rebuildFromPanelCitas(list);
        });
      }

      var html = "";
      html += '<div class="rec-page-root">';
      html += '<div class="rec-page-intro dyn-card">';
      html += '<h3 class="text-base font-semibold text-ocean-900">Recursos, disponibilidad y reservas</h3>';
      html += '<p class="dyn-muted text-sm mt-1">Doble clic: disponibilidad y reservas. Icono de lápiz: editar catálogo.</p>';
      html += "</div>";
      html += '<div class="rec-tabs-wrap">';
      html += '<div class="esp-tabstrip" role="tablist" aria-label="Secciones de recursos">';
      html +=
        '<button type="button" id="rec-tab-recursos" class="esp-tab" role="tab" aria-selected="true"><i class="fa-solid fa-boxes-stacked" aria-hidden="true"></i><span>Recursos</span></button>';
      html +=
        '<button type="button" id="rec-tab-detalle" class="esp-tab" style="display:none" role="tab" aria-selected="false"><i class="fa-solid fa-gauge-high" aria-hidden="true"></i><span id="rec-tab-detalle-lbl" class="esp-tab-label">Accesibilidad</span></button>';
      html +=
        '<button type="button" id="rec-tab-reservas" class="esp-tab" style="display:none" role="tab" aria-selected="false"><i class="fa-solid fa-calendar-check" aria-hidden="true"></i><span>Reservaciones de salas y recursos</span></button>';
      html += "</div></div>";

      html += '<div class="rec-page-panels">';
      html += '<div id="rec-panel-recursos" class="rec-page-panel" style="display:flex;flex-direction:column">';
      html += '<div class="esp-split-layout rec-esp-split">';
      html += '<div class="esp-tree-panel dyn-card"><div class="esp-tree-toolbar"><div class="esp-tree-search-wrap"><i class="fa-solid fa-magnifying-glass esp-tree-search-ico" aria-hidden="true"></i><input type="search" id="rec-search" class="esp-tree-search-input" placeholder="Buscar por nombre de recurso…" autocomplete="off" /></div><button type="button" class="btn-fluent esp-tree-add-btn" id="rec-new">+ Agregar</button></div>';
      html += '<div class="esp-tree-scroll"><table class="dyn-table esp-table-in-panel rec-catalog-table"><thead><tr><th>Nombre</th><th class="rec-col-edit-th"></th></tr></thead><tbody id="rec-catalog-body"></tbody></table></div>';
      html += '<div class="esp-staff-pagination"><span id="rec-catalog-summary">Sin registros</span><span id="rec-catalog-pager"></span></div></div>';
      html += '<div class="esp-form-panel dyn-card" id="rec-form-panel">' + buildCatalogForm(catalogoRecursos) + "</div></div>";
      html += "</div>";

      html += '<div id="rec-panel-detalle" class="rec-page-panel" style="display:none">';
      html += '<div class="dyn-card rec-panel-card"><h4 id="rec-detail-title" class="font-semibold text-ocean-900 mb-2">Detalle</h4>';
      html += '<div class="esp-tree-search-wrap" style="margin-bottom:8px"><i class="fa-solid fa-magnifying-glass esp-tree-search-ico" aria-hidden="true"></i><input type="search" id="rec-detail-search" class="esp-tree-search-input" placeholder="Buscar…" autocomplete="off" /></div>';
      html += '<div class="dyn-table-wrap rec-panel-table-wrap"><table class="dyn-table"><thead id="rec-detail-head"></thead><tbody id="rec-detail-body"></tbody></table></div>';
      html += '<div class="esp-staff-pagination"><span id="rec-detail-summary">Sin registros</span><span id="rec-detail-pager"></span></div></div></div>';

      html += '<div id="rec-panel-reservas" class="rec-page-panel" style="display:none">';
      html += '<div class="dyn-card rec-panel-card"><h4 class="font-semibold text-ocean-900 mb-2">Reservaciones de salas y recursos</h4>';
      html += '<div class="esp-tree-search-wrap" style="margin-bottom:8px"><i class="fa-solid fa-magnifying-glass esp-tree-search-ico" aria-hidden="true"></i><input type="search" id="rec-reservas-search" class="esp-tree-search-input" placeholder="Buscar por fecha, paciente, especialista, sala…" autocomplete="off" /></div>';
      html += '<div class="dyn-table-wrap rec-panel-table-wrap"><table class="dyn-table"><thead><tr><th>Inicio</th><th>Paciente</th><th>Especialista</th><th>Sala</th></tr></thead><tbody id="rec-reservas-body"></tbody></table></div>';
      html += '<div class="esp-staff-pagination"><span id="rec-reservas-summary">Sin registros</span><span id="rec-reservas-pager"></span></div></div></div>';

      html += "</div></div>";

      container.innerHTML = html;

      function activateTab(tabId) {
        activeTab = tabId;
        window.__hisRecTab = tabId;
        ["recursos", "detalle", "reservas"].forEach(function (id) {
          var p = document.getElementById("rec-panel-" + id);
          var b = document.getElementById("rec-tab-" + id);
          if (p) {
            if (id === tabId) {
              p.style.display = "flex";
              p.style.flexDirection = "column";
            } else {
              p.style.display = "none";
            }
          }
          if (b) {
            b.classList.toggle("is-active", id === tabId);
            b.classList.toggle("esp-form-primary", id === tabId);
            b.setAttribute("aria-selected", id === tabId ? "true" : "false");
          }
        });
      }

      function bindPagerButtons() {
        container.querySelectorAll(".rec-page-btn").forEach(function (btn) {
          btn.onclick = function () {
            var key = btn.getAttribute("data-key");
            var dir = btn.getAttribute("data-dir");
            var delta = dir === "next" ? 1 : -1;
            if (key === "catalogo") {
              window.__hisRecCatalogPage = (parseInt(window.__hisRecCatalogPage || "1", 10) || 1) + delta;
              renderCatalogTable();
            }
            if (key === "detalle") {
              window.__hisRecDetailPage = (parseInt(window.__hisRecDetailPage || "1", 10) || 1) + delta;
              renderDetailTable();
            }
            if (key === "reservas") {
              window.__hisRecReservasPage = (parseInt(window.__hisRecReservasPage || "1", 10) || 1) + delta;
              renderReservasTable();
            }
          };
        });
      }

      function renderCatalogTable() {
        var q = String(window.__hisRecursosSearch || "").trim().toLowerCase();
        var page = parseInt(window.__hisRecCatalogPage || "1", 10);
        var filtered = catalogoRecursos.filter(function (r) {
          if (!q) return true;
          return String(r.nombre || "")
            .toLowerCase()
            .indexOf(q) >= 0;
        });
        var total = filtered.length;
        var totalPages = total === 0 ? 1 : Math.ceil(total / PAGE_SIZE);
        if (!Number.isFinite(page) || page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        window.__hisRecCatalogPage = page;
        var startIdx = (page - 1) * PAGE_SIZE;
        var rows = filtered.slice(startIdx, startIdx + PAGE_SIZE);
        var body = "";
        rows.forEach(function (r) {
          body +=
            '<tr data-rid="' +
            r.id +
            '" title="Doble clic: disponibilidad y reservas de este recurso"><td class="rec-name-cell">' +
            escapeHtml(r.nombre || "—") +
            '</td><td class="rec-col-edit"><button type="button" class="btn-fluent btn-fluent-secondary rec-row-edit" data-rid="' +
            r.id +
            '" title="Editar" aria-label="Editar"><i class="fa-solid fa-pen-to-square" aria-hidden="true"></i></button></td></tr>';
        });
        if (!body) body = '<tr><td colspan="2" class="dyn-muted" style="padding:12px">Sin recursos para mostrar.</td></tr>';
        var bodyEl = document.getElementById("rec-catalog-body");
        bodyEl.innerHTML = body;
        document.getElementById("rec-catalog-summary").textContent =
          total === 0 ? "Sin registros" : startIdx + 1 + "–" + Math.min(startIdx + PAGE_SIZE, total) + " de " + total;
        document.getElementById("rec-catalog-pager").innerHTML = pagerHtml(page, totalPages, "catalogo");
        bodyEl.querySelectorAll("tr[data-rid]").forEach(function (tr) {
          tr.ondblclick = function () {
            if (tr.getAttribute("data-locked") === "1") return;
            var id = parseInt(tr.getAttribute("data-rid"), 10);
            var item = catalogoRecursos.find(function (x) {
              return x.id === id;
            });
            if (!item) return;
            var salaMatch = (scope.salas || []).find(function (s) {
              return (
                String(s.codigo || "").toUpperCase() === String(item.codigo || "").toUpperCase() ||
                String(s.nombre || "").toUpperCase() === String(item.nombre || "").toUpperCase()
              );
            });
            var tipo = salaMatch ? "INMUEBLE" : "RECURSO_ACTIVO";
            tabSelected = {
              id: item.id,
              codigo: item.codigo,
              nombre: item.nombre,
              tipo: tipo,
              salaId: salaMatch ? salaMatch.id : null,
              recursoId: item.id,
            };
            recTabDataCargada = false;
            window.__hisRecDetailPage = 1;
            window.__hisRecReservasPage = 1;
            window.__hisRecDetailSearch = "";
            window.__hisRecReservasSearch = "";
            tr.setAttribute("data-locked", "1");
            fetchPestanaData()
              .then(function () {
                tr.removeAttribute("data-locked");
                var hasReserva = reservas.some(function (rv) {
                  return tabSelected.tipo === "INMUEBLE"
                    ? rv.salaId === tabSelected.salaId
                    : (rv.recursoIds || []).indexOf(tabSelected.recursoId) >= 0;
                });
                if (hasReserva) activateTab("reservas");
                else activateTab("detalle");
                renderDetailTable();
                renderReservasTable();
                syncTabButtons();
              })
              .catch(function (e) {
                tr.removeAttribute("data-locked");
                tabSelected = null;
                recTabDataCargada = false;
                notify((e && e.message) || "No se pudieron cargar las reservas", "error");
                syncTabButtons();
                renderDetailTable();
                renderReservasTable();
              });
          };
        });
        bodyEl.querySelectorAll(".rec-row-edit").forEach(function (btn) {
          btn.onclick = function (e) {
            e.stopPropagation();
            e.preventDefault();
            var id = parseInt(btn.getAttribute("data-rid"), 10);
            if (isNaN(id)) return;
            window.__hisRecursosSel = { kind: "edit", id: id };
            window.__hisRecTab = "recursos";
            renderRecursos(container);
          };
        });
        bindPagerButtons();
      }

      function renderDetailTable() {
        var headEl = document.getElementById("rec-detail-head");
        var bodyEl = document.getElementById("rec-detail-body");
        var summaryEl = document.getElementById("rec-detail-summary");
        var pagerEl = document.getElementById("rec-detail-pager");
        var titleEl = document.getElementById("rec-detail-title");
        var searchEl = document.getElementById("rec-detail-search");
        if (!recTabDataCargada) {
          headEl.innerHTML = "<tr><th>Detalle</th></tr>";
          bodyEl.innerHTML =
            '<tr><td colspan="4" class="dyn-muted" style="padding:12px">Doble clic en un recurso de la lista. Los datos de disponibilidad y reservas se cargan solo al abrirlo.</td></tr>';
          summaryEl.textContent = "Sin registros";
          pagerEl.innerHTML = "";
          if (titleEl) titleEl.textContent = "Detalle";
          if (searchEl) searchEl.placeholder = "Buscar…";
          return;
        }
        if (!tabSelected) {
          headEl.innerHTML = "<tr><th>Detalle</th></tr>";
          bodyEl.innerHTML = '<tr><td colspan="4" class="dyn-muted" style="padding:12px">Seleccione un recurso con doble clic.</td></tr>';
          summaryEl.textContent = "Sin registros";
          pagerEl.innerHTML = "";
          if (titleEl) titleEl.textContent = "Detalle";
          if (searchEl) searchEl.placeholder = "Buscar…";
          return;
        }
        var q = String(window.__hisRecDetailSearch || "").trim().toLowerCase();
        var page = parseInt(window.__hisRecDetailPage || "1", 10);
        var rows = [];
        if (tabSelected.tipo === "INMUEBLE") {
          var salasRows = resumenSalas.filter(function (s) {
            return s.id === tabSelected.salaId;
          });
          rows = salasRows.map(function (s) {
            return {
              c1: s.nombre,
              c2: String(s.totalReservas),
              c3: s.disponibilidad,
              c4: s.proximaReserva,
            };
          });
          headEl.innerHTML = "<tr><th>Sala</th><th>Reservas</th><th>Estado actual</th><th>Próxima reserva</th></tr>";
          if (titleEl) titleEl.textContent = "Accesibilidad de salas";
          if (searchEl) searchEl.placeholder = "Buscar sala, estado o próxima reserva…";
        } else {
          var recRows = resumenRecursos.filter(function (r) {
            return r.id === tabSelected.recursoId;
          });
          rows = recRows.map(function (r) {
            return {
              c1: r.codigo,
              c2: r.nombre,
              c3: String(r.totalReservas),
              c4: r.proximaReserva,
            };
          });
          headEl.innerHTML = "<tr><th>Código</th><th>Recurso</th><th>Reservas</th><th>Próxima reserva</th></tr>";
          if (titleEl) titleEl.textContent = "Accesibilidad de recursos activos";
          if (searchEl) searchEl.placeholder = "Buscar código, recurso o próxima reserva…";
        }
        var filtered = rows.filter(function (r) {
          if (!q) return true;
          var bag = (r.c1 + " " + r.c2 + " " + r.c3 + " " + r.c4).toLowerCase();
          return bag.indexOf(q) >= 0;
        });
        var total = filtered.length;
        var totalPages = total === 0 ? 1 : Math.ceil(total / PAGE_SIZE);
        if (!Number.isFinite(page) || page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        window.__hisRecDetailPage = page;
        var startIdx = (page - 1) * PAGE_SIZE;
        var slice = filtered.slice(startIdx, startIdx + PAGE_SIZE);
        var body = "";
        slice.forEach(function (r) {
          body +=
            "<tr><td>" +
            escapeHtml(r.c1) +
            "</td><td>" +
            escapeHtml(r.c2) +
            "</td><td>" +
            escapeHtml(r.c3) +
            "</td><td>" +
            escapeHtml(r.c4) +
            "</td></tr>";
        });
        if (!body) body = '<tr><td colspan="4" class="dyn-muted" style="padding:12px">Sin registros.</td></tr>';
        bodyEl.innerHTML = body;
        summaryEl.textContent =
          total === 0 ? "Sin registros" : startIdx + 1 + "–" + Math.min(startIdx + PAGE_SIZE, total) + " de " + total;
        pagerEl.innerHTML = pagerHtml(page, totalPages, "detalle");
        bindPagerButtons();
      }

      function renderReservasTable() {
        if (!recTabDataCargada) {
          document.getElementById("rec-reservas-body").innerHTML =
            '<tr><td colspan="4" class="dyn-muted" style="padding:12px">Doble clic en un recurso de la lista. Las reservas se cargan al abrirlo.</td></tr>';
          document.getElementById("rec-reservas-summary").textContent = "Sin registros";
          document.getElementById("rec-reservas-pager").innerHTML = "";
          return;
        }
        var q = String(window.__hisRecReservasSearch || "").trim().toLowerCase();
        var page = parseInt(window.__hisRecReservasPage || "1", 10);
        var filteredBySelected = reservas.filter(function (r) {
          if (!tabSelected) return false;
          if (tabSelected.tipo === "INMUEBLE") return r.salaId === tabSelected.salaId;
          return (r.recursoIds || []).indexOf(tabSelected.recursoId) >= 0;
        });
        var filtered = filteredBySelected.filter(function (r) {
          if (!q) return true;
          var bag =
            String(fmtInstant(r.inicioTs) || "").toLowerCase() +
            " " +
            String(r.pacienteNombre || "").toLowerCase() +
            " " +
            String(r.especialistaNombre || "").toLowerCase() +
            " " +
            String(r.salaNombre || "").toLowerCase();
          return bag.indexOf(q) >= 0;
        });
        var total = filtered.length;
        var totalPages = total === 0 ? 1 : Math.ceil(total / PAGE_SIZE);
        if (!Number.isFinite(page) || page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        window.__hisRecReservasPage = page;
        var startIdx = (page - 1) * PAGE_SIZE;
        var slice = filtered.slice(startIdx, startIdx + PAGE_SIZE);
        var body = "";
        slice.forEach(function (r) {
          body +=
            '<tr data-cita-id="' +
            r.id +
            '"><td>' +
            escapeHtml(fmtInstant(r.inicioTs)) +
            "</td><td>" +
            escapeHtml(r.pacienteNombre) +
            "</td><td>" +
            escapeHtml(r.especialistaNombre) +
            "</td><td>" +
            escapeHtml(r.salaNombre || "—") +
            "</td></tr>";
        });
        if (!body) body = '<tr><td colspan="4" class="dyn-muted" style="padding:12px">Sin reservaciones para el recurso seleccionado.</td></tr>';
        document.getElementById("rec-reservas-body").innerHTML = body;
        document.getElementById("rec-reservas-summary").textContent =
          total === 0 ? "Sin registros" : startIdx + 1 + "–" + Math.min(startIdx + PAGE_SIZE, total) + " de " + total;
        document.getElementById("rec-reservas-pager").innerHTML = pagerHtml(page, totalPages, "reservas");
        var bodyEl = document.getElementById("rec-reservas-body");
        bodyEl.querySelectorAll("tr[data-cita-id]").forEach(function (tr) {
          tr.ondblclick = function () {
            var id = parseInt(tr.getAttribute("data-cita-id"), 10);
            if (isNaN(id)) return;
            var cita = reservas.find(function (x) {
              return x.id === id;
            });
            if (!cita) return;
            openCitaDetalleFromApi(cita, recursoById);
          };
        });
        bindPagerButtons();
      }

      function syncTabButtons() {
        var tabDetalle = document.getElementById("rec-tab-detalle");
        var tabReservas = document.getElementById("rec-tab-reservas");
        var detLbl = document.getElementById("rec-tab-detalle-lbl");
        if (!tabDetalle || !tabReservas) return;
        if (!tabSelected || !recTabDataCargada) {
          tabDetalle.style.display = "none";
          tabReservas.style.display = "none";
          if (activeTab !== "recursos") activateTab("recursos");
          return;
        }
        tabDetalle.style.display = "";
        tabReservas.style.display = "";
        if (detLbl) {
          detLbl.textContent =
            tabSelected.tipo === "INMUEBLE" ? "Accesibilidad de salas" : "Accesibilidad de recursos activos";
        }
        var hasReserva = reservas.some(function (r) {
          return tabSelected.tipo === "INMUEBLE"
            ? r.salaId === tabSelected.salaId
            : (r.recursoIds || []).indexOf(tabSelected.recursoId) >= 0;
        });
        if (!hasReserva && activeTab === "reservas") activateTab("detalle");
      }

          document.getElementById("rec-tab-recursos").onclick = function () {
            activateTab("recursos");
          };
          document.getElementById("rec-tab-detalle").onclick = function () {
            activateTab("detalle");
          };
          document.getElementById("rec-tab-reservas").onclick = function () {
            activateTab("reservas");
          };

          var searchCatalogEl = document.getElementById("rec-search");
          if (searchCatalogEl) {
            searchCatalogEl.value = window.__hisRecursosSearch || "";
            searchCatalogEl.oninput = function () {
              window.__hisRecursosSearch = searchCatalogEl.value || "";
              window.__hisRecCatalogPage = 1;
              renderCatalogTable();
            };
          }

          var searchDetailEl = document.getElementById("rec-detail-search");
          if (searchDetailEl) {
            searchDetailEl.value = window.__hisRecDetailSearch || "";
            searchDetailEl.oninput = function () {
              window.__hisRecDetailSearch = searchDetailEl.value || "";
              window.__hisRecDetailPage = 1;
              renderDetailTable();
            };
          }

          var searchReservasEl = document.getElementById("rec-reservas-search");
          if (searchReservasEl) {
            searchReservasEl.value = window.__hisRecReservasSearch || "";
            searchReservasEl.oninput = function () {
              window.__hisRecReservasSearch = searchReservasEl.value || "";
              window.__hisRecReservasPage = 1;
              renderReservasTable();
            };
          }

      var btnNew = document.getElementById("rec-new");
      if (btnNew) {
        btnNew.onclick = function () {
          window.__hisRecursosSel = { kind: "new" };
          window.__hisRecTab = "recursos";
          renderRecursos(container);
        };
      }

          var btnSave = document.getElementById("rec-save");
          if (btnSave) {
            btnSave.onclick = function () {
              var nombre = String((document.getElementById("rec-nombre") || {}).value || "").trim();
              var codigo = String((document.getElementById("rec-codigo") || {}).value || "").trim();
              if (!nombre) {
                notify("Debe indicar el nombre del recurso", "warning");
                return;
              }
              var mode = btnSave.getAttribute("data-mode");
              var req = { nombre: nombre, codigo: codigo || nombre };
              if (mode === "edit") {
                var id = parseInt(btnSave.getAttribute("data-id"), 10);
                if (isNaN(id)) return;
                var cur = catalogoRecursos.find(function (r) {
                  return r.id === id;
                });
                var activoEl = document.getElementById("rec-activo");
                req.activo = activoEl ? !!activoEl.checked : cur ? !!cur.activo : true;
                apiJson("/api/catalog/recursos/" + id, { method: "PATCH", body: req })
                  .then(function () {
                    notify("Recurso actualizado", "success");
                    window.__hisRecursosSel = { kind: "none" };
                    renderRecursos(container);
                  })
                  .catch(function (e) {
                    notify(e.message || "No se pudo actualizar", "error");
                  });
              } else {
                apiJson("/api/catalog/recursos", { method: "POST", body: req })
                  .then(function () {
                    notify("Recurso creado", "success");
                    window.__hisRecursosSel = { kind: "none" };
                    renderRecursos(container);
                  })
                  .catch(function (e) {
                    notify(e.message || "No se pudo crear", "error");
                  });
              }
            };
          }

          var btnCancel = document.getElementById("rec-cancel");
          if (btnCancel) {
            btnCancel.onclick = function () {
              window.__hisRecursosSel = { kind: "none" };
              renderRecursos(container);
            };
          }

      syncTabButtons();
      renderCatalogTable();
      renderDetailTable();
      renderReservasTable();
      activateTab("recursos");
    });
  }

  function renderPacientes(container) {
    container.innerHTML = hisLoadingBlock("Cargando pacientes…", "his-loading--page");
    var PAC_PAGE_SIZE = 8;
    var sel = window.__hisPacSel || { kind: "none" };
    var pageNum = window.__hisPacPage || 1;
    var searchQ = (window.__hisPacSearch || "").trim().toLowerCase();

    function patientFullName(p) {
      return ((p.nombres || "") + " " + (p.apellidos || "")).trim() || "—";
    }

    function requiredLabel(text) {
      return text + ' <span class="esp-form-req">*</span>';
    }

    function buildPacFormPanel(pEdit) {
      if (sel.kind === "new") {
        return (
          '<div class="esp-form-header">' +
          '<span class="esp-form-kicker">Nuevo registro</span>' +
          '<h3 class="esp-form-title">Alta de paciente</h3></div>' +
          '<div class="esp-form-body esp-form-body--with-footer"><div class="esp-form-main">' +
          '<div class="esp-form-grid esp-form-grid--edit">' +
          '<div class="dyn-field"><label>' + requiredLabel("Nombres") + '</label><input type="text" id="pac-nombres" class="esp-form-input" /></div>' +
          '<div class="dyn-field"><label>' + requiredLabel("Apellidos") + '</label><input type="text" id="pac-apellidos" class="esp-form-input" /></div>' +
          '<div class="dyn-field"><label>' + requiredLabel("N. expediente") + '</label><input type="text" id="pac-expediente" class="esp-form-input" /></div>' +
          '<div class="dyn-field"><label>' + requiredLabel("Fecha nacimiento") + '</label><input type="date" id="pac-fecha-nac" class="esp-form-input" /></div>' +
          '<div class="dyn-field"><label>' + requiredLabel("Teléfono") + '</label><input type="text" id="pac-telefono" class="esp-form-input" inputmode="numeric" maxlength="8" pattern="\\d{8}" placeholder="00000000" autocomplete="tel" /></div>' +
          '<div class="dyn-field"><label>' + requiredLabel("Sexo") + '</label><select id="pac-sexo" class="esp-form-input"><option value="">Seleccione…</option><option value="FEMENINO">Femenino</option><option value="MASCULINO">Masculino</option><option value="OTRO">Otro</option></select></div>' +
          '<div class="dyn-field esp-form-grid-span2"><label>' + requiredLabel("Dirección") + '</label><input type="text" id="pac-direccion" class="esp-form-input" /></div>' +
          '<div class="dyn-field esp-form-grid-span2"><label>' + requiredLabel("Responsable / Tutor") + '</label><input type="text" id="pac-responsable" class="esp-form-input" /></div>' +
          '<div class="dyn-field esp-form-grid-span2"><label>' + requiredLabel("Diagnóstico / Referencia") + '</label><textarea id="pac-diagnostico" class="esp-form-input" rows="2"></textarea></div>' +
          '<div class="dyn-field esp-form-grid-span2"><label>' + requiredLabel("Notas") + '</label><textarea id="pac-notas" class="esp-form-input" rows="2"></textarea></div>' +
          '<div class="dyn-field esp-form-grid-span2"><label>' + requiredLabel("Capacidades") + '</label><textarea id="pac-capacidades" class="esp-form-input" rows="2"></textarea></div>' +
          "</div></div>" +
          '<div class="esp-form-actions esp-form-actions--footer">' +
          '<button type="button" class="btn-fluent esp-form-primary" id="pac-save">Guardar</button>' +
          '<button type="button" class="btn-fluent esp-form-btn-cancel" id="pac-cancel">Cancelar</button></div></div>'
        );
      }

      if (sel.kind === "edit" && sel.id != null) {
        var p = pEdit;
        if (!p) {
          return '<div class="esp-form-empty dyn-muted">No se encontró el paciente. Intente otra búsqueda o recargue.</div>';
        }
        return (
          '<div class="esp-form-header">' +
          '<span class="esp-form-kicker">Ficha del paciente</span>' +
          '<h3 class="esp-form-title">' + escapeHtml(patientFullName(p)) + "</h3></div>" +
          '<div class="esp-form-body esp-form-body--with-footer"><div class="esp-form-main">' +
          '<div class="esp-form-grid esp-form-grid--edit">' +
          '<div class="dyn-field"><label>' + requiredLabel("Nombres") + '</label><input type="text" id="pac-nombres" class="esp-form-input" value="' + escapeHtml(p.nombres || "") + '" /></div>' +
          '<div class="dyn-field"><label>' + requiredLabel("Apellidos") + '</label><input type="text" id="pac-apellidos" class="esp-form-input" value="' + escapeHtml(p.apellidos || "") + '" /></div>' +
          '<div class="dyn-field"><label>' + requiredLabel("N. expediente") + '</label><input type="text" id="pac-expediente" class="esp-form-input" value="' + escapeHtml(p.numeroExpediente || "") + '" /></div>' +
          '<div class="dyn-field"><label>' + requiredLabel("Fecha nacimiento") + '</label><input type="date" id="pac-fecha-nac" class="esp-form-input" value="' + escapeHtml(p.fechaNacimiento || "") + '" /></div>' +
          '<div class="dyn-field"><label>' + requiredLabel("Teléfono") + '</label><input type="text" id="pac-telefono" class="esp-form-input" inputmode="numeric" maxlength="8" pattern="\\d{8}" placeholder="00000000" autocomplete="tel" value="' + escapeHtml(p.telefono || "") + '" /></div>' +
          '<div class="dyn-field"><label>' + requiredLabel("Sexo") + '</label><select id="pac-sexo" class="esp-form-input">' +
          '<option value="">Seleccione…</option>' +
          '<option value="FEMENINO"' + (p.sexo === "FEMENINO" ? " selected" : "") + ">Femenino</option>" +
          '<option value="MASCULINO"' + (p.sexo === "MASCULINO" ? " selected" : "") + ">Masculino</option>" +
          '<option value="OTRO"' + (p.sexo === "OTRO" ? " selected" : "") + ">Otro</option></select></div>" +
          '<div class="dyn-field esp-form-grid-span2"><label>' + requiredLabel("Dirección") + '</label><input type="text" id="pac-direccion" class="esp-form-input" value="' + escapeHtml(p.direccion || "") + '" /></div>' +
          '<div class="dyn-field esp-form-grid-span2"><label>' + requiredLabel("Responsable / Tutor") + '</label><input type="text" id="pac-responsable" class="esp-form-input" value="' + escapeHtml(p.responsableTutor || "") + '" /></div>' +
          '<div class="dyn-field esp-form-grid-span2"><label>' + requiredLabel("Diagnóstico / Referencia") + '</label><textarea id="pac-diagnostico" class="esp-form-input" rows="2">' + escapeHtml(p.diagnosticoReferencia || "") + "</textarea></div>" +
          '<div class="dyn-field esp-form-grid-span2"><label>' + requiredLabel("Notas") + '</label><textarea id="pac-notas" class="esp-form-input" rows="2">' + escapeHtml(p.notas || "") + "</textarea></div>" +
          '<div class="dyn-field esp-form-grid-span2"><label>' + requiredLabel("Capacidades") + '</label><textarea id="pac-capacidades" class="esp-form-input" rows="2">' + escapeHtml(p.capacidadesInfo || "") + "</textarea></div>" +
          '<div class="esp-status-row esp-form-grid-span2"><span class="esp-status-label" id="pac-activo-caption">Activo</span>' +
          '<div class="esp-switch" title="Estado del paciente"><input type="checkbox" id="pac-activo" class="esp-switch-input" ' + (p.activo ? "checked " : "") + 'role="switch" aria-labelledby="pac-activo-caption" />' +
          '<label for="pac-activo" class="esp-switch-track"><span class="esp-switch-thumb"></span></label></div></div>' +
          "</div></div>" +
          '<div class="esp-form-actions esp-form-actions--footer">' +
          '<button type="button" class="btn-fluent esp-form-primary" id="pac-save" data-edit-id="' + p.id + '">Guardar</button>' +
          '<button type="button" class="btn-fluent esp-form-btn-cancel" id="pac-cancel">Cancelar</button></div></div>'
        );
      }

      return (
        '<div class="esp-form-placeholder">' +
        '<i class="fa-solid fa-user esp-form-placeholder-icon" aria-hidden="true"></i>' +
        '<p class="esp-form-placeholder-title">Pacientes</p>' +
        '<p class="dyn-muted">Seleccione una <strong>fila</strong> en la tabla para editar la ficha, o pulse <strong>+ Agregar</strong> para dar de alta.</p></div>'
      );
    }

    function readReqText(id, label) {
      var el = document.getElementById(id);
      var val = el && el.value != null ? String(el.value).trim() : "";
      if (!val) throw new Error("Indique " + label);
      return val;
    }

    function validatePhoneInput() {
      var tel = readReqText("pac-telefono", "teléfono");
      if (!/^\d{8}$/.test(tel)) throw new Error("El teléfono debe contener exactamente 8 dígitos");
      return tel;
    }

    var pLoad =
      sel.kind === "edit" && sel.id != null
        ? apiJson("/api/patients/" + sel.id)
        : Promise.resolve(null);
    return pLoad.then(function (editLoaded) {
      var html =
        '<div class="esp-split-layout">' +
        '<div class="esp-tree-panel dyn-card">' +
        '<div class="esp-tree-toolbar">' +
        '<div class="esp-tree-search-wrap">' +
        '<i class="fa-solid fa-magnifying-glass esp-tree-search-ico" aria-hidden="true"></i>' +
        '<input type="search" id="pac-search" class="esp-tree-search-input" placeholder="Búsqueda en servidor (mín. 1 carácter)…" autocomplete="off" />' +
        "</div>" +
        '<button type="button" class="btn-fluent esp-tree-add-btn" id="pac-new">+ Agregar</button></div>' +
        '<div class="esp-tree-scroll"><table class="dyn-table esp-table-in-panel"><thead><tr><th>Expediente</th><th>Nombre</th><th>Teléfono</th><th>Estado</th></tr></thead><tbody id="pac-table-body"></tbody></table></div>' +
        '<div class="esp-staff-pagination" id="pac-pagination">' +
        '<span id="pac-summary">Escriba para buscar</span>' +
        '<span id="pac-page-nav-wrap">' +
        "" +
        "</span></div></div>" +
        '<div class="esp-form-panel dyn-card" id="pac-form-panel">' +
        buildPacFormPanel(editLoaded) +
        "</div></div>";

      container.innerHTML = html;

      var searchEl = document.getElementById("pac-search");
      if (searchEl) {
        searchEl.value = window.__hisPacSearch || "";
        searchEl.addEventListener("input", function () {
          window.__hisPacSearch = searchEl.value;
          window.__hisPacPage = 1;
          renderPacTable();
        });
      }

      function renderPacTable() {
        var qRaw = String(window.__hisPacSearch || "").trim();
        if (qRaw.length < 1) {
          var bodyEl0 = document.getElementById("pac-table-body");
          if (bodyEl0) {
            bodyEl0.innerHTML =
              '<tr><td colspan="4" class="dyn-muted" style="padding:16px">Escriba al menos un carácter. El listado se obtiene del servidor bajo demanda, sin cargar todos los pacientes.</td></tr>';
          }
          var summaryEl0 = document.getElementById("pac-summary");
          if (summaryEl0) summaryEl0.textContent = "Sin búsqueda (sin carga global)";
          var pag0 = document.getElementById("pac-page-nav-wrap");
          if (pag0) pag0.innerHTML = "";
          return;
        }
        var currentPage = window.__hisPacPage || 1;
        var page0 = currentPage - 1;
        if (page0 < 0) page0 = 0;
        var bodyLoad = document.getElementById("pac-table-body");
        if (bodyLoad) {
          bodyLoad.innerHTML = hisLoadingTableRow(4, "Buscando…");
        }
        apiJson(
          "/api/patients/search?q=" + encodeURIComponent(qRaw) + "&page=" + page0 + "&size=" + PAC_PAGE_SIZE
        )
          .then(function (page) {
            var slice = (page && page.content) || [];
            var total = page && page.totalElements != null ? page.totalElements : 0;
            var totalPages = page && page.totalPages != null ? Math.max(1, page.totalPages) : 1;
            if (currentPage > totalPages) {
              currentPage = totalPages;
              window.__hisPacPage = currentPage;
              if (currentPage < 1) currentPage = 1;
            }
            var start = (currentPage - 1) * PAC_PAGE_SIZE;
            var tbody = "";
            slice.forEach(function (p) {
              var active = sel.kind === "edit" && sel.id === p.id;
              tbody +=
                '<tr class="' +
                (active ? "esp-table-row--active" : "") +
                '" data-pac-id="' +
                p.id +
                '">' +
                "<td>" +
                escapeHtml(p.numeroExpediente || "—") +
                "</td><td>" +
                escapeHtml(patientFullName(p)) +
                "</td><td>" +
                escapeHtml(p.telefono || "—") +
                "</td><td>" +
                (p.activo
                  ? '<span class="esp-staff-badge esp-staff-badge--on">Activo</span>'
                  : '<span class="esp-staff-badge esp-staff-badge--off">Inactivo</span>') +
                "</td></tr>";
            });
            if (!slice.length) {
              tbody = '<tr><td colspan="4" class="dyn-muted" style="padding:16px">Ningún resultado para “' + escapeHtml(qRaw) + "”.</td></tr>";
            }
            var bodyEl = document.getElementById("pac-table-body");
            if (bodyEl) bodyEl.innerHTML = tbody;

            var endIdx = Math.min(start + slice.length, total);
            var startIdx = total === 0 ? 0 : start + 1;
            var summary = total === 0 ? "0 resultados" : startIdx + "–" + endIdx + " de " + total;
            var summaryEl = document.getElementById("pac-summary");
            if (summaryEl) summaryEl.textContent = summary;

            var pagWrap = document.getElementById("pac-page-nav-wrap");
            if (pagWrap) {
              if (total > PAC_PAGE_SIZE) {
                pagWrap.innerHTML =
                  '<div class="esp-staff-page-nav">' +
                  '<button type="button" class="esp-staff-page-btn" data-pac-page="prev" ' +
                  (currentPage <= 1 ? "disabled" : "") +
                  ">‹</button>" +
                  "<span>Página " +
                  currentPage +
                  " de " +
                  totalPages +
                  "</span>" +
                  '<button type="button" class="esp-staff-page-btn" data-pac-page="next" ' +
                  (currentPage >= totalPages ? "disabled" : "") +
                  ">›</button></div>";
              } else {
                pagWrap.innerHTML = "";
              }
              pagWrap.querySelectorAll("[data-pac-page]").forEach(function (btn) {
                btn.onclick = function () {
                  var dir = btn.getAttribute("data-pac-page");
                  var np = currentPage + (dir === "next" ? 1 : -1);
                  if (np < 1 || np > totalPages) return;
                  window.__hisPacPage = np;
                  renderPacTable();
                };
              });
            }

            container.querySelectorAll("tr[data-pac-id]").forEach(function (row) {
              row.onclick = function () {
                var id = parseInt(row.getAttribute("data-pac-id"), 10);
                if (isNaN(id)) return;
                window.__hisPacSel = { kind: "edit", id: id };
                renderPacientes(container);
              };
            });
          })
          .catch(function (e) {
            var b = document.getElementById("pac-table-body");
            if (b) {
              b.innerHTML =
                '<tr><td colspan="4" class="dyn-muted" style="padding:16px">' + escapeHtml(e.message || "Error") + "</td></tr>";
            }
          });
      }

      renderPacTable();

      var btnNew = document.getElementById("pac-new");
      if (btnNew) {
        btnNew.onclick = function () {
          window.__hisPacSel = { kind: "new" };
          renderPacientes(container);
        };
      }

      var telInput = document.getElementById("pac-telefono");
      if (telInput) {
        telInput.addEventListener("input", function () {
          var clean = String(telInput.value || "").replace(/\D/g, "").slice(0, 8);
          if (telInput.value !== clean) telInput.value = clean;
        });
      }

      var btnSave = document.getElementById("pac-save");
      if (btnSave) {
        btnSave.onclick = function () {
          try {
            var body = {
              nombres: readReqText("pac-nombres", "nombres"),
              apellidos: readReqText("pac-apellidos", "apellidos"),
              numeroExpediente: readReqText("pac-expediente", "número de expediente"),
              fechaNacimiento: readReqText("pac-fecha-nac", "fecha de nacimiento"),
              telefono: validatePhoneInput(),
              sexo: readReqText("pac-sexo", "sexo"),
              direccion: readReqText("pac-direccion", "dirección"),
              responsableTutor: readReqText("pac-responsable", "responsable / tutor"),
              diagnosticoReferencia: readReqText("pac-diagnostico", "diagnóstico / referencia"),
              notas: readReqText("pac-notas", "notas"),
              capacidadesInfo: readReqText("pac-capacidades", "capacidades"),
            };
            var editId = btnSave.getAttribute("data-edit-id");
            if (editId) {
              body.activo = !!(document.getElementById("pac-activo") || {}).checked;
              apiJson("/api/patients/" + editId, { method: "PATCH", body: body })
                .then(function () {
                  notify("Paciente actualizado", "success");
                  renderPacientes(container);
                })
                .catch(function (e) {
                  notify(e.message, "error");
                });
            } else {
              apiJson("/api/patients", { method: "POST", body: body })
                .then(function () {
                  window.__hisPacSel = { kind: "none" };
                  notify("Paciente creado", "success");
                  renderPacientes(container);
                })
                .catch(function (e) {
                  notify(e.message, "error");
                });
            }
          } catch (err) {
            notify(err.message, "warning");
          }
        };
      }

      var btnCancel = document.getElementById("pac-cancel");
      if (btnCancel) {
        btnCancel.onclick = function () {
          window.__hisPacSel = { kind: "none" };
          renderPacientes(container);
        };
      }
    });
  }

  function renderEspecialidades(container) {
    container.innerHTML = hisLoadingBlock("Cargando especialidades…", "his-loading--page");
    return Promise.all([
      apiJson("/api/catalog/especialidades/unidades"),
      apiJson("/api/staff/especialistas"),
    ]).then(function (arr) {
      const unidades = arr[0] || [];
      const especialistas = arr[1] || [];

      var sel = window.__hisEspSel || { kind: "none" };

      function findUnidad(uid) {
        for (var i = 0; i < unidades.length; i++) {
          if (unidades[i].unidad.id === uid) return unidades[i];
        }
        return null;
      }

      function findEspecialidad(espId) {
        for (var i = 0; i < unidades.length; i++) {
          var list = unidades[i].especialidades || [];
          for (var j = 0; j < list.length; j++) {
            if (list[j].id === espId) {
              return { esp: list[j], unidad: unidades[i].unidad, grupo: unidades[i] };
            }
          }
        }
        return null;
      }

      function especialistasParaEspecialidad(espId) {
        return especialistas.filter(function (it) {
          var det = it.especialidadesDetalle || [];
          return det.some(function (d) {
            return d.id === espId;
          });
        });
      }

      function buildEspStaffRows(items, selectionMap) {
        var rows = "";
        (items || []).forEach(function (e) {
          var full = ((e.nombres || "") + " " + (e.apellidos || "")).trim() || "—";
          rows +=
            '<tr><td class="esp-col-check"><input type="checkbox" name="esp-especialidad-staff" value="' +
            e.id +
            '"' +
            (selectionMap && selectionMap[e.id] ? " checked" : "") +
            ' aria-label="Asignar ' +
            escapeHtml(full) +
            '" /></td><td>' +
            escapeHtml(full) +
            "</td><td>" +
            escapeHtml(e.email || "—") +
            "</td><td>" +
            (e.activo
              ? '<span class="esp-staff-badge esp-staff-badge--on">Activo</span>'
              : '<span class="esp-staff-badge esp-staff-badge--off">Inactivo</span>') +
            "</td></tr>";
        });
        if (!rows) {
          rows =
            '<tr><td colspan="4" class="dyn-muted" style="padding:12px">Sin especialistas para mostrar.</td></tr>';
        }
        return rows;
      }

      function buildEspecialistasAsignacionPanel(precheckedIds) {
        return (
  
          '<span class="esp-staff-esp-label">Especialistas asignados</span>' +
          '<div class="esp-tree-toolbar esp-staff-esp-toolbar">' +
          '<div class="esp-tree-search-wrap">' +
          '<i class="fa-solid fa-magnifying-glass esp-tree-search-ico" aria-hidden="true"></i>' +
          '<input type="search" id="esp-especialidad-staff-search" class="esp-tree-search-input" placeholder="Buscar especialista por nombre o correo…" autocomplete="off" />' +
          "</div></div>" +
          '<div class="esp-staff-esp-table-wrap">' +
          '<table class="dyn-table esp-staff-esp-table">' +
          '<thead><tr><th class="esp-col-check"></th><th>Nombre</th><th>Correo</th><th>Estado</th></tr></thead>' +
          '<tbody id="esp-especialidad-staff-tbody"></tbody></table></div>' +
          '<div class="esp-staff-esp-pagination" id="esp-especialidad-staff-pagination"></div>' +
          '<input type="hidden" id="esp-especialidad-staff-initial" value="' +
          (precheckedIds || []).join(",") +
          '" />' +
          "</div>"
        );
      }

      function buildAddFormPanelHtml() {
        var add = window.__hisEspAdd || { open: true, kind: "categoria" };
        var kind = add.kind === "especialidad" ? "especialidad" : "categoria";
        var preUid = add.preUnidadId != null ? add.preUnidadId : null;
        var catBlock =
          '<div class="dyn-field esp-form-grid-span2" id="esp-add-block-cat"' +
          (kind === "especialidad" ? "" : ' style="display:none"') +
          ">" +
          '<label>Categoría</label>' +
          '<div class="esp-combo" id="esp-add-cat-combo">' +
          '<input type="text" id="esp-add-cat-filter" class="esp-form-input"' +
          ' placeholder="Buscar categoría por nombre o código…" autocomplete="off" />' +
          '<input type="hidden" id="esp-add-cat-id" value="" />' +
          '<ul class="esp-combo-dropdown" id="esp-add-cat-list" hidden></ul>' +
          "</div>" +
          '<p class="dyn-muted esp-form-hint-below"></p></div>';

        var codigoEsp =
            '<div class="dyn-field" id="esp-add-block-codigo-esp"' +
            (kind === "especialidad" ? "" : ' style="display:none"') +
            ">" +
            '<label>Código</label>' +
            '<input type="text" id="esp-add-codigo-esp" class="esp-form-input" placeholder="TERAPIA_OCUPACIONAL" /></div>';

        var nombreEsp =
          '<div class="dyn-field" id="esp-add-block-nombre-esp"' +
          (kind === "especialidad" ? "" : ' style="display:none"') +
          ">" +
          '<label>Descripción</label>' +
          '<input type="text" id="esp-add-nombre-esp" class="esp-form-input" placeholder="Ej. Terapia Ocupacional" /></div>';


        return (
          '<div class="esp-form-header">' +
          '<span class="esp-form-kicker">Nuevo registro</span>' +
          '<h3 class="esp-form-title">Agregar</h3></div>' +
          '<div class="esp-form-body esp-form-body--add esp-form-body--with-footer">' +
          '<div class="esp-form-main">' +
          '<div class="esp-form-grid">' +
          '<div class="dyn-field esp-form-grid-span2">' +
          '<label>Tipo</label>' +
          '<select id="esp-add-kind" class="esp-form-input">' +
          '<option value="categoria"' +
          (kind === "categoria" ? " selected" : "") +
          ">Unidad Operativa</option>" +
          '<option value="especialidad"' +
          (kind === "especialidad" ? " selected" : "") +
          ">Especialidad</option>" +
          "</select></div>" +
          '<div class="dyn-field" id="esp-add-block-nombre-cat"' +
          (kind === "categoria" ? "" : ' style="display:none"') +
          ">" +
          '<label>Nombre</label>' +
          '<input type="text" id="esp-add-nombre-cat" class="esp-form-input" placeholder="Ej. Unidad de Nutrición" /></div>' +
          '<div class="dyn-field" id="esp-add-block-codigo-cat"' +
          (kind === "categoria" ? "" : ' style="display:none"') +
          ">" +
          '<label>Código</label>' +
          '<input type="text" id="esp-add-codigo-cat" class="esp-form-input" placeholder="UNIDAD_NUTRICION" /></div>' +
          catBlock +
          nombreEsp +
          codigoEsp +
          "</div>" +
          "</div>" +
          '<div class="esp-form-actions esp-form-actions--footer">' +
          '<button type="button" class="btn-fluent esp-form-primary" id="esp-add-submit">Guardar</button>' +
          '<button type="button" class="btn-fluent esp-form-btn-cancel" id="esp-add-cancel">Cancelar</button>' +
          "</div></div>" +
          '<div id="esp-add-pre-unidad" style="display:none" data-unidad-id="' +
          (preUid != null ? String(preUid) : "") +
          '"></div>'
        );
      }

      function buildFormPanelHtml() {
        if (window.__hisEspAdd && window.__hisEspAdd.open) {
          return buildAddFormPanelHtml();
        }
        if (sel.kind === "unidad") {
          var g = findUnidad(sel.unidadId);
          if (!g) {
            return (
              '<div class="esp-form-empty dyn-muted">Seleccione una categoría o una especialidad en el árbol.</div>'
            );
          }
          var u = g.unidad;
          return (
            '<div class="esp-form-header">' +
            '<span class="esp-form-kicker">Unidad Operativa</span>' +
            "<h3 class=\"esp-form-title\">" +
            escapeHtml(u.nombre || u.codigo) +
            "</h3></div>" +
            '<div class="esp-form-body esp-form-body--with-footer">' +
            '<div class="esp-form-main">' +
            '<h4 class="esp-form-subtitle">Editar categoría</h4>' +
            '<div class="esp-form-grid esp-form-grid--edit">' +
            '<div class="dyn-field"><label>Nombre</label>' +
            '<input type="text" id="esp-edit-nombre-unidad" class="esp-form-input" value="' +
            escapeHtml(u.nombre || "") +
            '" /></div>' +
            '<div class="dyn-field"><label>Código</label>' +
            '<input type="text" id="esp-edit-codigo-unidad" class="esp-form-input" value="' +
            escapeHtml(u.codigo || "") +
            '" /></div></div></div>' +
            '<div class="esp-form-actions esp-form-actions--footer">' +
            '<button type="button" class="btn-fluent esp-form-primary" id="esp-add-submit" data-edit-unidad-id="' +
            u.id +
            '">Guardar</button>' +
            '<button type="button" class="btn-fluent esp-form-btn-cancel" id="esp-add-cancel">Cancelar</button></div>' +
            "</div>"
          );
        }
        if (sel.kind === "especialidad") {
          var found = findEspecialidad(sel.espId);
          if (!found) {
            return (
              '<div class="esp-form-empty dyn-muted">Seleccione una categoría o una especialidad en el árbol.</div>'
            );
          }
          var esp = found.esp;
          var uNom = found.unidad.nombre || found.unidad.codigo;
          var asignados = especialistasParaEspecialidad(esp.id);
          var detIds = asignados.map(function (a) {
            return a.id;
          });
          return (
            '<div class="esp-form-header">' +
            '<span class="esp-form-kicker">Especialidad / servicio</span>' +
            "<h3 class=\"esp-form-title\">" +
            escapeHtml(esp.nombre) +
            "</h3></div>" +
            '<div class="esp-form-body esp-form-body--with-footer">' +
            '<div class="esp-form-main">' +
            '<h4 class="esp-form-subtitle">Editar especialidad</h4>' +
            '<div class="esp-form-grid esp-form-grid--edit">' +
            '<div class="dyn-field"><label>Nombre</label>' +
            '<input type="text" id="esp-edit-nombre-esp" class="esp-form-input" value="' +
            escapeHtml(esp.nombre || "") +
            '" /></div>' +
            '<div class="dyn-field"><label>Código</label>' +
            '<input type="text" id="esp-edit-codigo-esp" class="esp-form-input" value="' +
            escapeHtml(esp.codigo || "") +
            '" /></div>' +
            '<div class="dyn-field esp-form-grid-span2">' +
            '<label>Unidad de Atención Médica</label>' +
            '<div class="esp-combo" id="esp-edit-cat-combo">' +
            '<input type="text" id="esp-edit-cat-filter" class="esp-form-input" placeholder="Buscar por nombre…" autocomplete="off" />' +
            '<input type="hidden" id="esp-edit-cat-id" value="' +
            String(found.unidad.id) +
            '" />' +
            '<ul class="esp-combo-dropdown" id="esp-edit-cat-list" hidden></ul></div></div></div>' +
            '<div class="esp-form-assign-block">' +
            buildEspecialistasAsignacionPanel(detIds) +
            "</div></div>" +
            '<div class="esp-form-actions esp-form-actions--footer">' +
            '<button type="button" class="btn-fluent esp-form-primary" id="esp-add-submit" data-edit-esp-id="' +
            esp.id +
            '">Guardar</button>' +
            '<button type="button" class="btn-fluent esp-form-btn-cancel" id="esp-add-cancel">Cancelar</button></div>' +
            "</div>"
          );
        }
        return (
          '<div class="esp-form-placeholder">' +
          '<i class="fa-solid fa-sitemap esp-form-placeholder-icon" aria-hidden="true"></i>' +
          '<p class="esp-form-placeholder-title">Árbol de especialidades</p>' +
          '<p class="dyn-muted">Seleccione una <strong>categoría</strong> (unidad operativa) para crear una especialidad, o una <strong>especialidad</strong> para ver y asignar personal.</p></div>'
        );
      }

      var html = '<div class="esp-split-layout">';
      html += '<div class="esp-tree-panel dyn-card">';
      html +=
        '<div class="esp-tree-toolbar">' +
        '<div class="esp-tree-search-wrap">' +
        '<i class="fa-solid fa-magnifying-glass esp-tree-search-ico" aria-hidden="true"></i>' +
        '<input type="search" id="esp-tree-search" class="esp-tree-search-input" placeholder="Buscar categoría o especialidad…" autocomplete="off" />' +
        "</div>" +
        '<button type="button" class="btn-fluent esp-tree-add-btn" id="esp-open-add">+ Agregar</button>' +
        "</div>";
      html += '<div class="esp-tree-scroll">';
      html +=
        '<h3 class="esp-tree-heading">Categorías y especialidades</h3>' ;
      html += '<ul class="esp-tree" role="tree" id="esp-tree-root">';
      if (!unidades.length) {
        html +=
          '<li class="esp-tree-empty-root dyn-muted">No hay categorías aún. Use <strong>Agregar</strong> para crear una categoría.</li>';
      }
      unidades.forEach(function (grupo) {
        var unidad = grupo.unidad;
        var espList = grupo.especialidades || [];
        var isUnidadActive = sel.kind === "unidad" && sel.unidadId === unidad.id;
        html += '<li class="esp-tree-branch" role="treeitem" data-unidad-id="' + unidad.id + '">';
        html += '<div class="esp-tree-branch-row">';
        html +=
          '<button type="button" class="esp-tree-toggle" aria-expanded="false" aria-label="Expandir o contraer"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>';
        html +=
          '<button type="button" class="esp-tree-cat esp-tree-select' +
          (isUnidadActive ? " esp-tree-select--active" : "") +
          '" data-select="unidad" data-id="' +
          unidad.id +
          '">' +
          escapeHtml(unidad.nombre || unidad.codigo) +
          "</button>";
        html += '<span class="esp-tree-badge">' + espList.length + "</span>";
        html += "</div>";
        html += '<ul class="esp-tree-children esp-tree-children--collapsed">';
        if (!espList.length) {
          html += '<li class="esp-tree-empty">Sin especialidades</li>';
        } else {
          espList.forEach(function (esp) {
            var leafActive = sel.kind === "especialidad" && sel.espId === esp.id;
            html += "<li>";
            html +=
              '<button type="button" class="esp-tree-leaf esp-tree-select' +
              (leafActive ? " esp-tree-select--active" : "") +
              '" data-select="especialidad" data-id="' +
              esp.id +
              '" data-unidad-id="' +
              unidad.id +
              '">' +
              '<i class="fa-solid fa-leaf esp-tree-leaf-ico" aria-hidden="true"></i>' +
              escapeHtml(esp.nombre) +
              "</button>";
            html += "</li>";
          });
        }
        html += "</ul></li>";
      });
      html += "</ul></div></div>";

      html += '<div class="esp-form-panel dyn-card" id="esp-form-panel">';
      html += buildFormPanelHtml();
      html += "</div></div>";

      container.innerHTML = html;

      function applyTreeFilter(query) {
        var q = (query || "").trim().toLowerCase();
        container.querySelectorAll(".esp-tree-branch").forEach(function (br) {
          var catBtn = br.querySelector(".esp-tree-cat");
          var catText = catBtn ? catBtn.textContent.toLowerCase() : "";
          var match = !q;
          if (!match) {
            if (catText.indexOf(q) >= 0) {
              match = true;
            } else {
              var leaves = br.querySelectorAll(".esp-tree-leaf");
              for (var i = 0; i < leaves.length; i++) {
                if (leaves[i].textContent.toLowerCase().indexOf(q) >= 0) {
                  match = true;
                  break;
                }
              }
            }
          }
          br.style.display = match ? "" : "none";
        });
      }

      function attachTreeSearch() {
        var inp = document.getElementById("esp-tree-search");
        if (!inp) return;
        inp.addEventListener("input", function () {
          applyTreeFilter(inp.value);
        });
      }

      /** prefix ej. "esp-add-cat" → ids esp-add-cat-combo, -filter, -id, -list */
      function bindComboUnidad(prefix, preUnidadId) {
        var combo = document.getElementById(prefix + "-combo");
        var input = document.getElementById(prefix + "-filter");
        var hidden = document.getElementById(prefix + "-id");
        var list = document.getElementById(prefix + "-list");
        if (!combo || !input || !hidden || !list) return;
        if (combo.getAttribute("data-bound") === "1") return;
        combo.setAttribute("data-bound", "1");

        function fillList(filterText) {
          if (!unidades.length) {
            list.innerHTML =
              '<li class="esp-combo-empty dyn-muted">No hay categorías. Cree una categoría primero.</li>';
            list.hidden = false;
            return;
          }
          var q = (filterText || "").trim().toLowerCase();
          list.innerHTML = "";
          unidades.forEach(function (grupo) {
            var u = grupo.unidad;
            var display = ((u.nombre || "").trim() || (u.codigo || "")).trim();
            var searchHaystack = ((u.nombre || "") + " " + (u.codigo || "")).trim().toLowerCase();
            if (q && searchHaystack.indexOf(q) < 0) return;
            var li = document.createElement("li");
            li.className = "esp-combo-item";
            li.setAttribute("role", "option");
            li.textContent = display;
            li.setAttribute("data-id", String(u.id));
            li.addEventListener("mousedown", function (ev) {
              ev.preventDefault();
              hidden.value = String(u.id);
              input.value = display;
              list.hidden = true;
            });
            list.appendChild(li);
          });
          list.hidden = list.children.length === 0;
        }

        input.addEventListener("focus", function () {
          fillList("");
          list.hidden = list.children.length === 0;
        });
        input.addEventListener("input", function () {
          hidden.value = "";
          fillList(input.value);
          list.hidden = false;
        });
        combo.addEventListener("keydown", function (ev) {
          if (ev.key === "Escape") {
            list.hidden = true;
          }
        });
        input.addEventListener("blur", function () {
          setTimeout(function () {
            list.hidden = true;
          }, 180);
        });

        if (preUnidadId != null && !isNaN(preUnidadId)) {
          var g = findUnidad(preUnidadId);
          if (g) {
            var u = g.unidad;
            hidden.value = String(u.id);
            input.value = ((u.nombre || "").trim() || (u.codigo || "")).trim();
          }
        }
      }

      function attachCategoriaCombo() {
        var pre = document.getElementById("esp-add-pre-unidad");
        var puid =
          pre && pre.getAttribute("data-unidad-id")
            ? parseInt(pre.getAttribute("data-unidad-id"), 10)
            : null;
        bindComboUnidad("esp-add-cat", puid);
      }

      function toggleAddKind(kind) {
        var isCat = kind === "categoria";
        var bNomCat = document.getElementById("esp-add-block-nombre-cat");
        var bCodCat = document.getElementById("esp-add-block-codigo-cat");
        var bCat = document.getElementById("esp-add-block-cat");
        var bNomEsp = document.getElementById("esp-add-block-nombre-esp");
        var bCodEsp = document.getElementById("esp-add-block-codigo-esp");
        if (bNomCat) bNomCat.style.display = isCat ? "" : "none";
        if (bCodCat) bCodCat.style.display = isCat ? "" : "none";
        if (bCat) bCat.style.display = isCat ? "none" : "";
        if (bNomEsp) bNomEsp.style.display = isCat ? "none" : "";
        if (bCodEsp) bCodEsp.style.display = isCat ? "none" : "";
      }

      function bindFormActions() {
        var openAdd = document.getElementById("esp-open-add");
        if (openAdd) {
          openAdd.onclick = function () {
            window.__hisEspSel = { kind: "none" };
            sel = window.__hisEspSel;
            window.__hisEspAdd = { open: true, kind: "categoria" };
            container.querySelectorAll(".esp-tree-select--active").forEach(function (x) {
              x.classList.remove("esp-tree-select--active");
            });
            var panel = document.getElementById("esp-form-panel");
            if (panel) {
              panel.innerHTML = buildFormPanelHtml();
              bindFormActions();
            }
          };
        }

        var cancelAdd = document.getElementById("esp-add-cancel");
        if (cancelAdd) {
          cancelAdd.onclick = function () {
            if (document.getElementById("esp-add-kind")) {
              window.__hisEspAdd = null;
              sel = window.__hisEspSel || { kind: "none" };
            }
            var panel = document.getElementById("esp-form-panel");
            if (panel) {
              panel.innerHTML = buildFormPanelHtml();
              bindFormActions();
            }
          };
        }

        var kindSel = document.getElementById("esp-add-kind");
        if (kindSel) {
          kindSel.addEventListener("change", function () {
            var k = kindSel.value === "especialidad" ? "especialidad" : "categoria";
            window.__hisEspAdd = window.__hisEspAdd || { open: true };
            window.__hisEspAdd.kind = k;
            toggleAddKind(k);
            if (k === "especialidad") {
              attachCategoriaCombo();
            }
          });
          toggleAddKind(kindSel.value === "especialidad" ? "especialidad" : "categoria");
          attachCategoriaCombo();
        }

        var submitAdd = document.getElementById("esp-add-submit");
        if (submitAdd) {
          submitAdd.onclick = function () {
            var editUid = submitAdd.getAttribute("data-edit-unidad-id");
            var editEid = submitAdd.getAttribute("data-edit-esp-id");
            if (editUid) {
              var uid = parseInt(editUid, 10);
              var nombreU = (document.getElementById("esp-edit-nombre-unidad").value || "").trim();
              var codigoU = (document.getElementById("esp-edit-codigo-unidad").value || "").trim();
              if (!nombreU || !codigoU) {
                notify("Indique nombre y código", "warning");
                return;
              }
              window.__hisEspSel = { kind: "unidad", unidadId: uid };
              apiJson("/api/catalog/unidades-operativas/" + uid, {
                method: "PATCH",
                body: { nombre: nombreU, codigo: codigoU },
              })
                .then(function () {
                  notify("Unidad operativa actualizada", "success");
                  return renderEspecialidades(container);
                })
                .catch(function (e) {
                  notify(e.message, "error");
                });
              return;
            }
            if (editEid) {
              var eid = parseInt(editEid, 10);
              var nombreE = (document.getElementById("esp-edit-nombre-esp").value || "").trim();
              var codigoE = (document.getElementById("esp-edit-codigo-esp").value || "").trim();
              var hid = document.getElementById("esp-edit-cat-id");
              var unidadCatalogoId = hid ? parseInt(hid.value, 10) : NaN;
              if (!nombreE) {
                notify("Indique el nombre de la especialidad", "warning");
                return;
              }
              if (!unidadCatalogoId) {
                notify("Seleccione una categoría", "warning");
                return;
              }
              window.__hisEspSel = { kind: "especialidad", espId: eid };
              apiJson("/api/catalog/especialidades/" + eid, {
                method: "PATCH",
                body: {
                  nombre: nombreE,
                  codigo: codigoE || null,
                  unidadCatalogoId: unidadCatalogoId,
                },
              })
                .then(function () {
                  var selectedMap = {};
                  container
                    .querySelectorAll('input[name="esp-especialidad-staff"]:checked')
                    .forEach(function (cb) {
                      var sid = parseInt(cb.value, 10);
                      if (!isNaN(sid)) selectedMap[sid] = true;
                    });
                  var ops = [];
                  especialistas.forEach(function (espSt) {
                    var currentIds = (espSt.especialidadesDetalle || []).map(function (d) {
                      return d.id;
                    });
                    var hasNow = currentIds.indexOf(eid) >= 0;
                    var shouldHave = !!selectedMap[espSt.id];
                    if (hasNow === shouldHave) return;
                    var nextIds = currentIds.slice();
                    if (shouldHave) {
                      nextIds.push(eid);
                    } else {
                      nextIds = nextIds.filter(function (id) {
                        return id !== eid;
                      });
                    }
                    ops.push(
                      apiJson("/api/staff/especialistas/" + espSt.id + "/especialidades", {
                        method: "PATCH",
                        body: { especialidadCatalogoIds: nextIds },
                      })
                    );
                  });
                  return Promise.all(ops);
                })
                .then(function () {
                  notify("Especialidad actualizada", "success");
                  return renderEspecialidades(container);
                })
                .catch(function (e) {
                  notify(e.message, "error");
                });
              return;
            }
            var k = document.getElementById("esp-add-kind");
            var modo = k && k.value === "especialidad" ? "especialidad" : "categoria";
            if (modo === "categoria") {
              var nom = (document.getElementById("esp-add-nombre-cat").value || "").trim();
              var cod = (document.getElementById("esp-add-codigo-cat").value || "").trim();
              if (!nom || !cod) {
                notify("Indique nombre y código de la categoría", "warning");
                return;
              }
              apiJson("/api/catalog/unidades-operativas", {
                method: "POST",
                body: { nombre: nom, codigo: cod },
              })
                .then(function () {
                  window.__hisEspAdd = null;
                  notify("Unidad operativa creada", "success");
                  return renderEspecialidades(container);
                })
                .catch(function (e) {
                  notify(e.message, "error");
                });
            } else {
              var uidH = document.getElementById("esp-add-cat-id");
              var unidadCatalogoId = uidH ? parseInt(uidH.value, 10) : NaN;
              var nombre = (document.getElementById("esp-add-nombre-esp").value || "").trim();
              var codigo = (document.getElementById("esp-add-codigo-esp").value || "").trim();
              if (!unidadCatalogoId) {
                notify("Seleccione una categoría en el buscador", "warning");
                return;
              }
              if (!nombre) {
                notify("Indique el nombre de la especialidad", "warning");
                return;
              }
              apiJson("/api/catalog/especialidades", {
                method: "POST",
                body: {
                  unidadCatalogoId: unidadCatalogoId,
                  nombre: nombre,
                  codigo: codigo || null,
                },
              })
                .then(function (res) {
                  window.__hisEspAdd = null;
                  window.__hisEspSel = { kind: "especialidad", espId: res.id };
                  notify("Especialidad creada", "success");
                  return renderEspecialidades(container);
                })
                .catch(function (e) {
                  notify(e.message, "error");
                });
            }
          };
        }

        if (document.getElementById("esp-edit-nombre-esp")) {
          var fuEd = sel.kind === "especialidad" ? findEspecialidad(sel.espId) : null;
          if (fuEd && fuEd.unidad) {
            bindComboUnidad("esp-edit-cat", fuEd.unidad.id);
          }
        }

        var espStaffSearchEl = document.getElementById("esp-especialidad-staff-search");
        var espStaffBodyEl = document.getElementById("esp-especialidad-staff-tbody");
        var espStaffPagEl = document.getElementById("esp-especialidad-staff-pagination");
        var espStaffSelection = {};
        var espStaffPage = 1;
        var espStaffPageSize = 4;
        var espStaffInitial = (document.getElementById("esp-especialidad-staff-initial") || {}).value || "";
        if (espStaffInitial) {
          espStaffInitial.split(",").forEach(function (raw) {
            var id = parseInt(raw, 10);
            if (!isNaN(id)) espStaffSelection[id] = true;
          });
        }
        especialistas.forEach(function (e) {
          if (espStaffSelection[e.id] == null) espStaffSelection[e.id] = false;
        });

        function renderEspStaffPicker() {
          if (!espStaffSearchEl || !espStaffBodyEl || !espStaffPagEl) return;
          var q = String(espStaffSearchEl.value || "").trim().toLowerCase();
          var filtered = especialistas.filter(function (e) {
            if (!q) return true;
            var name = ((e.nombres || "") + " " + (e.apellidos || "")).toLowerCase();
            var email = String(e.email || "").toLowerCase();
            return name.indexOf(q) >= 0 || email.indexOf(q) >= 0;
          });
          var total = filtered.length;
          var totalPages = total === 0 ? 1 : Math.ceil(total / espStaffPageSize);
          if (espStaffPage < 1) espStaffPage = 1;
          if (espStaffPage > totalPages) espStaffPage = totalPages;
          var start = (espStaffPage - 1) * espStaffPageSize;
          var slice = filtered.slice(start, start + espStaffPageSize);
          espStaffBodyEl.innerHTML = buildEspStaffRows(slice, espStaffSelection);

          var startIdx = total === 0 ? 0 : start + 1;
          var endIdx = Math.min(start + espStaffPageSize, total);
          var summary = total === 0 ? "Sin registros" : startIdx + "–" + endIdx + " de " + total;
          var nav = "";
          if (total > espStaffPageSize) {
            nav =
              '<div class="esp-staff-page-nav">' +
              '<button type="button" class="esp-staff-page-btn" data-esp-especialidad-staff-page="prev" ' +
              (espStaffPage <= 1 ? "disabled" : "") +
              ">‹</button>" +
              '<span>Página ' +
              espStaffPage +
              " de " +
              totalPages +
              "</span>" +
              '<button type="button" class="esp-staff-page-btn" data-esp-especialidad-staff-page="next" ' +
              (espStaffPage >= totalPages ? "disabled" : "") +
              ">›</button></div>";
          }
          espStaffPagEl.innerHTML = "<span>" + summary + "</span>" + nav;
          espStaffPagEl
            .querySelectorAll("[data-esp-especialidad-staff-page]")
            .forEach(function (btn) {
              btn.onclick = function () {
                var dir = btn.getAttribute("data-esp-especialidad-staff-page");
                espStaffPage = espStaffPage + (dir === "next" ? 1 : -1);
                renderEspStaffPicker();
              };
            });
          espStaffBodyEl.querySelectorAll('input[name="esp-especialidad-staff"]').forEach(function (cb) {
            cb.addEventListener("change", function () {
              var id = parseInt(cb.value, 10);
              if (isNaN(id)) return;
              espStaffSelection[id] = !!cb.checked;
            });
          });
        }

        if (espStaffSearchEl && espStaffBodyEl && espStaffPagEl) {
          renderEspStaffPicker();
          espStaffSearchEl.addEventListener("input", function () {
            espStaffPage = 1;
            renderEspStaffPicker();
          });
        }
      }

      container.querySelectorAll(".esp-tree-select").forEach(function (btn) {
        btn.addEventListener("click", function () {
          window.__hisEspAdd = null;
          var kind = btn.getAttribute("data-select");
          if (kind === "unidad") {
            var uid = parseInt(btn.getAttribute("data-id"), 10);
            window.__hisEspSel = { kind: "unidad", unidadId: uid };
          } else if (kind === "especialidad") {
            window.__hisEspSel = {
              kind: "especialidad",
              espId: parseInt(btn.getAttribute("data-id"), 10),
            };
          }
          container.querySelectorAll(".esp-tree-select--active").forEach(function (x) {
            x.classList.remove("esp-tree-select--active");
          });
          btn.classList.add("esp-tree-select--active");
          var panel = document.getElementById("esp-form-panel");
          if (panel) {
            sel = window.__hisEspSel;
            panel.innerHTML = buildFormPanelHtml();
            bindFormActions();
          }
        });
      });

      container.querySelectorAll(".esp-tree-toggle").forEach(function (tbtn) {
        tbtn.addEventListener("click", function (ev) {
          ev.stopPropagation();
          var branch = tbtn.closest(".esp-tree-branch");
          if (!branch) return;
          var ch = branch.querySelector(".esp-tree-children");
          var expanded = tbtn.getAttribute("aria-expanded") === "true";
          if (ch) {
            if (expanded) {
              ch.classList.add("esp-tree-children--collapsed");
              tbtn.setAttribute("aria-expanded", "false");
              var ic = tbtn.querySelector("i");
              if (ic) {
                ic.classList.remove("fa-chevron-down");
                ic.classList.add("fa-chevron-right");
              }
            } else {
              ch.classList.remove("esp-tree-children--collapsed");
              tbtn.setAttribute("aria-expanded", "true");
              var ic2 = tbtn.querySelector("i");
              if (ic2) {
                ic2.classList.remove("fa-chevron-right");
                ic2.classList.add("fa-chevron-down");
              }
            }
          }
        });
      });

      attachTreeSearch();
      bindFormActions();
    });
  }

  function renderEspecialistas(container) {
    container.innerHTML = hisLoadingBlock("Cargando especialistas…", "his-loading--page");
    var ESP_STAFF_PAGE = 8;
    var sel = window.__hisEspStaffSel || { kind: "none" };
    var pageNum = window.__hisEspStaffPage || 1;
    var searchQ = (window.__hisEspStaffSearch || "").trim().toLowerCase();

    function staffFullName(e) {
      return ((e.nombres || "") + " " + (e.apellidos || "")).trim() || "—";
    }

    function splitPersonParts(raw) {
      var txt = String(raw || "").trim().replace(/\s+/g, " ");
      if (!txt) return { first: "", second: "" };
      var parts = txt.split(" ");
      return { first: parts[0] || "", second: parts.slice(1).join(" ") };
    }

    function joinPersonParts(first, second) {
      return [String(first || "").trim(), String(second || "").trim()].filter(Boolean).join(" ");
    }

    function buildEspRows(items, selectionMap) {
      var rows = "";
      (items || []).forEach(function (c) {
        rows +=
          '<tr><td class="esp-col-check"><input type="checkbox" name="esp-staff-cat" value="' +
          c.id +
          '"' +
          (selectionMap[c.id] ? " checked" : "") +
          ' aria-label="Asociar ' +
          escapeHtml(c.nombre || "") +
          '" /></td><td>' +
          escapeHtml(c.nombre || "") +
          "</td><td>" +
          escapeHtml(c.codigo || "—") +
          "</td></tr>";
      });
      if (!rows) {
        rows =
          '<tr><td colspan="3" class="dyn-muted" style="padding:12px">Sin especialidades para mostrar.</td></tr>';
      }
      return rows;
    }

    function buildEspecialidadesPanel(espCats, checkedIds, query) {
      var set = {};
      (checkedIds || []).forEach(function (id) {
        set[id] = true;
      });
      var q = String(query || "").trim().toLowerCase();
      var filtered = (espCats || []).filter(function (c) {
        if (!q) return true;
        var nom = String(c.nombre || "").toLowerCase();
        var cod = String(c.codigo || "").toLowerCase();
        return nom.indexOf(q) >= 0 || cod.indexOf(q) >= 0;
      });
      var pageSize = 5;
      var pageNum = 1;
      var slice = filtered.slice((pageNum - 1) * pageSize, pageNum * pageSize);
      return (
        '<div class="esp-staff-esp-block">' +
        '<span class="esp-staff-esp-label">Especialidades <span class="esp-form-req">*</span></span>' +
        '<div class="esp-tree-toolbar esp-staff-esp-toolbar">' +
        '<div class="esp-tree-search-wrap">' +
        '<i class="fa-solid fa-magnifying-glass esp-tree-search-ico" aria-hidden="true"></i>' +
        '<input type="search" id="esp-staff-esp-search" class="esp-tree-search-input" placeholder="Buscar especialidad por nombre o código…" autocomplete="off" />' +
        "</div></div>" +
        '<div class="esp-staff-esp-table-wrap">' +
        '<table class="dyn-table esp-staff-esp-table">' +
        "<thead><tr><th class=\"esp-col-check\"></th><th>Nombre</th><th>Código</th></tr></thead>" +
        '<tbody id="esp-staff-esp-tbody">' +
        buildEspRows(slice, set) +
        "</tbody></table></div>" +
        '<div class="esp-staff-esp-pagination" id="esp-staff-esp-pagination"></div>' +
        '<input type="hidden" id="esp-staff-esp-initial" value="' +
        (checkedIds || []).join(",") +
        '" />' +
        "</div>"
      );
    }

    function buildStaffFormPanel(allList, espCats) {
      if (sel.kind === "new") {
        return (
          '<div class="esp-form-header">' +
          '<span class="esp-form-kicker">Nuevo registro</span>' +
          '<h3 class="esp-form-title">Alta de especialista</h3></div>' +
          '<div class="esp-form-body esp-form-body--with-footer">' +
          '<div class="esp-form-main">' +
          '<div class="esp-form-grid">' +
          '<div class="dyn-field"><label>1er. Nombre <span class="esp-form-req">*</span></label>' +
          '<input type="text" id="esp-staff-primer-nombre" class="esp-form-input" autocomplete="given-name" /></div>' +
          '<div class="dyn-field"><label>2do. Nombre</label>' +
          '<input type="text" id="esp-staff-segundo-nombre" class="esp-form-input" autocomplete="additional-name" /></div>' +
          '<div class="dyn-field"><label>1er. Apellido <span class="esp-form-req">*</span></label>' +
          '<input type="text" id="esp-staff-primer-apellido" class="esp-form-input" autocomplete="family-name" /></div>' +
          '<div class="dyn-field"><label>2do. Apellido</label>' +
          '<input type="text" id="esp-staff-segundo-apellido" class="esp-form-input" autocomplete="family-name" /></div>' +
          '<div class="dyn-field"><label>Teléfono</label>' +
          '<input type="text" id="esp-staff-tel" class="esp-form-input" inputmode="numeric" maxlength="8" pattern="\\d{8}" placeholder="00000000" autocomplete="tel" /></div>' +
          '<div class="dyn-field"><label>Correo electrónico</label>' +
          '<input type="email" id="esp-staff-email" class="esp-form-input" pattern="[A-Za-z0-9._%+-]+@pipitos\\.com" placeholder="usuario@pipitos.com" autocomplete="email" /></div>' +
          "</div>" +
          buildEspecialidadesPanel(espCats, [], "") +
          "</div>" +
          '<div class="esp-form-actions esp-form-actions--footer">' +
          '<button type="button" class="btn-fluent esp-form-primary" id="esp-staff-save">Guardar</button>' +
          '<button type="button" class="btn-fluent esp-form-btn-cancel" id="esp-staff-cancel">Cancelar</button></div></div>'
        );
      }
      if (sel.kind === "edit" && sel.id != null) {
        var e = null;
        for (var i = 0; i < allList.length; i++) {
          if (allList[i].id === sel.id) {
            e = allList[i];
            break;
          }
        }
        if (!e) {
          return (
            '<div class="esp-form-empty dyn-muted">No se encontró el especialista. Pulse otra fila en la tabla.</div>'
          );
        }
        var nomParts = splitPersonParts(e.nombres);
        var apeParts = splitPersonParts(e.apellidos);
        var detIds = (e.especialidadesDetalle || []).map(function (d) {
          return d.id;
        });
        return (
          '<div class="esp-form-header">' +
          '<span class="esp-form-kicker">Ficha del especialista</span>' +
          '<h3 class="esp-form-title">' +
          escapeHtml(staffFullName(e)) +
          "</h3></div>" +
          '<div class="esp-form-body esp-form-body--with-footer">' +
          '<div class="esp-form-main">' +
          '<h4 class="esp-form-subtitle">Datos personales</h4>' +
          '<div class="esp-form-grid esp-form-grid--edit">' +
          '<div class="dyn-field"><label>1er. Nombre <span class="esp-form-req">*</span></label>' +
          '<input type="text" id="esp-staff-primer-nombre" class="esp-form-input" value="' +
          escapeHtml(nomParts.first) +
          '" autocomplete="given-name" /></div>' +
          '<div class="dyn-field"><label>2do. Nombre</label>' +
          '<input type="text" id="esp-staff-segundo-nombre" class="esp-form-input" value="' +
          escapeHtml(nomParts.second) +
          '" autocomplete="additional-name" /></div>' +
          '<div class="dyn-field"><label>1er. Apellido <span class="esp-form-req">*</span></label>' +
          '<input type="text" id="esp-staff-primer-apellido" class="esp-form-input" value="' +
          escapeHtml(apeParts.first) +
          '" autocomplete="family-name" /></div>' +
          '<div class="dyn-field"><label>2do. Apellido</label>' +
          '<input type="text" id="esp-staff-segundo-apellido" class="esp-form-input" value="' +
          escapeHtml(apeParts.second) +
          '" autocomplete="family-name" /></div>' +
          '<div class="dyn-field"><label>Teléfono</label>' +
          '<input type="text" id="esp-staff-tel" class="esp-form-input" inputmode="numeric" maxlength="8" pattern="\\d{8}" placeholder="00000000" value="' +
          escapeHtml(e.telefono || "") +
          '" autocomplete="tel" /></div>' +
          '<div class="dyn-field"><label>Correo electrónico</label>' +
          '<input type="email" id="esp-staff-email" class="esp-form-input" pattern="[A-Za-z0-9._%+-]+@pipitos\\.com" placeholder="usuario@pipitos.com" value="' +
          escapeHtml(e.email || "") +
          '" autocomplete="email" /></div>' +
          '<div class="esp-status-row esp-form-grid-span2">' +
          '<span class="esp-status-label" id="esp-staff-activo-caption">Activa</span>' +
          '<div class="esp-switch" title="Estado del especialista">' +
          '<input type="checkbox" id="esp-staff-activo" class="esp-switch-input" ' +
          (e.activo ? "checked " : "") +
          'role="switch" aria-labelledby="esp-staff-activo-caption" />' +
          '<label for="esp-staff-activo" class="esp-switch-track"><span class="esp-switch-thumb"></span></label>' +
          "</div></div></div>" +
          buildEspecialidadesPanel(espCats, detIds, "") +
          "</div>" +
          '<div class="esp-form-actions esp-form-actions--footer">' +
          '<button type="button" class="btn-fluent esp-form-primary" id="esp-staff-save" data-edit-id="' +
          e.id +
          '">Guardar</button>' +
          '<button type="button" class="btn-fluent esp-form-btn-cancel" id="esp-staff-cancel">Cancelar</button></div></div>'
        );
      }
      return (
        '<div class="esp-form-placeholder">' +
        '<i class="fa-solid fa-user-doctor esp-form-placeholder-icon" aria-hidden="true"></i>' +
        '<p class="esp-form-placeholder-title">Especialistas clínicos</p>' +
        '<p class="dyn-muted">Seleccione una <strong>fila</strong> en la tabla para ver y editar la ficha, o pulse ' +
        "<strong>Nuevo especialista</strong> para dar de alta.</p></div>"
      );
    }

    return Promise.all([
      apiJson("/api/staff/especialistas?incluirInactivos=true"),
      apiJson("/api/catalog/by-tipo/ESPECIALIDAD"),
    ]).then(function (arr) {
      var allList = arr[0] || [];
      var espCats = arr[1] || [];

      var filtered = allList.filter(function (e) {
        if (!searchQ) return true;
        var name = staffFullName(e).toLowerCase();
        var email = (e.email || "").toLowerCase();
        var esp = (e.especialidades || []).join(" ").toLowerCase();
        return name.indexOf(searchQ) >= 0 || email.indexOf(searchQ) >= 0 || esp.indexOf(searchQ) >= 0;
      });

      var total = filtered.length;
      var totalPages = total === 0 ? 1 : Math.ceil(total / ESP_STAFF_PAGE);
      if (pageNum > totalPages) pageNum = totalPages;
      if (pageNum < 1) pageNum = 1;
      window.__hisEspStaffPage = pageNum;

      var start = (pageNum - 1) * ESP_STAFF_PAGE;
      var slice = filtered.slice(start, start + ESP_STAFF_PAGE);

      var pagHtml = "";
      if (total > ESP_STAFF_PAGE) {
        pagHtml =
          '<div class="esp-staff-page-nav">' +
          '<button type="button" class="esp-staff-page-btn" data-esp-staff-page="prev" ' +
          (pageNum <= 1 ? "disabled" : "") +
          ">‹</button>" +
          '<span>Página ' +
          pageNum +
          " de " +
          totalPages +
          "</span>" +
          '<button type="button" class="esp-staff-page-btn" data-esp-staff-page="next" ' +
          (pageNum >= totalPages ? "disabled" : "") +
          ">›</button></div>";
      }

      var startIdx = total === 0 ? 0 : start + 1;
      var endIdx = Math.min(start + ESP_STAFF_PAGE, total);
      var summaryText = total === 0 ? "Sin registros" : startIdx + "–" + endIdx + " de " + total;

      var tbody = "";
      slice.forEach(function (e) {
        var active = sel.kind === "edit" && sel.id === e.id;
        tbody +=
          '<tr class="' +
          (active ? "esp-table-row--active" : "") +
          '" data-esp-staff-id="' +
          e.id +
          '">' +
          "<td>" +
          escapeHtml(staffFullName(e)) +
          "</td><td>" +
          (e.activo
            ? '<span class="esp-staff-badge esp-staff-badge--on">Activo</span>'
            : '<span class="esp-staff-badge esp-staff-badge--off">Inactivo</span>') +
          "</td><td>" +
          escapeHtml(e.email || "—") +
          "</td></tr>";
      });

      if (!slice.length && total === 0 && !searchQ) {
        tbody =
          '<tr><td colspan="3" class="dyn-muted" style="padding:16px">No hay especialistas registrados.</td></tr>';
      } else if (!slice.length) {
        tbody =
          '<tr><td colspan="3" class="dyn-muted" style="padding:16px">Ningún resultado para la búsqueda.</td></tr>';
      }

      var html =
        '<div class="esp-split-layout">' +
        '<div class="esp-tree-panel dyn-card">' +
        '<div class="esp-tree-toolbar">' +
        '<div class="esp-tree-search-wrap">' +
        '<i class="fa-solid fa-magnifying-glass esp-tree-search-ico" aria-hidden="true"></i>' +
        '<input type="search" id="esp-staff-search" class="esp-tree-search-input" placeholder="Buscar por nombre, correo o especialidad…" autocomplete="off" />' +
        "</div>" +
        '<button type="button" class="btn-fluent esp-tree-add-btn" id="esp-staff-new">+ Agregar</button></div>' +
        '<div class="esp-tree-scroll">' +
        '<table class="dyn-table esp-table-in-panel"><thead><tr><th>Nombre</th><th>Estado</th><th>Correo</th></tr></thead><tbody id="esp-staff-table-body">' +
        tbody +
        "</tbody></table></div>" +
        '<div class="esp-staff-pagination" id="esp-staff-pagination">' +
        '<span id="esp-staff-summary">' +
        summaryText +
        "</span>" +
        '<span id="esp-staff-page-nav-wrap">' +
        pagHtml +
        "</span>" +
        "</div></div>" +
        '<div class="esp-form-panel dyn-card" id="esp-staff-form-panel">' +
        buildStaffFormPanel(allList, espCats) +
        "</div></div>";

      container.innerHTML = html;

      var searchEl = document.getElementById("esp-staff-search");
      if (searchEl) {
        searchEl.value = window.__hisEspStaffSearch || "";
        searchEl.addEventListener("input", function () {
          window.__hisEspStaffSearch = searchEl.value;
          window.__hisEspStaffPage = 1;
          renderStaffTable();
        });
      }

      function renderStaffTable() {
        var currentQ = String(window.__hisEspStaffSearch || "").trim().toLowerCase();
        var currentPage = window.__hisEspStaffPage || 1;
        var filteredLocal = allList.filter(function (e) {
          if (!currentQ) return true;
          var name = staffFullName(e).toLowerCase();
          var email = (e.email || "").toLowerCase();
          var esp = (e.especialidades || []).join(" ").toLowerCase();
          return name.indexOf(currentQ) >= 0 || email.indexOf(currentQ) >= 0 || esp.indexOf(currentQ) >= 0;
        });
        var totalLocal = filteredLocal.length;
        var totalPagesLocal = totalLocal === 0 ? 1 : Math.ceil(totalLocal / ESP_STAFF_PAGE);
        if (currentPage > totalPagesLocal) currentPage = totalPagesLocal;
        if (currentPage < 1) currentPage = 1;
        window.__hisEspStaffPage = currentPage;

        var startLocal = (currentPage - 1) * ESP_STAFF_PAGE;
        var sliceLocal = filteredLocal.slice(startLocal, startLocal + ESP_STAFF_PAGE);
        var tbodyLocal = "";
        sliceLocal.forEach(function (e) {
          var active = sel.kind === "edit" && sel.id === e.id;
          tbodyLocal +=
            '<tr class="' +
            (active ? "esp-table-row--active" : "") +
            '" data-esp-staff-id="' +
            e.id +
            '">' +
            "<td>" +
            escapeHtml(staffFullName(e)) +
            "</td><td>" +
            (e.activo
              ? '<span class="esp-staff-badge esp-staff-badge--on">Activo</span>'
              : '<span class="esp-staff-badge esp-staff-badge--off">Inactivo</span>') +
            "</td><td>" +
            escapeHtml(e.email || "—") +
            "</td></tr>";
        });
        if (!sliceLocal.length && totalLocal === 0 && !currentQ) {
          tbodyLocal =
            '<tr><td colspan="3" class="dyn-muted" style="padding:16px">No hay especialistas registrados.</td></tr>';
        } else if (!sliceLocal.length) {
          tbodyLocal =
            '<tr><td colspan="3" class="dyn-muted" style="padding:16px">Ningún resultado para la búsqueda.</td></tr>';
        }
        var bodyEl = document.getElementById("esp-staff-table-body");
        if (bodyEl) bodyEl.innerHTML = tbodyLocal;

        var startIdxLocal = totalLocal === 0 ? 0 : startLocal + 1;
        var endIdxLocal = Math.min(startLocal + ESP_STAFF_PAGE, totalLocal);
        var summaryLocal =
          totalLocal === 0 ? "Sin registros" : startIdxLocal + "–" + endIdxLocal + " de " + totalLocal;
        var summaryEl = document.getElementById("esp-staff-summary");
        if (summaryEl) summaryEl.textContent = summaryLocal;

        var pagWrap = document.getElementById("esp-staff-page-nav-wrap");
        if (pagWrap) {
          if (totalLocal > ESP_STAFF_PAGE) {
            pagWrap.innerHTML =
              '<div class="esp-staff-page-nav">' +
              '<button type="button" class="esp-staff-page-btn" data-esp-staff-page="prev" ' +
              (currentPage <= 1 ? "disabled" : "") +
              ">‹</button>" +
              "<span>Página " +
              currentPage +
              " de " +
              totalPagesLocal +
              "</span>" +
              '<button type="button" class="esp-staff-page-btn" data-esp-staff-page="next" ' +
              (currentPage >= totalPagesLocal ? "disabled" : "") +
              ">›</button></div>";
          } else {
            pagWrap.innerHTML = "";
          }
          pagWrap.querySelectorAll("[data-esp-staff-page]").forEach(function (btn) {
            btn.onclick = function () {
              var dir = btn.getAttribute("data-esp-staff-page");
              var np = currentPage + (dir === "next" ? 1 : -1);
              if (np < 1 || np > totalPagesLocal) return;
              window.__hisEspStaffPage = np;
              renderStaffTable();
            };
          });
        }

        container.querySelectorAll("tr[data-esp-staff-id]").forEach(function (row) {
          row.onclick = function () {
            var id = parseInt(row.getAttribute("data-esp-staff-id"), 10);
            if (isNaN(id)) return;
            window.__hisEspStaffSel = { kind: "edit", id: id };
            renderEspecialistas(container);
          };
        });
      }

      var btnNew = document.getElementById("esp-staff-new");
      if (btnNew) {
        btnNew.onclick = function () {
          window.__hisEspStaffSel = { kind: "new" };
          renderEspecialistas(container);
        };
      }

      renderStaffTable();

      var espSearchEl = document.getElementById("esp-staff-esp-search");
      var espTbodyEl = document.getElementById("esp-staff-esp-tbody");
      var espPagEl = document.getElementById("esp-staff-esp-pagination");
      var espSelection = {};
      var espPage = 1;
      var espPageSize = 3;
      var espInitial = (document.getElementById("esp-staff-esp-initial") || {}).value || "";
      if (espInitial) {
        espInitial.split(",").forEach(function (raw) {
          var id = parseInt(raw, 10);
          if (!isNaN(id)) espSelection[id] = true;
        });
      }
      espCats.forEach(function (c) {
        if (espSelection[c.id] == null) espSelection[c.id] = false;
      });

      function collectCatIds() {
        return Object.keys(espSelection)
          .filter(function (k) {
            return espSelection[k];
          })
          .map(function (k) {
            return parseInt(k, 10);
          });
      }

      function renderEspPicker() {
        if (!espTbodyEl || !espSearchEl || !espPagEl) return;
        var q = String(espSearchEl.value || "").trim().toLowerCase();
        window.__hisEspStaffEspSearch = q;
        var filtered = espCats.filter(function (c) {
          if (!q) return true;
          var nom = String(c.nombre || "").toLowerCase();
          var cod = String(c.codigo || "").toLowerCase();
          return nom.indexOf(q) >= 0 || cod.indexOf(q) >= 0;
        });
        var total = filtered.length;
        var totalPages = total === 0 ? 1 : Math.ceil(total / espPageSize);
        if (espPage < 1) espPage = 1;
        if (espPage > totalPages) espPage = totalPages;
        var start = (espPage - 1) * espPageSize;
        var slice = filtered.slice(start, start + espPageSize);
        espTbodyEl.innerHTML = buildEspRows(slice, espSelection);

        var startIdx = total === 0 ? 0 : start + 1;
        var endIdx = Math.min(start + espPageSize, total);
        var summary = total === 0 ? "Sin registros" : startIdx + "–" + endIdx + " de " + total;
        var nav = "";
        if (total > espPageSize) {
          nav =
            '<div class="esp-staff-page-nav">' +
            '<button type="button" class="esp-staff-page-btn" data-esp-picker-page="prev" ' +
            (espPage <= 1 ? "disabled" : "") +
            ">‹</button>" +
            '<span>Página ' +
            espPage +
            " de " +
            totalPages +
            "</span>" +
            '<button type="button" class="esp-staff-page-btn" data-esp-picker-page="next" ' +
            (espPage >= totalPages ? "disabled" : "") +
            ">›</button></div>";
        }
        espPagEl.innerHTML = "<span>" + summary + "</span>" + nav;
        espPagEl.querySelectorAll("[data-esp-picker-page]").forEach(function (btn) {
          btn.onclick = function () {
            var dir = btn.getAttribute("data-esp-picker-page");
            espPage = espPage + (dir === "next" ? 1 : -1);
            renderEspPicker();
          };
        });
        espTbodyEl.querySelectorAll('input[name="esp-staff-cat"]').forEach(function (cb) {
          cb.addEventListener("change", function () {
            var id = parseInt(cb.value, 10);
            if (isNaN(id)) return;
            espSelection[id] = !!cb.checked;
          });
        });
      }

      if (espSearchEl && espTbodyEl && espPagEl) {
        espSearchEl.value = window.__hisEspStaffEspSearch || "";
        espSearchEl.addEventListener("input", function () {
          espPage = 1;
          renderEspPicker();
        });
        renderEspPicker();
      }

      var telInput = document.getElementById("esp-staff-tel");
      if (telInput) {
        telInput.addEventListener("input", function () {
          var clean = String(telInput.value || "").replace(/\D/g, "").slice(0, 8);
          if (telInput.value !== clean) telInput.value = clean;
        });
      }

      function validateStaffContact(email, telefono) {
        var emailTxt = String(email || "").trim();
        var telTxt = String(telefono || "").trim();
        var emailRe = /^[A-Za-z0-9._%+-]+@pipitos\.com$/i;
        var telRe = /^\d{8}$/;
        if (emailTxt && !emailRe.test(emailTxt)) {
          throw new Error("El correo debe tener formato usuario@pipitos.com");
        }
        if (telTxt && !telRe.test(telTxt)) {
          throw new Error("El teléfono debe contener exactamente 8 dígitos");
        }
      }

      var btnSave = document.getElementById("esp-staff-save");
      if (btnSave) {
        btnSave.onclick = function () {
          var ids = collectCatIds();
          if (!ids.length) {
            notify("Seleccione al menos una especialidad", "warning");
            return;
          }
          var primerNombre = (document.getElementById("esp-staff-primer-nombre") || {}).value || "";
          var segundoNombre = (document.getElementById("esp-staff-segundo-nombre") || {}).value || "";
          var primerApellido = (document.getElementById("esp-staff-primer-apellido") || {}).value || "";
          var segundoApellido = (document.getElementById("esp-staff-segundo-apellido") || {}).value || "";
          if (!String(primerNombre).trim() || !String(primerApellido).trim()) {
            notify("Indique 1er. nombre y 1er. apellido", "warning");
            return;
          }
          var nombres = joinPersonParts(primerNombre, segundoNombre);
          var apellidos = joinPersonParts(primerApellido, segundoApellido);
          var emailEl = document.getElementById("esp-staff-email");
          var telEl = document.getElementById("esp-staff-tel");
          var emailValue = emailEl && emailEl.value ? emailEl.value.trim() : null;
          var telValue = telEl && telEl.value ? telEl.value.trim() : null;
          try {
            validateStaffContact(emailValue, telValue);
          } catch (vErr) {
            notify(vErr.message, "warning");
            return;
          }
          var editId = btnSave.getAttribute("data-edit-id");
          if (editId) {
            var activo = !!(document.getElementById("esp-staff-activo") || {}).checked;
            apiJson("/api/staff/especialistas/" + editId, {
              method: "PATCH",
              body: {
                nombres: nombres.trim(),
                apellidos: apellidos.trim(),
                email: emailValue,
                telefono: telValue,
                activo: activo,
                especialidadCatalogoIds: ids,
              },
            })
              .then(function () {
                notify("Especialista actualizado", "success");
                return renderEspecialistas(container);
              })
              .catch(function (err) {
                notify(err.message, "error");
              });
          } else {
            apiJson("/api/staff/especialistas", {
              method: "POST",
              body: {
                nombres: nombres.trim(),
                apellidos: apellidos.trim(),
                email: emailValue,
                telefono: telValue,
                especialidadCatalogoIds: ids,
              },
            })
              .then(function () {
                window.__hisEspStaffSel = { kind: "none" };
                notify("Especialista creado", "success");
                return renderEspecialistas(container);
              })
              .catch(function (err) {
                notify(err.message, "error");
              });
          }
        };
      }

      var btnCancel = document.getElementById("esp-staff-cancel");
      if (btnCancel) {
        btnCancel.onclick = function () {
          window.__hisEspStaffSel = { kind: "none" };
          renderEspecialistas(container);
        };
      }
    });
  }

  function repHistBadgeClass(estado) {
    const e = (estado || "").toUpperCase();
    if (e === "COMPLETADA") return "rep-hist-badge rep-hist-badge--ok";
    if (e === "CANCELADA") return "rep-hist-badge rep-hist-badge--muted";
    if (e === "NO_ASISTIO") return "rep-hist-badge rep-hist-badge--warn";
    return "rep-hist-badge rep-hist-badge--def";
  }

  /** Inicio del día local (AAAA-MM-DD) en ISO-UTC. */
  function repHistLocalDateStartIso(yyyyMmDd) {
    var p = String(yyyyMmDd || "").split("-");
    if (p.length < 3) return new Date(0).toISOString();
    var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10), 0, 0, 0, 0);
    return d.toISOString();
  }
  /**
   * Límite superior exclusivo al filtrar por fecha "hasta": primer instante del día siguiente al indicado
   * (misma semántica que c.inicioTs &lt; :hasta en repositorio).
   */
  function repHistLocalDateEndExclusiveIso(yyyyMmDd) {
    var p = String(yyyyMmDd || "").split("-");
    if (p.length < 3) return new Date(0).toISOString();
    var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10) + 1, 0, 0, 0, 0);
    return d.toISOString();
  }

  function repHistDateToYmd(dateObj) {
    var y = dateObj.getFullYear();
    var m = String(dateObj.getMonth() + 1).padStart(2, "0");
    var d = String(dateObj.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function repHistEnsureDefaultRange(desdeId, hastaId) {
    var el0 = document.getElementById(desdeId);
    var el1 = document.getElementById(hastaId);
    if (!el0 || !el1) return;
    var d0 = el0.value ? String(el0.value).trim() : "";
    var d1 = el1.value ? String(el1.value).trim() : "";
    if (d0 || d1) return;
    var today = new Date();
    var from = new Date(today.getTime());
    from.setDate(from.getDate() - 90);
    el0.value = repHistDateToYmd(from);
    el1.value = repHistDateToYmd(today);
  }

  function renderReportes(container) {
    if (container && container.id === "page-root") {
      container.className = "min-h-0 flex-1 flex flex-col his-page--reportes";
    }
    container.innerHTML =
      '<div class="rep-hist">' +
      '<div class="rep-hist-hero dyn-card">' +
      '<div class="rep-hist-hero-text">' +
      '<h2 class="rep-hist-title">Historial de citas</h2>' +
      '<p class="dyn-muted rep-hist-sub">Use el buscador (mismo criterio que en Citas) para elegir paciente, especialista o especialidad. Para mejor rendimiento, se autocompleta por defecto el rango de los últimos 90 días.</p>' +
      "</div></div>" +
      '<div class="rep-hist-tabs" role="tablist" aria-label="Tipo de informe">' +
      '<button type="button" role="tab" class="rep-hist-tab rep-hist-tab--active" id="rep-tab-pac" data-tab="pac" aria-selected="true">Por paciente</button>' +
      '<button type="button" role="tab" class="rep-hist-tab" id="rep-tab-esp" data-tab="esp" aria-selected="false">Por especialista</button>' +
      '<button type="button" role="tab" class="rep-hist-tab" id="rep-tab-esp2" data-tab="esp2" aria-selected="false">Por especialidad</button>' +
      "</div>" +
      '<div class="rep-hist-panel rep-hist-panel--active" id="rep-panel-pac" role="tabpanel" data-panel="pac">' +
      '<div class="dyn-card rep-hist-card">' +
      '<h3 class="rep-hist-h3">Citas del paciente</h3>' +
      '<div class="rep-hist-filters">' +
      '<div class="dyn-field rep-hist-field-pick"><label for="rep-pac-txt">Paciente</label>' +
      '<div class="cita-picker-field">' +
      '<input type="text" id="rep-pac-txt" class="esp-form-input cita-picker-input" readonly placeholder="Buscar paciente…" />' +
      '<input type="hidden" id="rep-pac-hid" value="" />' +
      '<button type="button" class="cita-picker-btn" id="rep-p-pick" title="Buscar paciente" aria-label="Buscar paciente"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i></button>' +
      "</div></div>" +
      '<div class="dyn-field"><label for="rep-pac-desde">Desde (opcional)</label><input type="date" class="esp-form-input" id="rep-pac-desde" /></div>' +
      '<div class="dyn-field"><label for="rep-pac-hasta">Hasta (opcional)</label><input type="date" class="esp-form-input" id="rep-pac-hasta" /></div>' +
      '<div class="rep-hist-filters-actions"><button type="button" class="btn-fluent" id="rep-pac-go">Consultar</button><button type="button" class="btn-fluent btn-fluent-secondary" id="rep-pac-print"><i class="fa-solid fa-print" aria-hidden="true"></i> Imprimir</button></div>' +
      "</div>" +
      '<p class="rep-hist-hint dyn-muted" id="rep-pac-hint">Pulse la lupa, escriba al menos un carácter (búsqueda en servidor), doble clic en un paciente y luego Consultar.</p>' +
      '<div class="rep-hist-summary" id="rep-pac-count"></div>' +
      '<div class="dyn-table-wrap rep-hist-table-wrap" id="rep-pac-table-wrap"></div>' +
      "</div></div>" +
      '<div class="rep-hist-panel hidden" id="rep-panel-esp" role="tabpanel" data-panel="esp">' +
      '<div class="dyn-card rep-hist-card">' +
      '<h3 class="rep-hist-h3">Citas del especialista</h3>' +
      '<div class="rep-hist-filters">' +
      '<div class="dyn-field rep-hist-field-pick"><label for="rep-esp-txt">Especialista</label>' +
      '<div class="cita-picker-field">' +
      '<input type="text" id="rep-esp-txt" class="esp-form-input cita-picker-input" readonly placeholder="Buscar especialista…" />' +
      '<input type="hidden" id="rep-esp-hid" value="" />' +
      '<button type="button" class="cita-picker-btn" id="rep-esp-pick" title="Buscar especialista" aria-label="Buscar especialista"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i></button>' +
      "</div></div>" +
      '<div class="dyn-field"><label for="rep-esp-desde">Desde (opcional)</label><input type="date" class="esp-form-input" id="rep-esp-desde" /></div>' +
      '<div class="dyn-field"><label for="rep-esp-hasta">Hasta (opcional)</label><input type="date" class="esp-form-input" id="rep-esp-hasta" /></div>' +
      '<div class="rep-hist-filters-actions"><button type="button" class="btn-fluent" id="rep-esp-go">Consultar</button><button type="button" class="btn-fluent btn-fluent-secondary" id="rep-esp-print"><i class="fa-solid fa-print" aria-hidden="true"></i> Imprimir</button></div>' +
      "</div>" +
      '<p class="rep-hist-hint dyn-muted" id="rep-esp-hint">Especialidad a la izquierda y doble clic en un profesional a la derecha, como en la pantalla Citas.</p>' +
      '<div class="rep-hist-summary" id="rep-esp-count"></div>' +
      '<div class="dyn-table-wrap rep-hist-table-wrap" id="rep-esp-table-wrap"></div>' +
      "</div></div>" +
      '<div class="rep-hist-panel hidden" id="rep-panel-esp2" role="tabpanel" data-panel="esp2">' +
      '<div class="dyn-card rep-hist-card">' +
      '<h3 class="rep-hist-h3">Citas por especialidad</h3>' +
      '<div class="rep-hist-filters">' +
      '<div class="dyn-field rep-hist-field-pick"><label for="rep-esp2-txt">Especialidad (catálogo)</label>' +
      '<div class="cita-picker-field">' +
      '<input type="text" id="rep-esp2-txt" class="esp-form-input cita-picker-input" readonly placeholder="Buscar especialidad…" />' +
      '<input type="hidden" id="rep-esp2-hid" value="" />' +
      '<button type="button" class="cita-picker-btn" id="rep-esp2-pick" title="Buscar especialidad" aria-label="Buscar especialidad"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i></button>' +
      "</div></div>" +
      '<div class="dyn-field"><label for="rep-esp2-desde">Desde (opcional)</label><input type="date" class="esp-form-input" id="rep-esp2-desde" /></div>' +
      '<div class="dyn-field"><label for="rep-esp2-hasta">Hasta (opcional)</label><input type="date" class="esp-form-input" id="rep-esp2-hasta" /></div>' +
      '<div class="rep-hist-filters-actions"><button type="button" class="btn-fluent" id="rep-esp2-go">Consultar</button><button type="button" class="btn-fluent btn-fluent-secondary" id="rep-esp2-print"><i class="fa-solid fa-print" aria-hidden="true"></i> Imprimir</button></div>' +
      "</div>" +
      '<p class="rep-hist-hint dyn-muted" id="rep-esp2-hint">Solo especialidades bajo unidad (igual que en citas). Doble clic en la tabla del modal elige la fila.</p>' +
      '<div class="rep-hist-summary" id="rep-esp2-count"></div>' +
      '<div class="dyn-table-wrap rep-hist-table-wrap" id="rep-esp2-table-wrap"></div>' +
      "</div></div></div>";

    function buildCitasTable(citas, maxRows, tableOpts) {
      tableOpts = tableOpts || {};
      var porPaciente = !!tableOpts.porPaciente;
      if (!citas || !citas.length) {
        return (
          '<p class="rep-hist-empty dyn-muted">No hay citas en el rango indicado o el filtro no devolvió resultados (respetando su alcance de agenda).</p>'
        );
      }
      var MAX_ROWS_RENDER = Math.max(1, maxRows || 400);
      var visible = citas.slice(0, MAX_ROWS_RENDER);
      var rows = visible
        .map(function (c) {
          var esps =
            c.especialidades && c.especialidades.length
              ? c.especialidades.map(function (x) { return escapeHtml(x); }).join(", ")
              : "—";
          var celdaEstado = porPaciente
            ? "<td>" + escapeHtml(c.estado || "—") + "</td>"
            : "<td><span class=\"" +
              repHistBadgeClass(c.estado) +
              '">' +
              escapeHtml(c.estado || "—") +
              "</span></td>";
          if (porPaciente) {
            return (
              "<tr>" +
              "<td>" +
              escapeHtml(fmtInstant(c.inicioTs)) +
              "</td>" +
              "<td>" +
              escapeHtml(c.especialistaNombre || "—") +
              "</td>" +
              "<td class=\"rep-hist-col-esps\">" +
              esps +
              "</td>" +
              "<td>" +
              escapeHtml(c.tipoCitaNombre || c.tipoCitaCodigo || "—") +
              "</td>" +
              celdaEstado +
              "<td>" +
              escapeHtml(c.salaNombre || "—") +
              "</td>" +
              "</tr>"
            );
          }
          return (
            "<tr>" +
            "<td>" +
            escapeHtml(fmtInstant(c.inicioTs)) +
            "</td>" +
            "<td>" +
            escapeHtml(c.pacienteNombre || "—") +
            "<div class=\"rep-hist-subcell\">Exp. " +
            escapeHtml(c.pacienteNumeroExpediente || "—") +
            "</div></td>" +
            "<td>" +
            escapeHtml(c.especialistaNombre || "—") +
            "</td>" +
            "<td class=\"rep-hist-col-esps\">" +
            esps +
            "</td>" +
            "<td>" +
            escapeHtml(c.tipoCitaNombre || c.tipoCitaCodigo || "—") +
            "</td>" +
            celdaEstado +
            "<td>" +
            escapeHtml(c.salaNombre || "—") +
            "</td>" +
            "</tr>"
          );
        })
        .join("");
      var truncMsg =
        citas.length > MAX_ROWS_RENDER
          ? '<p class="rep-hist-empty dyn-muted">Se muestran las primeras ' +
            MAX_ROWS_RENDER +
            " citas de " +
            citas.length +
            ". Ajuste el rango de fechas para ver un subconjunto más específico.</p>"
          : "";
      var thead = porPaciente
        ? "<th>Fecha</th><th>Especialista</th><th>Especialidades</th><th>Tipo de cita</th><th>Estado</th><th>Sala</th>"
        : "<th>Inicio</th><th>Paciente</th><th>Especialista</th><th>Especialidades</th><th>Tipo de cita</th><th>Estado</th><th>Sala</th>";
      return (
        truncMsg +
        "<table class=\"dyn-table rep-hist-table\"><thead><tr>" +
        thead +
        "</tr></thead><tbody>" +
        rows +
        "</tbody></table>"
      );
    }

    function repHistDateQueryFromInputs(desdeId, hastaId) {
      var el0 = document.getElementById(desdeId);
      var el1 = document.getElementById(hastaId);
      var d0 = el0 && el0.value ? String(el0.value).trim() : "";
      var d1 = el1 && el1.value ? String(el1.value).trim() : "";
      if (!d0 && !d1) {
        var now = new Date();
        var from = new Date(now.getTime());
        from.setDate(from.getDate() - 90);
        var dFrom = repHistDateToYmd(from);
        var dTo = repHistDateToYmd(now);
        if (el0) el0.value = dFrom;
        if (el1) el1.value = dTo;
        return (
          "desde=" +
          encodeURIComponent(repHistLocalDateStartIso(dFrom)) +
          "&hasta=" +
          encodeURIComponent(repHistLocalDateEndExclusiveIso(dTo))
        );
      }
      if (d0 && d1) {
        return (
          "desde=" +
          encodeURIComponent(repHistLocalDateStartIso(d0)) +
          "&hasta=" +
          encodeURIComponent(repHistLocalDateEndExclusiveIso(d1))
        );
      }
      if (d0) {
        return "desde=" + encodeURIComponent(repHistLocalDateStartIso(d0));
      }
      return "hasta=" + encodeURIComponent(repHistLocalDateEndExclusiveIso(d1));
    }

    function repHistFetchCitasWithFilter(desdeId, hastaId, filterName, filterVal) {
      var dq = repHistDateQueryFromInputs(desdeId, hastaId);
      var q = dq ? dq + "&" + filterName + "=" + encodeURIComponent(String(filterVal)) : filterName + "=" + encodeURIComponent(String(filterVal));
      return apiJson("/api/appointments?" + q);
    }

    function repHistRangeText(desdeId, hastaId) {
      var el0 = document.getElementById(desdeId);
      var el1 = document.getElementById(hastaId);
      var d0 = el0 && el0.value ? String(el0.value).trim() : "";
      var d1 = el1 && el1.value ? String(el1.value).trim() : "";
      if (!d0 && !d1) return "Sin filtro de fecha";
      if (d0 && d1) return d0 + " a " + d1;
      if (d0) return "Desde " + d0;
      return "Hasta " + d1;
    }

    function repHistPrintReport(title, subtitle, citas, tableOpts) {
      if (!citas || !citas.length) {
        notify("Primero consulte un reporte con resultados para poder imprimir.", "warning");
        return;
      }
      var tableHtml = buildCitasTable(citas, 2000, tableOpts || {});
      var genTime = new Date().toLocaleString("es-ES");
      var logoSvg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 56 56" aria-hidden="true"><rect width="56" height="56" rx="12" fill="#0c4a6e"/><path fill="#fff" d="M26 14h4v10h10v4H30v10h-4V28H16v-4h10V14z"/></svg>';
      var css =
        "@page{size:A4;margin:12mm}*{box-sizing:border-box}" +
        "body{font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;margin:0;color:#0f172a;background:#fff}" +
        ".sheet{max-width:190mm;margin:0 auto}" +
        ".head{display:flex;align-items:center;gap:14px;padding-bottom:12px;border-bottom:3px solid #0c4a6e;margin-bottom:14px}" +
        ".head h1{font-size:19px;margin:0 0 4px;color:#0c4a6e}" +
        ".sub{margin:0;color:#334155;font-size:12px}" +
        ".meta{margin-left:auto;text-align:right;color:#475569;font-size:11px}" +
        ".pill{display:inline-block;margin-top:5px;padding:2px 8px;border-radius:999px;background:#f1f5f9;border:1px solid #cbd5e1;font-size:11px}" +
        "table{width:100%;border-collapse:collapse;font-size:12px}" +
        "th,td{border:1px solid #cbd5e1;padding:6px;text-align:left;vertical-align:top}" +
        "th{background:#e2e8f0}" +
        ".rep-hist-subcell{color:#475569;font-size:11px}" +
        ".rep-hist-badge{display:inline-block;padding:2px 8px;border-radius:999px;border:1px solid #94a3b8}" +
        ".rep-hist-badge--ok{background:#dcfce7;border-color:#86efac}" +
        ".rep-hist-badge--warn{background:#fef9c3;border-color:#fde047}" +
        ".rep-hist-badge--muted{background:#e2e8f0;border-color:#cbd5e1}" +
        ".rep-hist-badge--def{background:#f1f5f9;border-color:#cbd5e1}" +
        "@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}";
      var html =
        "<!doctype html><html><head><meta charset=\"utf-8\"/><title>" +
        escapeHtml(title) +
        "</title><style>" +
        css +
        "</style></head><body><div class=\"sheet\"><header class=\"head\"><div>" +
        logoSvg +
        "</div><div><h1>" +
        escapeHtml(title) +
        "</h1><p class=\"sub\">" +
        escapeHtml(subtitle || "") +
        "</p></div><div class=\"meta\">Generado: " +
        escapeHtml(genTime) +
        "<br/><span class=\"pill\">Total de citas: " +
        escapeHtml(String(citas.length)) +
        "</span></div></header>" +
        tableHtml +
        "</div></body></html>";
      // iframe: evita about:blank en el pie al imprimir (típico de window.open(""))
      var frame = document.createElement("iframe");
      frame.setAttribute("aria-hidden", "true");
      frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
      document.body.appendChild(frame);
      var w = frame.contentWindow;
      if (!w) {
        document.body.removeChild(frame);
        notify("No se pudo preparar la vista de impresión.", "warning");
        return;
      }
      w.document.open();
      w.document.write(html);
      w.document.close();
      setTimeout(function () {
        try {
          w.focus();
          w.print();
        } catch (err) {
          notify("No fue posible lanzar la impresión del reporte.", "warning");
        }
        setTimeout(function () {
          if (frame.parentNode) {
            frame.parentNode.removeChild(frame);
          }
        }, 500);
      }, 180);
    }

    function setActiveTab(name) {
      var tabs = container.querySelectorAll(".rep-hist-tab");
      var panels = container.querySelectorAll(".rep-hist-panel");
      tabs.forEach(function (t) {
        var on = t.getAttribute("data-tab") === name;
        t.classList.toggle("rep-hist-tab--active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      panels.forEach(function (p) {
        var on = p.getAttribute("data-panel") === name;
        p.classList.toggle("hidden", !on);
        p.classList.toggle("rep-hist-panel--active", on);
      });
    }

    container.querySelectorAll(".rep-hist-tab").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setActiveTab(btn.getAttribute("data-tab"));
      });
    });

    return apiJson("/api/staff/especialistas")
      .catch(function () { return []; })
      .then(function (staffRaw) {
      var staff = staffRaw || [];
      staff.sort(function (a, b) {
        var na = (a.nombres || "") + " " + (a.apellidos || "");
        var nb = (b.nombres || "") + " " + (b.apellidos || "");
        return na.localeCompare(nb, "es", { sensitivity: "base" });
      });

      var btnP = document.getElementById("rep-p-pick");
      if (btnP) {
        btnP.onclick = function () {
          citaModalOpenPatientSearchPicker(function (paciente) {
            var name = ((paciente.nombres || "") + " " + (paciente.apellidos || "")).trim();
            var t = document.getElementById("rep-pac-txt");
            var h = document.getElementById("rep-pac-hid");
            if (t) t.value = name;
            if (h) h.value = String(paciente.id);
          });
        };
      }

      var btnE = document.getElementById("rep-esp-pick");
      if (btnE) {
        btnE.onclick = function () {
          citaModalOpenEspecialistaPorEspecialidad(staff, function (esp) {
            var name = ((esp.nombres || "") + " " + (esp.apellidos || "")).trim();
            var t = document.getElementById("rep-esp-txt");
            var h = document.getElementById("rep-esp-hid");
            if (t) t.value = name;
            if (h) h.value = String(esp.id);
          });
        };
      }

      var btnE2 = document.getElementById("rep-esp2-pick");
      if (btnE2) {
        btnE2.onclick = function () {
          citaModalOpenEspecialidadCatalogoPicker(function (cat) {
            var t = document.getElementById("rep-esp2-txt");
            var h = document.getElementById("rep-esp2-hid");
            if (t) t.value = (cat && cat.nombre) || (cat && cat.codigo) || "";
            if (h) h.value = cat && cat.id != null ? String(cat.id) : "";
          });
        };
      }

      var lastPacienteReport = [];
      var lastEspReport = [];
      var lastEsp2Report = [];

      function runPaciente() {
        var pid = (document.getElementById("rep-pac-hid") || {}).value;
        if (!String(pid).trim()) {
          notify("Busque y seleccione un paciente (doble clic en el modal).", "warning");
          return;
        }
        var hint = document.getElementById("rep-pac-hint");
        if (hint) hint.classList.add("hidden");
        repHistFetchCitasWithFilter("rep-pac-desde", "rep-pac-hasta", "pacienteId", pid)
          .then(function (data) {
            lastPacienteReport = data || [];
            document.getElementById("rep-pac-count").innerHTML =
              '<span class="rep-hist-pill">' + (data && data.length) + " cita" + (data && data.length === 1 ? "" : "s") + "</span>";
            document.getElementById("rep-pac-table-wrap").innerHTML = buildCitasTable(data, 400, { porPaciente: true });
          })
          .catch(function (e) {
            notify(e.message, "error");
          });
      }
      function runEsp() {
        var eid = (document.getElementById("rep-esp-hid") || {}).value;
        if (!String(eid).trim()) {
          notify("Busque y seleccione un especialista (doble clic en el modal).", "warning");
          return;
        }
        var hint = document.getElementById("rep-esp-hint");
        if (hint) hint.classList.add("hidden");
        repHistFetchCitasWithFilter("rep-esp-desde", "rep-esp-hasta", "especialistaId", eid)
          .then(function (data) {
            lastEspReport = data || [];
            document.getElementById("rep-esp-count").innerHTML =
              '<span class="rep-hist-pill">' + (data && data.length) + " cita" + (data && data.length === 1 ? "" : "s") + "</span>";
            document.getElementById("rep-esp-table-wrap").innerHTML = buildCitasTable(data);
          })
          .catch(function (e) {
            notify(e.message, "error");
          });
      }
      function runEsp2() {
        var cid = (document.getElementById("rep-esp2-hid") || {}).value;
        if (!String(cid).trim()) {
          notify("Busque y seleccione una especialidad (doble clic en el modal).", "warning");
          return;
        }
        var hint = document.getElementById("rep-esp2-hint");
        if (hint) hint.classList.add("hidden");
        repHistFetchCitasWithFilter("rep-esp2-desde", "rep-esp2-hasta", "especialidadCatalogoId", cid)
          .then(function (data) {
            lastEsp2Report = data || [];
            document.getElementById("rep-esp2-count").innerHTML =
              '<span class="rep-hist-pill">' + (data && data.length) + " cita" + (data && data.length === 1 ? "" : "s") + "</span>";
            document.getElementById("rep-esp2-table-wrap").innerHTML = buildCitasTable(data);
          })
          .catch(function (e) {
            notify(e.message, "error");
          });
      }

      document.getElementById("rep-pac-go").onclick = runPaciente;
      document.getElementById("rep-esp-go").onclick = runEsp;
      document.getElementById("rep-esp2-go").onclick = runEsp2;
      repHistEnsureDefaultRange("rep-pac-desde", "rep-pac-hasta");
      repHistEnsureDefaultRange("rep-esp-desde", "rep-esp-hasta");
      repHistEnsureDefaultRange("rep-esp2-desde", "rep-esp2-hasta");
      document.getElementById("rep-pac-print").onclick = function () {
        var name = ((document.getElementById("rep-pac-txt") || {}).value || "").trim() || "Paciente no especificado";
        var expVal = "";
        if (lastPacienteReport && lastPacienteReport.length) {
          for (var i = 0; i < lastPacienteReport.length; i++) {
            var e = lastPacienteReport[i].pacienteNumeroExpediente;
            if (e != null && String(e).trim() !== "") {
              expVal = String(e).trim();
              break;
            }
          }
        }
        var expLine = expVal ? " · N.º expediente: " + expVal : "";
        var sub = "Paciente: " + name + expLine + " | Fechas: " + repHistRangeText("rep-pac-desde", "rep-pac-hasta");
        repHistPrintReport("Reporte de citas por paciente", sub, lastPacienteReport, { porPaciente: true });
      };
      document.getElementById("rep-esp-print").onclick = function () {
        var name = ((document.getElementById("rep-esp-txt") || {}).value || "").trim() || "Especialista no especificado";
        repHistPrintReport("Reporte de citas por especialista", "Especialista: " + name + " | Fechas: " + repHistRangeText("rep-esp-desde", "rep-esp-hasta"), lastEspReport);
      };
      document.getElementById("rep-esp2-print").onclick = function () {
        var name = ((document.getElementById("rep-esp2-txt") || {}).value || "").trim() || "Especialidad no especificada";
        repHistPrintReport("Reporte de citas por especialidad", "Especialidad: " + name + " | Fechas: " + repHistRangeText("rep-esp2-desde", "rep-esp2-hasta"), lastEsp2Report);
      };
    });
  }

  window.HisApp = { initPage: initPage };
})();

