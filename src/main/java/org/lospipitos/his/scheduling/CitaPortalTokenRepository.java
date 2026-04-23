package org.lospipitos.his.scheduling;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CitaPortalTokenRepository extends JpaRepository<CitaPortalToken, Long> {

    Optional<CitaPortalToken> findByTokenHash(String tokenHash);
}
