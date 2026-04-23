package org.lospipitos.his.scheduling;

import org.lospipitos.his.catalog.Catalogo;
import org.lospipitos.his.catalog.CatalogoRepository;
import org.lospipitos.his.patient.Paciente;
import org.lospipitos.his.patient.PacienteRepository;
import org.lospipitos.his.staff.Especialista;
import org.lospipitos.his.staff.EspecialistaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WaitListService {

    public static final String ESTADO_PENDIENTE = "PENDIENTE";

    private final CitaListaEsperaRepository citaListaEsperaRepository;
    private final NotificationService notificationService;
    private final PacienteRepository pacienteRepository;
    private final EspecialistaRepository especialistaRepository;
    private final SalaRepository salaRepository;
    private final CatalogoRepository catalogoRepository;

    public WaitListService(
            CitaListaEsperaRepository citaListaEsperaRepository,
            NotificationService notificationService,
            PacienteRepository pacienteRepository,
            EspecialistaRepository especialistaRepository,
            SalaRepository salaRepository,
            CatalogoRepository catalogoRepository) {
        this.citaListaEsperaRepository = citaListaEsperaRepository;
        this.notificationService = notificationService;
        this.pacienteRepository = pacienteRepository;
        this.especialistaRepository = especialistaRepository;
        this.salaRepository = salaRepository;
        this.catalogoRepository = catalogoRepository;
    }

    @Transactional
    public void onHuecoLiberado(Long especialistaId) {
        if (especialistaId == null) return;
        List<CitaListaEspera> pendientes =
                citaListaEsperaRepository.findByEstadoAndEspecialista_IdOrderByPrioridadAscCreatedAtAsc(
                        ESTADO_PENDIENTE, especialistaId);
        if (!pendientes.isEmpty()) {
            notificationService.notifyWaitListCandidate(pendientes.get(0));
        }
    }

    @Transactional
    public ListaEsperaDto encolar(EncolarListaRequest req) {
        if (req.pacienteId() == null) {
            throw new IllegalArgumentException("pacienteId es obligatorio.");
        }
        if (req.especialistaId() == null && req.salaId() == null) {
            throw new IllegalArgumentException("Debe indicar especialista o sala (o ambos).");
        }
        Paciente p = pacienteRepository
                .findById(req.pacienteId())
                .orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado"));
        CitaListaEspera row = new CitaListaEspera();
        row.setPaciente(p);
        row.setEstado(ESTADO_PENDIENTE);
        row.setPrioridad(req.prioridad() != null ? req.prioridad() : 0);
        row.setNotas(req.notas());
        if (req.especialistaId() != null) {
            Especialista e = especialistaRepository
                    .findById(req.especialistaId())
                    .orElseThrow(() -> new IllegalArgumentException("Especialista no encontrado"));
            row.setEspecialista(e);
        }
        if (req.salaId() != null) {
            Sala s = salaRepository.findById(req.salaId()).orElseThrow(() -> new IllegalArgumentException("Sala no encontrada"));
            row.setSala(s);
        }
        if (req.tipoCitaCatalogoId() != null) {
            Catalogo cat = catalogoRepository
                    .findById(req.tipoCitaCatalogoId())
                    .orElseThrow(() -> new IllegalArgumentException("Tipo de cita no encontrado"));
            row.setTipoCita(cat);
        }
        CitaListaEspera saved = citaListaEsperaRepository.save(row);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ListaEsperaDto> listarPendientesPorEspecialista(Long especialistaId) {
        return citaListaEsperaRepository
                .findByEstadoAndEspecialista_IdOrderByPrioridadAscCreatedAtAsc(ESTADO_PENDIENTE, especialistaId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private ListaEsperaDto toDto(CitaListaEspera x) {
        String pac = x.getPaciente().getNombres() + " " + x.getPaciente().getApellidos();
        String esp =
                x.getEspecialista() != null
                        ? x.getEspecialista().getStaff().getNombres()
                                + " "
                                + x.getEspecialista().getStaff().getApellidos()
                        : null;
        return new ListaEsperaDto(
                x.getId(),
                x.getPaciente().getId(),
                pac.trim(),
                x.getEspecialista() != null ? x.getEspecialista().getId() : null,
                esp,
                x.getPrioridad(),
                x.getEstado(),
                x.getNotas(),
                x.getCreatedAt());
    }

    public record EncolarListaRequest(
            Long pacienteId,
            Long especialistaId,
            Long salaId,
            Long tipoCitaCatalogoId,
            Integer prioridad,
            String notas) {}

    public record ListaEsperaDto(
            Long id,
            Long pacienteId,
            String pacienteNombre,
            Long especialistaId,
            String especialistaNombre,
            int prioridad,
            String estado,
            String notas,
            Instant createdAt) {}
}
