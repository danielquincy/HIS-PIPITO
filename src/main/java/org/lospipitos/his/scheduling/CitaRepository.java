package org.lospipitos.his.scheduling;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Set;

public interface CitaRepository extends JpaRepository<Cita, Long> {

    @Query(
            """
            SELECT c FROM Cita c WHERE c.especialista.id = :eid
            AND c.inicioTs < :fin AND c.finTs > :inicio
            AND c.estado <> 'CANCELADA'
            """
    )
    List<Cita> findSolapes(
            @Param("eid") Long especialistaId,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin);

    @Query(
            """
            SELECT c FROM Cita c WHERE c.sala IS NOT NULL AND c.sala.id = :sid
            AND c.inicioTs < :fin AND c.finTs > :inicio
            AND c.estado <> 'CANCELADA'
            """
    )
    List<Cita> findSolapesSala(
            @Param("sid") Long salaId, @Param("inicio") Instant inicio, @Param("fin") Instant fin);

    @Query(
            """
            SELECT c FROM Cita c WHERE c.paciente.id = :pid
            AND c.inicioTs < :fin AND c.finTs > :inicio
            AND c.estado <> 'CANCELADA'
            """
    )
    List<Cita> findSolapesPaciente(
            @Param("pid") Long pacienteId, @Param("inicio") Instant inicio, @Param("fin") Instant fin);

    @Query(
            "SELECT COUNT(c) FROM Cita c WHERE c.especialista.id = :eid AND c.inicioTs >= :d0 AND c.inicioTs < :d1 AND c.estado <> 'CANCELADA'"
    )
    long countActivasEspecialistaEnVentana(
            @Param("eid") Long especialistaId, @Param("d0") Instant d0, @Param("d1") Instant d1);

    @Query(
            "SELECT COUNT(c) FROM Cita c WHERE c.sala IS NOT NULL AND c.sala.id = :sid AND c.inicioTs >= :d0 AND c.inicioTs < :d1 AND c.estado <> 'CANCELADA'"
    )
    long countActivasSalaEnVentana(@Param("sid") Long salaId, @Param("d0") Instant d0, @Param("d1") Instant d1);

    @Query("SELECT COUNT(c) FROM Cita c WHERE c.inicioTs >= :desde AND c.inicioTs < :hasta")
    long countEntre(@Param("desde") Instant desde, @Param("hasta") Instant hasta);

    @Query(
            "SELECT COUNT(c) FROM Cita c WHERE c.estado = :estado AND c.inicioTs >= :desde AND c.inicioTs < :hasta")
    long countByEstadoEntre(
            @Param("estado") String estado, @Param("desde") Instant desde, @Param("hasta") Instant hasta);

    @Query(
            """
            SELECT DISTINCT c FROM Cita c
            JOIN FETCH c.paciente pac
            JOIN FETCH c.especialista esp
            JOIN FETCH esp.staff st
            LEFT JOIN FETCH c.tipoCita
            LEFT JOIN FETCH c.sala
            WHERE c.paciente.id = :pid
            AND c.inicioTs >= :desde AND c.inicioTs < :hasta
            ORDER BY c.inicioTs
            """
    )
    List<Cita> findByPacienteYPeriodo(
            @Param("pid") Long pacienteId, @Param("desde") Instant desde, @Param("hasta") Instant hasta);

    @Query(
            """
            SELECT DISTINCT c FROM Cita c
            JOIN FETCH c.paciente pac
            JOIN FETCH c.especialista esp
            JOIN FETCH esp.staff st
            LEFT JOIN FETCH c.tipoCita
            LEFT JOIN FETCH c.sala
            WHERE c.especialista.id = :eid
            AND c.inicioTs >= :desde AND c.inicioTs < :hasta
            ORDER BY c.inicioTs
            """
    )
    List<Cita> findByEspecialistaYPeriodo(
            @Param("eid") Long especialistaId, @Param("desde") Instant desde, @Param("hasta") Instant hasta);

    @Query(
            """
            SELECT DISTINCT c FROM Cita c
            JOIN FETCH c.paciente pac
            JOIN FETCH c.especialista esp
            JOIN FETCH esp.staff st
            LEFT JOIN FETCH c.tipoCita
            LEFT JOIN FETCH c.sala
            JOIN esp.especialidades filtroEspecialidad
            WHERE filtroEspecialidad.id = :especialidadCatalogoId
            AND c.inicioTs >= :desde AND c.inicioTs < :hasta
            ORDER BY c.inicioTs
            """
    )
    List<Cita> findByEspecialidadYPeriodo(
            @Param("especialidadCatalogoId") Long especialidadCatalogoId,
            @Param("desde") Instant desde,
            @Param("hasta") Instant hasta);

    @Query(
            """
            SELECT c FROM Cita c
            JOIN FETCH c.paciente pac
            JOIN FETCH c.especialista esp
            JOIN FETCH esp.staff st
            LEFT JOIN FETCH c.tipoCita
            LEFT JOIN FETCH c.sala
            WHERE c.inicioTs >= :desde AND c.inicioTs < :hasta
            ORDER BY c.inicioTs DESC, c.estado ASC
            """
    )
    List<Cita> findByPeriodo(@Param("desde") Instant desde, @Param("hasta") Instant hasta);

    @Query(
            """
            SELECT c FROM Cita c
            JOIN FETCH c.paciente pac
            JOIN FETCH c.especialista esp
            JOIN FETCH esp.staff st
            LEFT JOIN FETCH c.tipoCita
            LEFT JOIN FETCH c.sala
            WHERE c.inicioTs >= :desde AND c.inicioTs < :hasta
            AND c.especialista.id IN :eids
            ORDER BY c.inicioTs DESC, c.estado ASC
            """
    )
    List<Cita> findByPeriodoEspecialistaIn(
            @Param("desde") Instant desde, @Param("hasta") Instant hasta, @Param("eids") Set<Long> eids);

    @Query(
            countQuery =
                    """
                    SELECT count(c) FROM Cita c
                    WHERE c.inicioTs >= :desde AND c.inicioTs < :hasta
                    """,
            value =
                    """
                    SELECT c FROM Cita c
                    WHERE c.inicioTs >= :desde AND c.inicioTs < :hasta
                    ORDER BY c.inicioTs DESC
                    """)
    Page<Cita> findPagedByPeriodo(@Param("desde") Instant desde, @Param("hasta") Instant hasta, Pageable pageable);

    @Query(
            value =
                    """
                    SELECT c FROM Cita c
                    JOIN c.paciente pac
                    JOIN c.especialista esp
                    JOIN esp.staff st
                    LEFT JOIN c.tipoCita tc
                    LEFT JOIN c.sala sal
                    WHERE c.inicioTs >= :desde AND c.inicioTs < :hasta
                    AND (
                        :qPattern IS NULL
                        OR LOWER(CONCAT(COALESCE(pac.nombres, ''), ' ', COALESCE(pac.apellidos, ''))) LIKE :qPattern
                        OR LOWER(COALESCE(pac.numeroExpediente, '')) LIKE :qPattern
                        OR LOWER(CONCAT(COALESCE(st.nombres, ''), ' ', COALESCE(st.apellidos, ''))) LIKE :qPattern
                        OR LOWER(COALESCE(c.estado, '')) LIKE :qPattern
                        OR LOWER(COALESCE(tc.nombre, '')) LIKE :qPattern
                        OR LOWER(COALESCE(tc.codigo, '')) LIKE :qPattern
                        OR LOWER(COALESCE(sal.nombre, '')) LIKE :qPattern
                    )
                    """,
            countQuery =
                    """
                    SELECT count(c) FROM Cita c
                    JOIN c.paciente pac
                    JOIN c.especialista esp
                    JOIN esp.staff st
                    LEFT JOIN c.tipoCita tc
                    LEFT JOIN c.sala sal
                    WHERE c.inicioTs >= :desde AND c.inicioTs < :hasta
                    AND (
                        :qPattern IS NULL
                        OR LOWER(CONCAT(COALESCE(pac.nombres, ''), ' ', COALESCE(pac.apellidos, ''))) LIKE :qPattern
                        OR LOWER(COALESCE(pac.numeroExpediente, '')) LIKE :qPattern
                        OR LOWER(CONCAT(COALESCE(st.nombres, ''), ' ', COALESCE(st.apellidos, ''))) LIKE :qPattern
                        OR LOWER(COALESCE(c.estado, '')) LIKE :qPattern
                        OR LOWER(COALESCE(tc.nombre, '')) LIKE :qPattern
                        OR LOWER(COALESCE(tc.codigo, '')) LIKE :qPattern
                        OR LOWER(COALESCE(sal.nombre, '')) LIKE :qPattern
                    )
                    """)
    Page<Cita> findPagedCitasListUnscoped(
            @Param("desde") Instant desde,
            @Param("hasta") Instant hasta,
            @Param("qPattern") String qPattern,
            Pageable pageable);

    @Query(
            value =
                    """
                    SELECT c FROM Cita c
                    JOIN c.paciente pac
                    JOIN c.especialista esp
                    JOIN esp.staff st
                    LEFT JOIN c.tipoCita tc
                    LEFT JOIN c.sala sal
                    WHERE c.inicioTs >= :desde AND c.inicioTs < :hasta
                    AND c.especialista.id IN :eids
                    AND (
                        :qPattern IS NULL
                        OR LOWER(CONCAT(COALESCE(pac.nombres, ''), ' ', COALESCE(pac.apellidos, ''))) LIKE :qPattern
                        OR LOWER(COALESCE(pac.numeroExpediente, '')) LIKE :qPattern
                        OR LOWER(CONCAT(COALESCE(st.nombres, ''), ' ', COALESCE(st.apellidos, ''))) LIKE :qPattern
                        OR LOWER(COALESCE(c.estado, '')) LIKE :qPattern
                        OR LOWER(COALESCE(tc.nombre, '')) LIKE :qPattern
                        OR LOWER(COALESCE(tc.codigo, '')) LIKE :qPattern
                        OR LOWER(COALESCE(sal.nombre, '')) LIKE :qPattern
                    )
                    """,
            countQuery =
                    """
                    SELECT count(c) FROM Cita c
                    JOIN c.paciente pac
                    JOIN c.especialista esp
                    JOIN esp.staff st
                    LEFT JOIN c.tipoCita tc
                    LEFT JOIN c.sala sal
                    WHERE c.inicioTs >= :desde AND c.inicioTs < :hasta
                    AND c.especialista.id IN :eids
                    AND (
                        :qPattern IS NULL
                        OR LOWER(CONCAT(COALESCE(pac.nombres, ''), ' ', COALESCE(pac.apellidos, ''))) LIKE :qPattern
                        OR LOWER(COALESCE(pac.numeroExpediente, '')) LIKE :qPattern
                        OR LOWER(CONCAT(COALESCE(st.nombres, ''), ' ', COALESCE(st.apellidos, ''))) LIKE :qPattern
                        OR LOWER(COALESCE(c.estado, '')) LIKE :qPattern
                        OR LOWER(COALESCE(tc.nombre, '')) LIKE :qPattern
                        OR LOWER(COALESCE(tc.codigo, '')) LIKE :qPattern
                        OR LOWER(COALESCE(sal.nombre, '')) LIKE :qPattern
                    )
                    """)
    Page<Cita> findPagedCitasListScoped(
            @Param("desde") Instant desde,
            @Param("hasta") Instant hasta,
            @Param("eids") Set<Long> eids,
            @Param("qPattern") String qPattern,
            Pageable pageable);

    @Query(
            """
            SELECT DISTINCT c FROM Cita c
            JOIN FETCH c.paciente pac
            JOIN FETCH c.especialista esp
            JOIN FETCH esp.staff st
            LEFT JOIN FETCH c.tipoCita
            LEFT JOIN FETCH c.sala
            WHERE c.sala IS NOT NULL AND c.sala.id = :salaId
            AND c.inicioTs >= :desde AND c.inicioTs < :hasta
            ORDER BY c.inicioTs
            """)
    List<Cita> findBySalaIdYPeriodo(
            @Param("salaId") Long salaId, @Param("desde") Instant desde, @Param("hasta") Instant hasta);

    @Query(
            """
            SELECT DISTINCT c FROM Cita c
            JOIN FETCH c.paciente pac
            JOIN FETCH c.especialista esp
            JOIN FETCH esp.staff st
            LEFT JOIN FETCH c.tipoCita
            LEFT JOIN FETCH c.sala
            WHERE c.inicioTs >= :desde AND c.inicioTs < :hasta
            AND EXISTS (SELECT 1 FROM CitaVinculo v
            WHERE v.cita = c AND UPPER(TRIM(v.tipoVinculo)) = 'RECURSO' AND v.refId = :refId)
            ORDER BY c.inicioTs
            """)
    List<Cita> findByRecursoRefIdYPeriodo(
            @Param("refId") Long refId, @Param("desde") Instant desde, @Param("hasta") Instant hasta);

    @Query(
            """
            SELECT new org.lospipitos.his.scheduling.CitaDashboardRow(
                c.inicioTs, c.estado,
                CONCAT(COALESCE(pac.nombres, ''), ' ', COALESCE(pac.apellidos, '')),
                CONCAT(COALESCE(st.nombres, ''), ' ', COALESCE(st.apellidos, ''))
            )
            FROM Cita c
            JOIN c.paciente pac
            JOIN c.especialista esp
            JOIN esp.staff st
            WHERE c.inicioTs >= :desde AND c.inicioTs < :hasta
            ORDER BY c.inicioTs
            """)
    List<CitaDashboardRow> findDashboardRowsUnscoped(
            @Param("desde") Instant desde, @Param("hasta") Instant hasta);

    @Query(
            """
            SELECT new org.lospipitos.his.scheduling.CitaDashboardRow(
                c.inicioTs, c.estado,
                CONCAT(COALESCE(pac.nombres, ''), ' ', COALESCE(pac.apellidos, '')),
                CONCAT(COALESCE(st.nombres, ''), ' ', COALESCE(st.apellidos, ''))
            )
            FROM Cita c
            JOIN c.paciente pac
            JOIN c.especialista esp
            JOIN esp.staff st
            WHERE c.inicioTs >= :desde AND c.inicioTs < :hasta
            AND c.especialista.id IN :eids
            ORDER BY c.inicioTs
            """)
    List<CitaDashboardRow> findDashboardRowsScoped(
            @Param("desde") Instant desde, @Param("hasta") Instant hasta, @Param("eids") Set<Long> eids);
}
