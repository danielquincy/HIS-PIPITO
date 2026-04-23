package org.lospipitos.his.catalog;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TipoCatalogoRepository extends JpaRepository<TipoCatalogo, Long> {

    Optional<TipoCatalogo> findByCodigo(String codigo);
}
