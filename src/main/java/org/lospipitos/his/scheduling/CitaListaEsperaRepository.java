package org.lospipitos.his.scheduling;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CitaListaEsperaRepository extends JpaRepository<CitaListaEspera, Long> {

    List<CitaListaEspera> findByEstadoAndEspecialista_IdOrderByPrioridadAscCreatedAtAsc(String estado, Long especialistaId);
}
