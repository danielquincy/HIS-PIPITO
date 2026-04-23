package org.lospipitos.his.patient;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PacienteRepository extends JpaRepository<Paciente, Long> {

    Optional<Paciente> findByNumeroExpediente(String numeroExpediente);

    @Query(
            "SELECT p FROM Paciente p WHERE "
                    + "LOWER(p.numeroExpediente) LIKE LOWER(CONCAT('%', :q, '%')) OR "
                    + "LOWER(p.nombres) LIKE LOWER(CONCAT('%', :q, '%')) OR "
                    + "LOWER(p.apellidos) LIKE LOWER(CONCAT('%', :q, '%')) OR "
                    + "LOWER(CONCAT(p.nombres, ' ', p.apellidos)) LIKE LOWER(CONCAT('%', :q, '%')) OR "
                    + "LOWER(COALESCE(p.telefono, '')) LIKE LOWER(CONCAT('%', :q, '%'))")
    Page<Paciente> searchByText(@Param("q") String q, Pageable pageable);
}
