package org.lospipitos.his.scheduling;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;

@RestController
@RequestMapping("/api/public/citas")
public class PublicCitaController {

    private final CitaPortalTokenRepository citaPortalTokenRepository;
    private final CitaRepository citaRepository;
    private final PortalTokenService portalTokenService;
    private final WaitListService waitListService;

    public PublicCitaController(
            CitaPortalTokenRepository citaPortalTokenRepository,
            CitaRepository citaRepository,
            PortalTokenService portalTokenService,
            WaitListService waitListService) {
        this.citaPortalTokenRepository = citaPortalTokenRepository;
        this.citaRepository = citaRepository;
        this.portalTokenService = portalTokenService;
        this.waitListService = waitListService;
    }

    @PostMapping("/{token}/confirmar")
    @Transactional
    public void confirmar(@PathVariable String token) {
        CitaPortalToken row = resolveToken(token);
        if (!row.isPuedeConfirmar()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acción no permitida para este enlace.");
        }
        Cita c = row.getCita();
        if ("PROGRAMADA".equals(c.getEstado())) {
            c.setUpdatedAt(Instant.now());
            citaRepository.save(c);
        }
    }

    @PostMapping("/{token}/cancelar")
    @Transactional
    public void cancelar(@PathVariable String token) {
        CitaPortalToken row = resolveToken(token);
        if (!row.isPuedeCancelar()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acción no permitida para este enlace.");
        }
        Cita c = row.getCita();
        int horasMin = portalTokenService.horasMinimasCancelacionPaciente();
        long horasAntes = Duration.between(Instant.now(), c.getInicioTs()).toHours();
        if (horasAntes < horasMin) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "No puede cancelar con menos de " + horasMin + " horas de anticipación.");
        }
        c.setEstado("CANCELADA");
        c.setCancelledAt(Instant.now());
        c.setCancelReason("Cancelado por paciente (portal)");
        c.setUpdatedAt(Instant.now());
        citaRepository.save(c);
        waitListService.onHuecoLiberado(c.getEspecialista().getId());
    }

    private CitaPortalToken resolveToken(String token) {
        String hash = PortalTokenService.sha256Hex(token);
        CitaPortalToken row = citaPortalTokenRepository
                .findByTokenHash(hash)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Enlace inválido o expirado."));
        if (row.getExpiraTs().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.GONE, "El enlace ha expirado.");
        }
        return row;
    }
}
