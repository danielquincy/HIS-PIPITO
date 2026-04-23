package org.lospipitos.his.scheduling;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Set;

public interface CitaVinculoRepository extends JpaRepository<CitaVinculo, Long> {

    List<CitaVinculo> findByCita_Id(Long citaId);

    long countByCita_Id(Long citaId);

    @Query(
            """
            SELECT v FROM CitaVinculo v JOIN v.cita c
            WHERE UPPER(TRIM(v.tipoVinculo)) = 'RECURSO' AND v.refId = :refId
            AND c.inicioTs < :fin AND c.finTs > :inicio
            AND c.estado <> 'CANCELADA' AND c.id <> :excludeCitaId
            """)
    List<CitaVinculo> findRecursosConSolape(
            @Param("refId") Long refId,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin,
            @Param("excludeCitaId") Long excludeCitaId);

    @Query(
            """
            SELECT v FROM CitaVinculo v
            WHERE v.cita.id IN :citaIds AND UPPER(TRIM(v.tipoVinculo)) = 'RECURSO'
            """)
    List<CitaVinculo> findRecursosByCitaIdIn(@Param("citaIds") Collection<Long> citaIds);

    @Query(
            "SELECT v.cita.id, COUNT(v) FROM CitaVinculo v WHERE v.cita.id IN :citaIds GROUP BY v.cita.id")
    List<Object[]> countByCitaIdGrouped(@Param("citaIds") Collection<Long> citaIds);

    @Query(
            """
            SELECT v FROM CitaVinculo v JOIN v.cita c
            WHERE UPPER(TRIM(v.tipoVinculo)) = 'RECURSO'
            AND c.inicioTs >= :desde AND c.inicioTs < :hasta
            """)
    List<CitaVinculo> findRecursoVinculosEnRango(
            @Param("desde") Instant desde, @Param("hasta") Instant hasta);

    @Query(
            """
            SELECT v FROM CitaVinculo v JOIN v.cita c
            WHERE UPPER(TRIM(v.tipoVinculo)) = 'RECURSO'
            AND c.inicioTs >= :desde AND c.inicioTs < :hasta
            AND c.especialista.id IN :eids
            """)
    List<CitaVinculo> findRecursoVinculosEnRangoEspecialistaIn(
            @Param("desde") Instant desde,
            @Param("hasta") Instant hasta,
            @Param("eids") Set<Long> eids);
}
