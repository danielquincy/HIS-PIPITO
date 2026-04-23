package org.lospipitos.his.scheduling;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccesoDatosLogRepository extends JpaRepository<AccesoDatosLog, Long> {

    Page<AccesoDatosLog> findByOrderByCreadoTsDesc(Pageable pageable);
}
