package org.lospipitos.his.scheduling;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TipoCitaReglaRepository extends JpaRepository<TipoCitaRegla, Long> {

    Optional<TipoCitaRegla> findByCatalogoId(Long catalogoId);
}
