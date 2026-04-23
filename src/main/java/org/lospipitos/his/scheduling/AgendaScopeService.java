package org.lospipitos.his.scheduling;

import org.lospipitos.his.security.CurrentUserService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AgendaScopeService {

    private static final long NO_MATCH = -1L;

    private final CurrentUserService currentUserService;
    private final UsuarioEspecialistaRepository usuarioEspecialistaRepository;

    public AgendaScopeService(
            CurrentUserService currentUserService, UsuarioEspecialistaRepository usuarioEspecialistaRepository) {
        this.currentUserService = currentUserService;
        this.usuarioEspecialistaRepository = usuarioEspecialistaRepository;
    }

    /**
     * @return vacío = sin filtro (toda la agenda); presente = solo estos especialista_id
     */
    public Optional<Set<Long>> resolveAllowedEspecialistaIds() {
        if (currentUserService.hasFullAgendaAccess()) {
            return Optional.empty();
        }
        Optional<Long> uid = currentUserService.getCurrentUserId();
        if (uid.isEmpty()) {
            return Optional.of(Set.of(NO_MATCH));
        }
        List<UsuarioEspecialista> links = usuarioEspecialistaRepository.findByUserId(uid.get());
        if (links.isEmpty()) {
            return Optional.of(Set.of(NO_MATCH));
        }
        return Optional.of(
                links.stream().map(UsuarioEspecialista::getEspecialistaId).collect(Collectors.toSet()));
    }

    public boolean canAccessEspecialista(Long especialistaId) {
        Optional<Set<Long>> scope = resolveAllowedEspecialistaIds();
        return scope.isEmpty() || (especialistaId != null && scope.get().contains(especialistaId));
    }
}
