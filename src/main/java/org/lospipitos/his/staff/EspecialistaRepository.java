package org.lospipitos.his.staff;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface EspecialistaRepository extends JpaRepository<Especialista, Long> {

    @Query("SELECT DISTINCT e FROM Especialista e JOIN FETCH e.staff LEFT JOIN FETCH e.especialidades WHERE e.activo = true")
    List<Especialista> findAllActivosWithStaff();

    @Query("SELECT DISTINCT e FROM Especialista e JOIN FETCH e.staff s LEFT JOIN FETCH e.especialidades")
    List<Especialista> findAllWithStaffAndEspecialidades();

    @Query("SELECT e FROM Especialista e JOIN FETCH e.staff LEFT JOIN FETCH e.especialidades WHERE e.id = :id")
    java.util.Optional<Especialista> findByIdWithStaffAndEspecialidades(@org.springframework.data.repository.query.Param("id") Long id);
}
