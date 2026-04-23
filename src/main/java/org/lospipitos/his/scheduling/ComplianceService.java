package org.lospipitos.his.scheduling;

import org.lospipitos.his.iam.UserRepository;
import org.lospipitos.his.patient.Paciente;
import org.lospipitos.his.patient.PacienteRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ComplianceService {

    private final PacienteConsentimientoRepository pacienteConsentimientoRepository;
    private final AccesoDatosLogRepository accesoDatosLogRepository;
    private final PacienteRepository pacienteRepository;
    private final UserRepository userRepository;

    public ComplianceService(
            PacienteConsentimientoRepository pacienteConsentimientoRepository,
            AccesoDatosLogRepository accesoDatosLogRepository,
            PacienteRepository pacienteRepository,
            UserRepository userRepository) {
        this.pacienteConsentimientoRepository = pacienteConsentimientoRepository;
        this.accesoDatosLogRepository = accesoDatosLogRepository;
        this.pacienteRepository = pacienteRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ConsentimientoDto registrarConsentimiento(Long pacienteId, ConsentimientoRequest req, Optional<Long> userId) {
        Paciente p = pacienteRepository.findById(pacienteId).orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado"));
        PacienteConsentimiento row = new PacienteConsentimiento();
        row.setPaciente(p);
        row.setVersionEtiqueta(req.versionEtiqueta().trim());
        row.setTextoResumen(req.textoResumen());
        row.setCanal(req.canal());
        row.setAceptadoTs(req.aceptadoTs() != null ? req.aceptadoTs() : Instant.now());
        if (userId.isPresent()) {
            userRepository.findById(userId.get()).ifPresent(row::setCreatedBy);
        }
        PacienteConsentimiento saved = pacienteConsentimientoRepository.save(row);
        return toConsentDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ConsentimientoDto> listarConsentimientos(Long pacienteId) {
        if (!pacienteRepository.existsById(pacienteId)) {
            throw new IllegalArgumentException("Paciente no encontrado");
        }
        return pacienteConsentimientoRepository.findByPacienteIdOrderByAceptadoTsDesc(pacienteId).stream()
                .map(this::toConsentDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void registrarAcceso(AccesoRegistroRequest req, Optional<Long> userId, String ip) {
        AccesoDatosLog row = new AccesoDatosLog();
        row.setRecurso(req.recurso().trim());
        row.setAccion(req.accion().trim().toUpperCase());
        row.setIp(ip);
        if (req.pacienteId() != null) {
            pacienteRepository.findById(req.pacienteId()).ifPresent(row::setPaciente);
        }
        userId.flatMap(userRepository::findById).ifPresent(row::setUser);
        accesoDatosLogRepository.save(row);
    }

    @Transactional(readOnly = true)
    public Page<AccesoDatosLog> pageAccesos(Pageable pageable) {
        return accesoDatosLogRepository.findByOrderByCreadoTsDesc(pageable);
    }

    private ConsentimientoDto toConsentDto(PacienteConsentimiento c) {
        Long uid = c.getCreatedBy() != null ? c.getCreatedBy().getId() : null;
        return new ConsentimientoDto(
                c.getId(),
                c.getPaciente().getId(),
                c.getVersionEtiqueta(),
                c.getTextoResumen(),
                c.getCanal(),
                c.getAceptadoTs(),
                uid);
    }

    public record ConsentimientoRequest(String versionEtiqueta, String textoResumen, String canal, Instant aceptadoTs) {}

    public record ConsentimientoDto(
            Long id,
            Long pacienteId,
            String versionEtiqueta,
            String textoResumen,
            String canal,
            Instant aceptadoTs,
            Long createdByUserId) {}

    public record AccesoRegistroRequest(Long pacienteId, String recurso, String accion) {}
}
