package org.lospipitos.his.scheduling;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/salas")
@PreAuthorize("isAuthenticated()")
public class SalaController {

    private final SalaRepository salaRepository;

    public SalaController(SalaRepository salaRepository) {
        this.salaRepository = salaRepository;
    }

    @GetMapping
    public List<SalaDto> activas() {
        return salaRepository.findByActivoTrueOrderByNombre().stream()
                .map(s -> new SalaDto(s.getId(), s.getCodigo(), s.getNombre()))
                .toList();
    }

    public record SalaDto(Long id, String codigo, String nombre) {}
}
