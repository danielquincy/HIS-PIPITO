package org.lospipitos.his.staff;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
public class StaffController {

    private final StaffService staffService;

    public StaffController(StaffService staffService) {
        this.staffService = staffService;
    }

    @GetMapping("/especialistas")
    @PreAuthorize("isAuthenticated()")
    public List<StaffService.EspecialistaResponse> listEspecialistas(
            @RequestParam(value = "incluirInactivos", defaultValue = "false") boolean incluirInactivos) {
        return staffService.listEspecialistas(incluirInactivos);
    }

    @PostMapping("/especialistas")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @ResponseStatus(HttpStatus.CREATED)
    public StaffService.EspecialistaResponse create(@Valid @RequestBody StaffService.CreateEspecialistaRequest body) {
        return staffService.createEspecialista(body);
    }

    @PatchMapping("/especialistas/{id}/especialidades")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    public StaffService.EspecialistaResponse updateEspecialidades(
            @PathVariable Long id,
            @RequestBody StaffService.UpdateEspecialidadesRequest body) {
        return staffService.updateEspecialidades(id, body.especialidadCatalogoIds());
    }

    @PatchMapping("/especialistas/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    public StaffService.EspecialistaResponse updateEspecialista(
            @PathVariable Long id, @Valid @RequestBody StaffService.UpdateEspecialistaRequest body) {
        return staffService.updateEspecialista(id, body);
    }
}
