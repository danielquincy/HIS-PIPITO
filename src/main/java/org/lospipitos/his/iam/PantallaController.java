package org.lospipitos.his.iam;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
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
@RequestMapping("/api/iam/pantallas")
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_IAM_MASTER')")
public class PantallaController {

    private final PantallaService pantallaService;

    public PantallaController(PantallaService pantallaService) {
        this.pantallaService = pantallaService;
    }

    @GetMapping
    public java.util.List<PantallaService.PantallaDto> list() {
        return pantallaService.listOrdered();
    }

    @GetMapping("/{id}")
    public PantallaService.PantallaDto get(@PathVariable Long id) {
        return pantallaService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PantallaService.PantallaDto create(@Valid @RequestBody SavePantallaRequest body) {
        return pantallaService.create(
                body.codigo(),
                body.nombre(),
                body.descripcion(),
                body.ruta(),
                body.orden(),
                body.activo(),
                body.tipo(),
                body.parentId());
    }

    @PutMapping("/{id}")
    public PantallaService.PantallaDto update(@PathVariable Long id, @Valid @RequestBody SavePantallaRequest body) {
        return pantallaService.update(
                id,
                body.codigo(),
                body.nombre(),
                body.descripcion(),
                body.ruta(),
                body.orden(),
                body.activo(),
                body.tipo(),
                body.parentId());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        pantallaService.delete(id);
    }

    @PutMapping("/{id}/roles")
    public PantallaService.PantallaDto setRoles(@PathVariable Long id, @Valid @RequestBody PantallaRolesRequest body) {
        Set<Long> ids = body.roleIds() != null ? Set.copyOf(body.roleIds()) : Set.of();
        return pantallaService.setRoles(id, ids);
    }

    public record SavePantallaRequest(
            @NotBlank String codigo,
            @NotBlank String nombre,
            String descripcion,
            String ruta,
            @NotNull TipoPantalla tipo,
            Long parentId,
            @NotNull Integer orden,
            @NotNull Boolean activo) {}

    public record PantallaRolesRequest(Set<Long> roleIds) {}
}
