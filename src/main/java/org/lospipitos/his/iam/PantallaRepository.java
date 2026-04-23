package org.lospipitos.his.iam;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PantallaRepository extends JpaRepository<Pantalla, Long> {

    Optional<Pantalla> findByCodigo(String codigo);

    boolean existsByCodigo(String codigo);

    long countByParent_Id(Long parentId);

    @Query(
            "select distinct p from Pantalla p left join fetch p.parent "
                    + "order by p.parent.id asc nulls first, p.orden asc, p.nombre asc")
    List<Pantalla> findAllOrderedForAdmin();

    @Query(
            "select distinct p from Pantalla p left join fetch p.parent join p.roles r "
                    + "where p.activo = true and r.name in :roleNames "
                    + "order by p.parent.id asc nulls first, p.orden asc, p.nombre asc")
    List<Pantalla> findAccessibleByRoleNames(@Param("roleNames") Collection<String> roleNames);

    @Query("select p.id from Pantalla p join p.roles r where r.id = :roleId")
    List<Long> findPantallaIdsByRoleId(@Param("roleId") Long roleId);
}
