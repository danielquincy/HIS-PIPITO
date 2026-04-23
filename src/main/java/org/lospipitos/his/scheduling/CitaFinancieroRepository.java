package org.lospipitos.his.scheduling;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

public interface CitaFinancieroRepository extends JpaRepository<CitaFinanciero, Long> {

    Optional<CitaFinanciero> findByCitaId(Long citaId);

    @Query(
            """
            SELECT COALESCE(SUM(f.montoIngreso), 0) FROM CitaFinanciero f JOIN f.cita c
            WHERE c.inicioTs >= :desde AND c.inicioTs < :hasta
            """
    )
    BigDecimal sumIngresosEntre(Instant desde, Instant hasta);

    @Query(
            """
            SELECT COALESCE(SUM(f.montoCosto), 0) FROM CitaFinanciero f JOIN f.cita c
            WHERE c.inicioTs >= :desde AND c.inicioTs < :hasta
            """
    )
    BigDecimal sumCostosEntre(Instant desde, Instant hasta);
}
