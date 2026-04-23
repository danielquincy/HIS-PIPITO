package org.lospipitos.his.scheduling;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PacienteConsentimientoRepository extends JpaRepository<PacienteConsentimiento, Long> {

    List<PacienteConsentimiento> findByPacienteIdOrderByAceptadoTsDesc(Long pacienteId);
}
