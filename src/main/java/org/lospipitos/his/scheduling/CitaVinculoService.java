package org.lospipitos.his.scheduling;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CitaVinculoService {

    private final CitaRepository citaRepository;
    private final CitaVinculoRepository citaVinculoRepository;
    private final AgendaScopeService agendaScopeService;

    public CitaVinculoService(
            CitaRepository citaRepository,
            CitaVinculoRepository citaVinculoRepository,
            AgendaScopeService agendaScopeService) {
        this.citaRepository = citaRepository;
        this.citaVinculoRepository = citaVinculoRepository;
        this.agendaScopeService = agendaScopeService;
    }

    @Transactional(readOnly = true)
    public List<VinculoDto> listar(Long citaId) {
        Cita c = loadConPermiso(citaId);
        return citaVinculoRepository.findByCita_Id(c.getId()).stream()
                .map(v -> new VinculoDto(v.getId(), v.getTipoVinculo(), v.getRefId(), v.getDescripcion()))
                .toList();
    }

    @Transactional
    public VinculoDto agregar(Long citaId, AgregarVinculoRequest req) {
        Cita c = loadConPermiso(citaId);
        CitaVinculo v = new CitaVinculo();
        v.setCita(c);
        v.setTipoVinculo(req.tipoVinculo().trim().toUpperCase());
        v.setRefId(req.refId());
        v.setDescripcion(req.descripcion());
        if ("RECURSO".equals(v.getTipoVinculo())
                && !citaVinculoRepository
                        .findRecursosConSolape(v.getRefId(), c.getInicioTs(), c.getFinTs(), c.getId())
                        .isEmpty()) {
            throw new IllegalArgumentException("Este recurso ya está reservado en otra cita en el mismo horario");
        }
        CitaVinculo saved = citaVinculoRepository.save(v);
        return new VinculoDto(saved.getId(), saved.getTipoVinculo(), saved.getRefId(), saved.getDescripcion());
    }

    @Transactional
    public void eliminar(Long citaId, Long vinculoId) {
        loadConPermiso(citaId);
        CitaVinculo v = citaVinculoRepository.findById(vinculoId).orElseThrow(() -> new IllegalArgumentException("Vínculo no encontrado"));
        if (!v.getCita().getId().equals(citaId)) {
            throw new IllegalArgumentException("El vínculo no pertenece a esta cita.");
        }
        citaVinculoRepository.delete(v);
    }

    private Cita loadConPermiso(Long citaId) {
        Cita c = citaRepository.findById(citaId).orElseThrow(() -> new IllegalArgumentException("Cita no encontrada"));
        if (!agendaScopeService.canAccessEspecialista(c.getEspecialista().getId())) {
            throw new IllegalArgumentException("No tiene permiso para esta cita.");
        }
        return c;
    }

    public record VinculoDto(Long id, String tipoVinculo, Long refId, String descripcion) {}

    public record AgregarVinculoRequest(
            @NotBlank String tipoVinculo, @NotNull Long refId, String descripcion) {}
}
