package org.lospipitos.his.scheduling;

import jakarta.servlet.http.HttpServletRequest;
import org.lospipitos.his.security.CurrentUserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/compliance")
@PreAuthorize("isAuthenticated()")
public class ComplianceController {

    private final ComplianceService complianceService;
    private final CurrentUserService currentUserService;

    public ComplianceController(ComplianceService complianceService, CurrentUserService currentUserService) {
        this.complianceService = complianceService;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/pacientes/{pacienteId}/consentimientos")
    public ComplianceService.ConsentimientoDto registrarConsentimiento(
            @PathVariable Long pacienteId, @RequestBody ComplianceService.ConsentimientoRequest body) {
        try {
            return complianceService.registrarConsentimiento(pacienteId, body, currentUserService.getCurrentUserId());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @GetMapping("/pacientes/{pacienteId}/consentimientos")
    public List<ComplianceService.ConsentimientoDto> listarConsentimientos(@PathVariable Long pacienteId) {
        try {
            return complianceService.listarConsentimientos(pacienteId);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PostMapping("/accesos")
    public void registrarAcceso(@RequestBody ComplianceService.AccesoRegistroRequest body, HttpServletRequest http) {
        complianceService.registrarAcceso(body, currentUserService.getCurrentUserId(), http.getRemoteAddr());
    }

    @GetMapping("/accesos")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    public Page<AccesoDatosLog> listarAccesos(Pageable pageable) {
        return complianceService.pageAccesos(pageable);
    }
}
