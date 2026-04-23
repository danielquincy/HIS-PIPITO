package org.lospipitos.his.scheduling;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/wait-list")
@PreAuthorize("isAuthenticated()")
public class WaitListApiController {

    private final WaitListService waitListService;
    private final AgendaScopeService agendaScopeService;

    public WaitListApiController(WaitListService waitListService, AgendaScopeService agendaScopeService) {
        this.waitListService = waitListService;
        this.agendaScopeService = agendaScopeService;
    }

    @PostMapping
    public WaitListService.ListaEsperaDto encolar(@RequestBody WaitListService.EncolarListaRequest body) {
        if (body.especialistaId() != null && !agendaScopeService.canAccessEspecialista(body.especialistaId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sin acceso a agenda de este especialista.");
        }
        try {
            return waitListService.encolar(body);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @GetMapping
    public List<WaitListService.ListaEsperaDto> pendientes(@RequestParam Long especialistaId) {
        if (!agendaScopeService.canAccessEspecialista(especialistaId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sin acceso a agenda de este especialista.");
        }
        return waitListService.listarPendientesPorEspecialista(especialistaId);
    }
}
