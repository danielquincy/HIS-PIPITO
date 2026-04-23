package org.lospipitos.his.catalog;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CatalogoRepository extends JpaRepository<Catalogo, Long> {

    @Query("SELECT c FROM Catalogo c JOIN c.tipoCatalogo t WHERE t.codigo = :tipoCodigo AND c.activo = true ORDER BY c.orden")
    List<Catalogo> findByTipoCodigo(@Param("tipoCodigo") String tipoCodigo);

    @Query("SELECT c FROM Catalogo c JOIN c.tipoCatalogo t WHERE t.codigo = :tipoCodigo ORDER BY c.activo DESC, c.orden, c.nombre")
    List<Catalogo> findAllByTipoCodigo(@Param("tipoCodigo") String tipoCodigo);

    @Query("SELECT c FROM Catalogo c JOIN c.tipoCatalogo t WHERE t.codigo = :tipoCodigo AND c.parentCatalogo IS NULL AND c.activo = true ORDER BY c.orden, c.nombre")
    List<Catalogo> findByTipoCodigoRoot(@Param("tipoCodigo") String tipoCodigo);

    @Query("SELECT c FROM Catalogo c JOIN c.tipoCatalogo t WHERE t.codigo = :tipoCodigo AND c.parentCatalogo.id = :parentId AND c.activo = true ORDER BY c.orden, c.nombre")
    List<Catalogo> findByTipoCodigoAndParentId(@Param("tipoCodigo") String tipoCodigo, @Param("parentId") Long parentId);

    @Query("SELECT c FROM Catalogo c JOIN c.tipoCatalogo t WHERE t.codigo = :tipoCodigo AND UPPER(c.codigo) = UPPER(:codigo)")
    Optional<Catalogo> findByTipoCodigoAndCodigoIgnoreCase(@Param("tipoCodigo") String tipoCodigo, @Param("codigo") String codigo);

    @Query("SELECT c FROM Catalogo c JOIN FETCH c.tipoCatalogo WHERE c.id = :id")
    Optional<Catalogo> findByIdWithTipoCatalogo(@Param("id") Long id);

    @Query("SELECT c FROM Catalogo c JOIN FETCH c.tipoCatalogo LEFT JOIN FETCH c.parentCatalogo WHERE c.id = :id")
    Optional<Catalogo> findByIdWithTipoAndParent(@Param("id") Long id);

    List<Catalogo> findByTipoCatalogoIdAndActivoTrueOrderByOrden(Long tipoCatalogoId);
}
