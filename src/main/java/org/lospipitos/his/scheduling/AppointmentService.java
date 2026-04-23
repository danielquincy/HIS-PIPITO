package org.lospipitos.his.scheduling;

import jakarta.validation.constraints.NotNull;
import org.lospipitos.his.catalog.Catalogo;
import org.lospipitos.his.catalog.CatalogoRepository;
import org.lospipitos.his.patient.Paciente;
import org.lospipitos.his.patient.PacienteRepository;
import org.lospipitos.his.security.CurrentUserService;
import org.lospipitos.his.staff.Especialista;
import org.lospipitos.his.staff.EspecialistaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    public static final int DURACION_MINUTOS = 45;
    private static final int NO_SHOW_BLOQUEO_UMBRAL = 5;
    private static final Set<String> ESTADOS_VALIDOS =
            Set.of("PROGRAMADA", "COMPLETADA", "CANCELADA", "NO_ASISTIO");

    private final CitaRepository citaRepository;
    private final CitaFinancieroRepository citaFinancieroRepository;
    private final PacienteRepository pacienteRepository;
    private final EspecialistaRepository especialistaRepository;
    private final CatalogoRepository catalogoRepository;
    private final SalaRepository salaRepository;
    private final TipoCitaReglaRepository tipoCitaReglaRepository;
    private final AgendaScopeService agendaScopeService;
    private final AgendaRulesValidator agendaRulesValidator;
    private final CurrentUserService currentUserService;
    private final PacienteMetricaRepository pacienteMetricaRepository;
    private final CitaVinculoRepository citaVinculoRepository;
    private final WaitListService waitListService;
    private final PortalTokenService portalTokenService;

    public AppointmentService(
            CitaRepository citaRepository,
            CitaFinancieroRepository citaFinancieroRepository,
            PacienteRepository pacienteRepository,
            EspecialistaRepository especialistaRepository,
            CatalogoRepository catalogoRepository,
            SalaRepository salaRepository,
            TipoCitaReglaRepository tipoCitaReglaRepository,
            AgendaScopeService agendaScopeService,
            AgendaRulesValidator agendaRulesValidator,
            CurrentUserService currentUserService,
            PacienteMetricaRepository pacienteMetricaRepository,
            CitaVinculoRepository citaVinculoRepository,
            WaitListService waitListService,
            PortalTokenService portalTokenService) {
        this.citaRepository = citaRepository;
        this.citaFinancieroRepository = citaFinancieroRepository;
        this.pacienteRepository = pacienteRepository;
        this.especialistaRepository = especialistaRepository;
        this.catalogoRepository = catalogoRepository;
        this.salaRepository = salaRepository;
        this.tipoCitaReglaRepository = tipoCitaReglaRepository;
        this.agendaScopeService = agendaScopeService;
        this.agendaRulesValidator = agendaRulesValidator;
        this.currentUserService = currentUserService;
        this.pacienteMetricaRepository = pacienteMetricaRepository;
        this.citaVinculoRepository = citaVinculoRepository;
        this.waitListService = waitListService;
        this.portalTokenService = portalTokenService;
    }

    /**
     * Solo columnas necesarias para KPIs del panel de inicio (sin notas, vínculos, tipo de cita, sala, etc.).
     */
    @Transactional(readOnly = true)
    public List<CitaDashboardRow> queryDashboard(Instant desde, Instant hasta) {
        Optional<Set<Long>> scope = agendaScopeService.resolveAllowedEspecialistaIds();
        if (scope.isEmpty()) {
            return citaRepository.findDashboardRowsUnscoped(desde, hasta);
        }
        return citaRepository.findDashboardRowsScoped(desde, hasta, scope.get());
    }

    @Transactional(readOnly = true)
    public List<CitaResponse> query(
            Instant desde, Instant hasta, Long especialistaId, Long pacienteId, Long especialidadCatalogoId) {
        List<Cita> list = loadRaw(desde, hasta, especialistaId, pacienteId, especialidadCatalogoId);
        list = applyScope(list);
        return toResponseList(list);
    }

    /**
     * Todos los vínculos de tipo RECURSO para el conjunto de citas del rango (mismo alcance que {@link #query}).
     * Evita N+1 peticiones al listar reservas de recursos en el cliente.
     */
    @Transactional(readOnly = true)
    public List<RecursoVinculoBulkRow> listRecursoVinculosEnRango(Instant desde, Instant hasta) {
        Optional<Set<Long>> scope = agendaScopeService.resolveAllowedEspecialistaIds();
        List<CitaVinculo> rows;
        if (scope.isEmpty()) {
            rows = citaVinculoRepository.findRecursoVinculosEnRango(desde, hasta);
        } else {
            rows = citaVinculoRepository.findRecursoVinculosEnRangoEspecialistaIn(
                    desde, hasta, scope.get());
        }
        return rows.stream()
                .map(v -> new RecursoVinculoBulkRow(v.getCita().getId(), v.getId(), v.getRefId()))
                .toList();
    }

    /**
     * Citas de un solo recurso clínico o de una sola sala (panel Recursos, doble clic).
     * No cuenta vínculos por cita (evita N+1); el conteo en {@link CitaResponse} se devuelve en 0.
     */
    @Transactional(readOnly = true)
    public List<CitaResponse> queryPanelRecurso(Instant desde, Instant hasta, Long refId, Long salaId) {
        List<Cita> raw;
        if (salaId != null) {
            raw = citaRepository.findBySalaIdYPeriodo(salaId, desde, hasta);
        } else {
            if (refId == null) {
                throw new IllegalArgumentException("Indique refId o salaId.");
            }
            raw = citaRepository.findByRecursoRefIdYPeriodo(refId, desde, hasta);
        }
        raw = applyScope(raw);
        return raw.stream().map(c -> CitaResponse.from(c, 0L)).toList();
    }

    @Transactional(readOnly = true)
    public Page<CitaResponse> queryPage(
            Instant desde,
            Instant hasta,
            Long especialistaId,
            Long pacienteId,
            Long especialidadCatalogoId,
            Pageable pageable,
            String q) {
        if (especialidadCatalogoId != null || pacienteId != null || especialistaId != null) {
            return queryPageInMemory(
                    loadRaw(desde, hasta, especialistaId, pacienteId, especialidadCatalogoId), pageable, q);
        }
        String qPattern = buildSqlLikePattern(q);
        Optional<Set<Long>> scope = agendaScopeService.resolveAllowedEspecialistaIds();
        Page<Cita> page;
        if (scope.isEmpty()) {
            page = citaRepository.findPagedCitasListUnscoped(desde, hasta, qPattern, pageable);
        } else {
            page = citaRepository.findPagedCitasListScoped(
                    desde, hasta, scope.get(), qPattern, pageable);
        }
        return mapPageCitasWithVinculoCounts(page, pageable);
    }

    private static String buildSqlLikePattern(String q) {
        if (q == null || q.isBlank()) {
            return null;
        }
        return "%" + q.toLowerCase(Locale.ROOT).trim() + "%";
    }

    private Page<CitaResponse> queryPageInMemory(List<Cita> raw, Pageable pageable, String q) {
        List<Cita> all = applyScope(raw);
        String qPlain = (q == null || q.isBlank()) ? null : q.toLowerCase(Locale.ROOT).trim();
        if (qPlain != null) {
            all = all.stream().filter(c -> citaTextMatches(c, qPlain)).toList();
        }
        Sort.Order ord = pageable.getSort().getOrderFor("inicioTs");
        Comparator<Cita> byInicio = Comparator.comparing(Cita::getInicioTs);
        if (ord == null || ord.isDescending()) {
            byInicio = byInicio.reversed();
        }
        all = all.stream().sorted(byInicio).toList();
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), all.size());
        if (start > all.size()) {
            return new PageImpl<>(List.of(), pageable, all.size());
        }
        List<CitaResponse> slice = toResponseList(all.subList(start, end));
        return new PageImpl<>(slice, pageable, all.size());
    }

    private static boolean citaTextMatches(Cita c, String qLower) {
        var p = c.getPaciente();
        var st = c.getEspecialista() != null ? c.getEspecialista().getStaff() : null;
        var tipo = c.getTipoCita();
        var sala = c.getSala();
        var bag = String.join(
                        " ",
                        p != null ? p.getNombres() : "",
                        p != null ? p.getApellidos() : "",
                        p != null ? p.getNumeroExpediente() : "",
                        st != null ? st.getNombres() : "",
                        st != null ? st.getApellidos() : "",
                        c.getEstado() != null ? c.getEstado() : "",
                        tipo != null && tipo.getNombre() != null ? tipo.getNombre() : "",
                        tipo != null && tipo.getCodigo() != null ? tipo.getCodigo() : "",
                        sala != null && sala.getNombre() != null ? sala.getNombre() : "")
                .toLowerCase(Locale.ROOT);
        if (c.getEspecialista() != null
                && c.getEspecialista().getEspecialidades() != null) {
            for (var e : c.getEspecialista().getEspecialidades()) {
                if (e.getNombre() != null
                        && e.getNombre().toLowerCase(Locale.ROOT).contains(qLower)) {
                    return true;
                }
            }
        }
        return bag.contains(qLower);
    }

    private List<Cita> loadRaw(
            Instant desde, Instant hasta, Long especialistaId, Long pacienteId, Long especialidadCatalogoId) {
        if (especialidadCatalogoId != null) {
            return citaRepository.findByEspecialidadYPeriodo(especialidadCatalogoId, desde, hasta);
        }
        if (especialistaId != null) {
            return citaRepository.findByEspecialistaYPeriodo(especialistaId, desde, hasta);
        }
        if (pacienteId != null) {
            return citaRepository.findByPacienteYPeriodo(pacienteId, desde, hasta);
        }
        Optional<Set<Long>> scope = agendaScopeService.resolveAllowedEspecialistaIds();
        if (scope.isEmpty()) {
            return citaRepository.findByPeriodo(desde, hasta);
        }
        return citaRepository.findByPeriodoEspecialistaIn(desde, hasta, scope.get());
    }

    private List<Cita> applyScope(List<Cita> list) {
        Optional<Set<Long>> scope = agendaScopeService.resolveAllowedEspecialistaIds();
        if (scope.isEmpty()) {
            return list;
        }
        Set<Long> ids = scope.get();
        return list.stream().filter(c -> ids.contains(c.getEspecialista().getId())).toList();
    }

    private Map<Long, Long> vinculoCountsByCitaIds(List<Long> citaIds) {
        if (citaIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, Long> out = new HashMap<>();
        for (Object[] row : citaVinculoRepository.countByCitaIdGrouped(citaIds)) {
            out.put((Long) row[0], (Long) row[1]);
        }
        return out;
    }

    private List<CitaResponse> toResponseList(List<Cita> citas) {
        Map<Long, Long> counts = vinculoCountsByCitaIds(citas.stream().map(Cita::getId).toList());
        return citas.stream()
                .map(c -> CitaResponse.from(c, counts.getOrDefault(c.getId(), 0L)))
                .toList();
    }

    private Page<CitaResponse> mapPageCitasWithVinculoCounts(Page<Cita> page, Pageable pageable) {
        List<Cita> content = page.getContent();
        Map<Long, Long> counts = vinculoCountsByCitaIds(content.stream().map(Cita::getId).toList());
        List<CitaResponse> mapped = content.stream()
                .map(c -> CitaResponse.from(c, counts.getOrDefault(c.getId(), 0L)))
                .toList();
        return new PageImpl<>(mapped, pageable, page.getTotalElements());
    }

    @Transactional
    public CitaResponse create(CreateCitaRequest req) {
        if (!agendaScopeService.canAccessEspecialista(req.especialistaId())) {
            throw new IllegalArgumentException("No tiene permiso para agendar con este especialista.");
        }
        Paciente p = pacienteRepository.findById(req.pacienteId())
                .orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado"));
        Especialista e = especialistaRepository.findById(req.especialistaId())
                .orElseThrow(() -> new IllegalArgumentException("Especialista no encontrado"));

        assertNoNoShowBloqueo(p.getId());

        int duracionMin = DURACION_MINUTOS;
        int bufferAntes = 0;
        int bufferDespues = 0;
        Catalogo tipoCat = null;
        if (req.tipoCitaCatalogoId() != null) {
            tipoCat = catalogoRepository
                    .findById(req.tipoCitaCatalogoId())
                    .orElseThrow(() -> new IllegalArgumentException("Tipo de cita no encontrado"));
            TipoCitaRegla reglaTipo = tipoCitaReglaRepository
                    .findByCatalogoId(tipoCat.getId())
                    .orElse(null);
            if (reglaTipo != null) {
                duracionMin = reglaTipo.getDuracionMinutos();
                bufferAntes = reglaTipo.getBufferAntesMinutos();
                bufferDespues = reglaTipo.getBufferDespuesMinutos();
            }
        }

        Instant fin = req.inicio().plus(duracionMin, ChronoUnit.MINUTES);
        Instant bloqueIni = req.inicio().minus(bufferAntes, ChronoUnit.MINUTES);
        Instant bloqueFin = fin.plus(bufferDespues, ChronoUnit.MINUTES);

        assertNoSolape(e.getId(), bloqueIni, bloqueFin, null);
        assertNoSolapePaciente(p.getId(), req.inicio(), fin, null);

        Sala sala = null;
        if (req.salaId() != null) {
            sala = salaRepository
                    .findById(req.salaId())
                    .orElseThrow(() -> new IllegalArgumentException("Sala no encontrada"));
            assertNoSolapeSala(sala.getId(), bloqueIni, bloqueFin, null);
        }

        agendaRulesValidator.validateEspecialistaDia(e.getId(), req.inicio(), fin);
        if (sala != null) {
            agendaRulesValidator.validateSalaDia(sala.getId(), req.inicio(), fin);
        }

        Cita c = new Cita();
        c.setPaciente(p);
        c.setEspecialista(e);
        c.setInicioTs(req.inicio());
        c.setFinTs(fin);
        c.setDuracionMinutos(duracionMin);
        c.setEstado(normalizeEstado(req.estadoCodigo()));
        c.setNotas(req.notas());
        c.setTipoCita(tipoCat);
        c.setSala(sala);
        c.setMotivoTexto(req.motivoTexto());
        c.setOrigen(req.origen() != null ? req.origen() : "INTERNO");
        currentUserService.getCurrentUserId().ifPresent(c::setCreatedByUserId);

        Cita saved = citaRepository.save(c);
        upsertFinanciero(saved, req.montoIngreso(), req.montoCosto(), req.moneda(), null);
        return CitaResponse.from(saved, 0L);
    }

    @Transactional
    public CitaResponse update(Long citaId, UpdateCitaRequest req) {
        Cita c = citaRepository.findById(citaId).orElseThrow(() -> new IllegalArgumentException("Cita no encontrada"));
        if (!agendaScopeService.canAccessEspecialista(c.getEspecialista().getId())) {
            throw new IllegalArgumentException("No tiene permiso para modificar esta cita.");
        }
        if (!agendaScopeService.canAccessEspecialista(req.especialistaId())) {
            throw new IllegalArgumentException("No tiene permiso para agendar con este especialista.");
        }

        Paciente p = pacienteRepository.findById(req.pacienteId())
                .orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado"));
        Especialista e = especialistaRepository.findById(req.especialistaId())
                .orElseThrow(() -> new IllegalArgumentException("Especialista no encontrado"));

        int duracionMin = DURACION_MINUTOS;
        int bufferAntes = 0;
        int bufferDespues = 0;
        Catalogo tipoCat = null;
        if (req.tipoCitaCatalogoId() != null) {
            tipoCat = catalogoRepository
                    .findById(req.tipoCitaCatalogoId())
                    .orElseThrow(() -> new IllegalArgumentException("Tipo de cita no encontrado"));
            TipoCitaRegla reglaTipo = tipoCitaReglaRepository
                    .findByCatalogoId(tipoCat.getId())
                    .orElse(null);
            if (reglaTipo != null) {
                duracionMin = reglaTipo.getDuracionMinutos();
                bufferAntes = reglaTipo.getBufferAntesMinutos();
                bufferDespues = reglaTipo.getBufferDespuesMinutos();
            }
        }

        Instant fin = req.inicio().plus(duracionMin, ChronoUnit.MINUTES);
        Instant bloqueIni = req.inicio().minus(bufferAntes, ChronoUnit.MINUTES);
        Instant bloqueFin = fin.plus(bufferDespues, ChronoUnit.MINUTES);

        assertNoSolape(e.getId(), bloqueIni, bloqueFin, c.getId());
        assertNoSolapePaciente(p.getId(), req.inicio(), fin, c.getId());

        Sala sala = null;
        if (req.salaId() != null) {
            sala = salaRepository
                    .findById(req.salaId())
                    .orElseThrow(() -> new IllegalArgumentException("Sala no encontrada"));
            assertNoSolapeSala(sala.getId(), bloqueIni, bloqueFin, c.getId());
        }

        agendaRulesValidator.validateEspecialistaDia(e.getId(), req.inicio(), fin);
        if (sala != null) {
            agendaRulesValidator.validateSalaDia(sala.getId(), req.inicio(), fin);
        }

        c.setPaciente(p);
        c.setEspecialista(e);
        c.setInicioTs(req.inicio());
        c.setFinTs(fin);
        c.setDuracionMinutos(duracionMin);
        c.setNotas(req.notas());
        c.setTipoCita(tipoCat);
        c.setSala(sala);
        c.setUpdatedAt(Instant.now());
        currentUserService.getCurrentUserId().ifPresent(c::setUpdatedByUserId);

        assertVinculosRecursosNoSolape(c.getId(), c.getInicioTs(), c.getFinTs());
        Cita updated = citaRepository.save(c);
        return CitaResponse.from(
                updated, citaVinculoRepository.countByCita_Id(updated.getId()));
    }

    private void assertNoNoShowBloqueo(Long pacienteId) {
        if (currentUserService.hasFullAgendaAccess()) {
            return;
        }
        pacienteMetricaRepository
                .findById(pacienteId)
                .ifPresent(m -> {
                    if (m.getNoShowTotal() >= NO_SHOW_BLOQUEO_UMBRAL) {
                        throw new IllegalArgumentException(
                                "El paciente superó el umbral de inasistencias; requiere autorización.");
                    }
                });
    }

    @Transactional
    public CitaResponse updateEstado(Long citaId, String estadoCodigo) {
        Cita c = citaRepository.findById(citaId).orElseThrow(() -> new IllegalArgumentException("Cita no encontrada"));
        if (!agendaScopeService.canAccessEspecialista(c.getEspecialista().getId())) {
            throw new IllegalArgumentException("No tiene permiso para modificar esta cita.");
        }
        String nuevo = normalizeEstado(estadoCodigo);
        if ("CANCELADA".equals(nuevo)) {
            c.setCancelledAt(Instant.now());
            currentUserService.getCurrentUserId().ifPresent(c::setCancelledByUserId);
            waitListService.onHuecoLiberado(c.getEspecialista().getId());
        }
        if ("NO_ASISTIO".equals(nuevo)) {
            c.setInasistenciaMarcadaAt(Instant.now());
            currentUserService.getCurrentUserId().ifPresent(c::setInasistenciaMarcadaByUserId);
            incrementarNoShow(c.getPaciente().getId());
        }
        c.setEstado(nuevo);
        c.setUpdatedAt(Instant.now());
        currentUserService.getCurrentUserId().ifPresent(c::setUpdatedByUserId);
        Cita updated = citaRepository.save(c);
        return CitaResponse.from(
                updated, citaVinculoRepository.countByCita_Id(updated.getId()));
    }

    private void incrementarNoShow(Long pacienteId) {
        PacienteMetrica m = pacienteMetricaRepository
                .findById(pacienteId)
                .orElseGet(() -> {
                    PacienteMetrica x = new PacienteMetrica();
                    x.setPacienteId(pacienteId);
                    return x;
                });
        m.setNoShowTotal(m.getNoShowTotal() + 1);
        m.setNoShowUltimaTs(Instant.now());
        pacienteMetricaRepository.save(m);
    }

    @Transactional
    public PortalTokenDto generarPortalToken(Long citaId) {
        Cita c = citaRepository.findById(citaId).orElseThrow(() -> new IllegalArgumentException("Cita no encontrada"));
        if (!agendaScopeService.canAccessEspecialista(c.getEspecialista().getId())) {
            throw new IllegalArgumentException("No tiene permiso para esta cita.");
        }
        String token = portalTokenService.generarYGuardarToken(c);
        return new PortalTokenDto(token, portalTokenService.horasMinimasCancelacionPaciente());
    }

    @Transactional
    public CitaResponse updateFinanciero(Long citaId, UpdateFinancieroRequest req) {
        Cita c = citaRepository.findById(citaId).orElseThrow(() -> new IllegalArgumentException("Cita no encontrada"));
        if (!agendaScopeService.canAccessEspecialista(c.getEspecialista().getId())) {
            throw new IllegalArgumentException("No tiene permiso para modificar esta cita.");
        }
        upsertFinanciero(c, req.montoIngreso(), req.montoCosto(), req.moneda(), req.notas());
        return CitaResponse.from(c, citaVinculoRepository.countByCita_Id(c.getId()));
    }

    private void upsertFinanciero(Cita cita, BigDecimal ingreso, BigDecimal costo, String moneda, String notas) {
        if (ingreso == null && costo == null && moneda == null && notas == null) return;
        CitaFinanciero f = citaFinancieroRepository.findByCitaId(cita.getId()).orElseGet(() -> {
            CitaFinanciero nuevo = new CitaFinanciero();
            nuevo.setCita(cita);
            return nuevo;
        });
        f.setMontoIngreso(ingreso != null ? ingreso : (f.getMontoIngreso() != null ? f.getMontoIngreso() : BigDecimal.ZERO));
        f.setMontoCosto(costo != null ? costo : (f.getMontoCosto() != null ? f.getMontoCosto() : BigDecimal.ZERO));
        f.setMoneda(normalizeMoneda(moneda != null ? moneda : f.getMoneda()));
        f.setNotas(notas);
        citaFinancieroRepository.save(f);
    }

    private static String normalizeMoneda(String raw) {
        String m = raw == null ? "NIO" : raw.trim().toUpperCase(Locale.ROOT);
        if (m.isBlank()) return "NIO";
        if (m.length() != 3) throw new IllegalArgumentException("La moneda debe tener 3 caracteres");
        return m;
    }

    private static String normalizeEstado(String raw) {
        String estado = (raw == null || raw.isBlank()) ? "PROGRAMADA" : raw.trim().toUpperCase(Locale.ROOT);
        if (!ESTADOS_VALIDOS.contains(estado)) {
            throw new IllegalArgumentException("Estado de cita inválido");
        }
        return estado;
    }

    private void assertNoSolape(Long especialistaId, Instant inicio, Instant fin, Long excludeCitaId) {
        List<Cita> solapes = citaRepository.findSolapes(especialistaId, inicio, fin);
        if (excludeCitaId != null) {
            solapes = solapes.stream().filter(c -> !c.getId().equals(excludeCitaId)).toList();
        }
        if (!solapes.isEmpty()) {
            throw new IllegalArgumentException("Existe solape de agenda para este especialista en el horario indicado");
        }
    }

    private void assertNoSolapeSala(Long salaId, Instant inicio, Instant fin, Long excludeCitaId) {
        List<Cita> solapes = citaRepository.findSolapesSala(salaId, inicio, fin);
        if (excludeCitaId != null) {
            solapes = solapes.stream().filter(c -> !c.getId().equals(excludeCitaId)).toList();
        }
        if (!solapes.isEmpty()) {
            throw new IllegalArgumentException("Existe solape de agenda para esta sala en el horario indicado");
        }
    }

    private void assertNoSolapePaciente(Long pacienteId, Instant inicio, Instant fin, Long excludeCitaId) {
        List<Cita> solapes = citaRepository.findSolapesPaciente(pacienteId, inicio, fin);
        if (excludeCitaId != null) {
            solapes = solapes.stream().filter(s -> !s.getId().equals(excludeCitaId)).toList();
        }
        if (!solapes.isEmpty()) {
            throw new IllegalArgumentException(
                    "El paciente ya tiene otra cita activa que se superpone a este horario (no se permiten varias citas a la misma hora, ni con el mismo u otro especialista).");
        }
    }

    private void assertVinculosRecursosNoSolape(Long citaId, Instant inicio, Instant fin) {
        for (CitaVinculo v : citaVinculoRepository.findByCita_Id(citaId)) {
            if (v.getTipoVinculo() == null) {
                continue;
            }
            if (!"RECURSO".equalsIgnoreCase(v.getTipoVinculo().trim())) {
                continue;
            }
            if (!citaVinculoRepository
                    .findRecursosConSolape(v.getRefId(), inicio, fin, citaId)
                    .isEmpty()) {
                throw new IllegalArgumentException("Un recurso vinculado a la cita ya está reservado en otra cita en el mismo horario");
            }
        }
    }

    public record CreateCitaRequest(
            @NotNull Long pacienteId,
            @NotNull Long especialistaId,
            @NotNull Instant inicio,
            String estadoCodigo,
            String notas,
            BigDecimal montoIngreso,
            BigDecimal montoCosto,
            String moneda,
            Long tipoCitaCatalogoId,
            Long salaId,
            String motivoTexto,
            String origen) {}

    public record UpdateFinancieroRequest(
            BigDecimal montoIngreso,
            BigDecimal montoCosto,
            String moneda,
            String notas) {}

    public record UpdateCitaRequest(
            @NotNull Long pacienteId,
            @NotNull Long especialistaId,
            @NotNull Instant inicio,
            String notas,
            Long tipoCitaCatalogoId,
            Long salaId) {}

    public record PortalTokenDto(String token, int horasMinimasCancelacionPaciente) {}

    public record RecursoVinculoBulkRow(long citaId, long vinculoId, long refId) {}

    public record CitaResponse(
            Long id,
            Long pacienteId,
            String pacienteNombre,
            String pacienteNumeroExpediente,
            Long especialistaId,
            String especialistaNombre,
            List<String> especialidades,
            Instant inicioTs,
            Instant finTs,
            int duracionMinutos,
            String estado,
            String notas,
            Long tipoCitaCatalogoId,
            String tipoCitaCodigo,
            String tipoCitaNombre,
            Long salaId,
            String salaNombre,
            String motivoTexto,
            String origen,
            Long createdByUserId,
            long vinculosCount) {
        static CitaResponse from(Cita c, long vinculosCount) {
            String pn = c.getPaciente().getNombres() + " " + c.getPaciente().getApellidos();
            String en = c.getEspecialista().getStaff().getNombres() + " " + c.getEspecialista().getStaff().getApellidos();
            List<String> espNombres = c.getEspecialista().getEspecialidades().stream()
                    .map(Catalogo::getNombre)
                    .sorted(String.CASE_INSENSITIVE_ORDER)
                    .toList();
            Catalogo tipo = c.getTipoCita();
            Sala sala = c.getSala();
            return new CitaResponse(
                    c.getId(),
                    c.getPaciente().getId(),
                    pn,
                    c.getPaciente().getNumeroExpediente(),
                    c.getEspecialista().getId(),
                    en,
                    espNombres,
                    c.getInicioTs(),
                    c.getFinTs(),
                    c.getDuracionMinutos(),
                    c.getEstado(),
                    c.getNotas(),
                    tipo != null ? tipo.getId() : null,
                    tipo != null ? tipo.getCodigo() : null,
                    tipo != null ? tipo.getNombre() : null,
                    sala != null ? sala.getId() : null,
                    sala != null ? sala.getNombre() : null,
                    c.getMotivoTexto(),
                    c.getOrigen(),
                    c.getCreatedByUserId(),
                    vinculosCount);
        }
    }
}
