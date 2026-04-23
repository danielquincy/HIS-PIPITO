package org.lospipitos.his.iam;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;

@RestController
@RequestMapping("/api/iam/roles")
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_IAM_MASTER')")
public class RoleController {

    private final RoleService roleService;

    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    @GetMapping
    public java.util.List<RoleService.RoleDto> list() {
        return roleService.listOrdered();
    }

    @GetMapping("/{id}")
    public RoleService.RoleDetailDto get(@PathVariable Long id) {
        return roleService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RoleService.RoleDto create(@Valid @RequestBody SaveRoleRequest body) {
        return roleService.create(body.codigo(), body.nombre(), body.activo() != null && body.activo());
    }

    @PutMapping("/{id}")
    public RoleService.RoleDto update(@PathVariable Long id, @Valid @RequestBody UpdateRoleRequest body) {
        return roleService.update(id, body.nombre(), body.activo() != null && body.activo());
    }

    @PutMapping("/{id}/pantallas")
    public RoleService.RoleDetailDto setPantallas(@PathVariable Long id, @Valid @RequestBody RolePantallasRequest body) {
        Set<Long> ids = body.pantallaIds() != null ? Set.copyOf(body.pantallaIds()) : Set.of();
        return roleService.setPantallas(id, ids);
    }

    public record SaveRoleRequest(
            @NotBlank String codigo,
            @NotBlank String nombre,
            @NotNull Boolean activo) {}

    public record UpdateRoleRequest(@NotBlank String nombre, @NotNull Boolean activo) {}

    public record RolePantallasRequest(Set<Long> pantallaIds) {}
}
