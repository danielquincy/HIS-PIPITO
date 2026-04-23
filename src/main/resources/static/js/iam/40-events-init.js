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

  document.getElementById("membresias-roles-search").addEventListener("input", function () {
    renderMembresiaRolesTable();
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

  document.getElementById("b-unlock").addEventListener("change", function () {
    syncBlockedUnlockUi();
  });

  document.getElementById("b-gen-btn").onclick = function () {
    document.getElementById("b-password").value = randomPwd();
    document.getElementById("b-password").type = "text";
    document.getElementById("b-password-eye").innerHTML = '<i class="fa-solid fa-eye-slash" aria-hidden="true"></i>';
  };

  document.getElementById("b-password-eye").onclick = function () {
    var p = document.getElementById("b-password");
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
    var roles = collectMembresiaRoleNames();
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

  document.getElementById("btn-blocked-save").onclick = function () {
    if (!selectedBlockedId) return;
    if (!document.getElementById("b-unlock").checked) {
      showAlert("Marque el switch Desbloquear para continuar", true);
      return;
    }
    var newPassword = document.getElementById("b-password").value;
    var temporal = document.getElementById("b-temporal").checked;
    apiFetch("/api/iam/blocked-users/" + selectedBlockedId + "/unlock", {
      method: "POST",
      body: {
        newPassword: newPassword || null,
        temporalPassword: temporal,
      },
    })
      .then(function (res) {
        if (!res.ok) {
          return res.json().then(function (j) {
            throw new Error(j.message || "No se pudo desbloquear");
          });
        }
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
