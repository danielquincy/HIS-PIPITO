package org.lospipitos.his.scheduling;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReglaAgendaRecursoRepository extends JpaRepository<ReglaAgendaRecurso, Long> {

    List<ReglaAgendaRecurso> findByRecursoTipoAndRecursoIdAndActivoTrue(String recursoTipo, Long recursoId);
}
