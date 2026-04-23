package org.lospipitos.his.patient;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentoPacienteRepository extends JpaRepository<DocumentoPaciente, Long> {

    List<DocumentoPaciente> findByPacienteIdOrderByCreatedAtDesc(Long pacienteId);
}
