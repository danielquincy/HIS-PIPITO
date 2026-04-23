package org.lospipitos.his.scheduling;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UsuarioEspecialistaRepository extends JpaRepository<UsuarioEspecialista, UsuarioEspecialista.UsuarioEspecialistaId> {

    List<UsuarioEspecialista> findByUserId(Long userId);
}
