package org.lospipitos.his.scheduling;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

/**
 * Citas clínicas: los instantes de la API están en UTC (ISO-8601). El cliente debe convertir a la zona local
 * de la clínica para mostrar horarios. El listado sin paginar y el paginado comparten un tope máximo de días
 * de intervalo ({@link #MAX_INTERVAL_DAYS}).
 */
@RestController
@RequestMapping("/api/appointments")
@PreAuthorize("isAuthenticated()")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    /** Debe cubrir la pantalla Citas (±1 año ≈ 730 días) y la Agenda (rangos cortos). */
    private static final long MAX_INTERVAL_DAYS = 800;
    /**
     * Si el listado se filtra por paciente, especialista o especialidad, se permite un rango mucho
     * más largo (p. ej. reportes con fechas omitidas o históricos amplios).
     */
    private static final long MAX_INTERVAL_DAYS_CON_CITERIO = 50_000L;

    /**
     * Panel de inicio: proyección reducida (mismo rango y ámbito que el listado de citas, sin payload completo).
     */
    @GetMapping("/dashboard")
    public List<CitaDashboardRow> dashboard(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant hasta) {
        Rango r = resolveRango(desde, hasta, false);
        return appointmentService.queryDashboard(r.desde, r.hasta);
    }

    @GetMapping
    public List<AppointmentService.CitaResponse> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant hasta,
            @RequestParam(required = false) Long especialistaId,
            @RequestParam(required = false) Long pacienteId,
            @RequestParam(required = false) Long especialidadCatalogoId) {
        boolean criterioCita = pacienteId != null || especialistaId != null || especialidadCatalogoId != null;
        Rango r = resolveRango(desde, hasta, criterioCita);
        return appointmentService.query(r.desde, r.hasta, especialistaId, pacienteId, especialidadCatalogoId);
    }

    /**
     * Paginación sobre el mismo rango temporal que {@link #list}; orden por defecto inicioTs descendente.
     */
    @GetMapping("/page")
    public Page<AppointmentService.CitaResponse> listPage(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant hasta,
            @RequestParam(required = false) Long especialistaId,
            @RequestParam(required = false) Long pacienteId,
            @RequestParam(required = false) Long especialidadCatalogoId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "inicioTs,desc") String sort,
            @RequestParam(required = false) String q) {
        boolean criterioCita = pacienteId != null || especialistaId != null || especialidadCatalogoId != null;
        Rango r = resolveRango(desde, hasta, criterioCita);
        Sort s = parseSort(sort);
        PageRequest pr = PageRequest.of(Math.max(0, page), Math.min(200, Math.max(1, size)), s);
        return appointmentService.queryPage(r.desde, r.hasta, especialistaId, pacienteId, especialidadCatalogoId, pr, q);
    }

    /**
     * Todos los vínculos de recurso (tipo RECURSO) para las citas del rango, en una sola consulta.
     * Sustituye a N llamadas a {@code /api/appointments/{id}/vinculos} en la pantalla Recursos.
     */
    @GetMapping("/recurso-vinculos-bulk")
    public List<AppointmentService.RecursoVinculoBulkRow> recursoVinculosBulk(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant hasta) {
        Rango r = resolveRango(desde, hasta, false);
        return appointmentService.listRecursoVinculosEnRango(r.desde, r.hasta);
    }

    /**
     * Listado mínimo para el panel al hacer doble clic en un recurso: una sola consulta, sin bulk global.
     * Debe usarse con {@code refId} (recurso clínico) o {@code salaId} (mismo criterio que en pantalla), no ambos.
     */
    @GetMapping("/panel-recurso")
    public List<AppointmentService.CitaResponse> panelRecurso(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant hasta,
            @RequestParam(required = false) Long refId,
            @RequestParam(required = false) Long salaId) {
        if ((refId == null) == (salaId == null)) {
            throw new ResponseStatusException(
                    BAD_REQUEST, "Debe indicar refId o salaId, de forma excluyente, junto con desde y hasta.");
        }
        Rango r = resolveRango(desde, hasta, true);
        try {
            return appointmentService.queryPanelRecurso(r.desde, r.hasta, refId, salaId);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(BAD_REQUEST, e.getMessage());
        }
    }

    private record Rango(Instant desde, Instant hasta) {}

    /**
     * Fechas omitidas: si hay criterio (paciente / especialista / especialidad) se asume rango
     * amplio; si no, hace falta al menos un rango explícito (comportamiento agenda / listado de citas).
     */
    private static Rango resolveRango(Instant desde, Instant hasta, boolean criterioCita) {
        if (desde == null && hasta == null) {
            if (criterioCita) {
                return new Rango(Instant.parse("2000-01-01T00:00:00Z"), Instant.parse("2100-01-01T00:00:00Z"));
            }
            throw new ResponseStatusException(
                    BAD_REQUEST, "Indique rango de fechas (desde y hasta) o al menos un criterio de cita.");
        }
        Instant d0;
        if (desde == null) {
            d0 = Instant.parse("2000-01-01T00:00:00Z");
        } else {
            d0 = desde;
        }
        Instant d1;
        if (hasta == null) {
            d1 = Instant.parse("2100-01-01T00:00:00Z");
        } else {
            d1 = hasta;
        }
        if (d1.isBefore(d0)) {
            throw new ResponseStatusException(BAD_REQUEST, "La fecha hasta debe ser posterior o igual a desde.");
        }
        long days = Duration.between(d0, d1).toDays();
        long max = criterioCita ? MAX_INTERVAL_DAYS_CON_CITERIO : MAX_INTERVAL_DAYS;
        if (days > max) {
            throw new ResponseStatusException(
                    BAD_REQUEST, "El intervalo de búsqueda no puede superar " + max + " días.");
        }
        return new Rango(d0, d1);
    }

    private static Sort parseSort(String raw) {
        String[] p = raw.split(",");
        String prop = p[0].trim();
        if (prop.isEmpty()) prop = "inicioTs";
        Sort.Direction dir =
                p.length > 1 && "asc".equalsIgnoreCase(p[1].trim()) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(dir, prop);
    }

    @PostMapping
    public AppointmentService.CitaResponse create(@Valid @RequestBody AppointmentService.CreateCitaRequest body) {
        return appointmentService.create(body);
    }

    @PatchMapping("/{id}")
    public AppointmentService.CitaResponse update(
            @PathVariable Long id,
            @Valid @RequestBody AppointmentService.UpdateCitaRequest body) {
        return appointmentService.update(id, body);
    }

    @PostMapping("/{id}/portal-token")
    public AppointmentService.PortalTokenDto portalToken(@PathVariable Long id) {
        try {
            return appointmentService.generarPortalToken(id);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(BAD_REQUEST, e.getMessage());
        }
    }

    public record EstadoUpdate(String estadoCodigo) {}

    @PatchMapping("/{id}/estado")
    public AppointmentService.CitaResponse estado(@PathVariable Long id, @RequestBody EstadoUpdate body) {
        return appointmentService.updateEstado(id, body.estadoCodigo());
    }

    @PatchMapping("/{id}/financiero")
    public AppointmentService.CitaResponse financiero(
            @PathVariable Long id,
            @RequestBody AppointmentService.UpdateFinancieroRequest body) {
        return appointmentService.updateFinanciero(id, body);
    }
}
