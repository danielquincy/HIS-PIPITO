package org.lospipitos.his.scheduling;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/appointments/{citaId}/vinculos")
@PreAuthorize("isAuthenticated()")
public class CitaVinculoController {

    private final CitaVinculoService citaVinculoService;

    public CitaVinculoController(CitaVinculoService citaVinculoService) {
        this.citaVinculoService = citaVinculoService;
    }

    @GetMapping
    public List<CitaVinculoService.VinculoDto> listar(@PathVariable Long citaId) {
        try {
            return citaVinculoService.listar(citaId);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PostMapping
    public CitaVinculoService.VinculoDto agregar(
            @PathVariable Long citaId, @Valid @RequestBody CitaVinculoService.AgregarVinculoRequest body) {
        try {
            return citaVinculoService.agregar(citaId, body);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @DeleteMapping("/{vinculoId}")
    public void eliminar(@PathVariable Long citaId, @PathVariable Long vinculoId) {
        try {
            citaVinculoService.eliminar(citaId, vinculoId);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
}
