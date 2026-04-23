package org.lospipitos.his.security;

import org.lospipitos.his.iam.AppUser;
import org.lospipitos.his.iam.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CurrentUserService {

    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Optional<Long> getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof Jwt jwt) {
            String sub = jwt.getClaimAsString("sub");
            if (sub == null || sub.isBlank()) {
                sub = jwt.getSubject();
            }
            final String username = sub;
            return userRepository.findByUsername(username).map(AppUser::getId);
        }
        return Optional.empty();
    }

    public List<String> getRoles() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return List.of();
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof Jwt jwt) {
            List<String> r = jwt.getClaimAsStringList("roles");
            if (r != null && !r.isEmpty()) {
                return r;
            }
        }
        return authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList();
    }

    public boolean hasFullAgendaAccess() {
        List<String> roles = getRoles();
        return roles.stream().anyMatch(x -> "ROLE_ADMIN".equals(x) || "ROLE_COORDINADOR".equals(x));
    }
}
