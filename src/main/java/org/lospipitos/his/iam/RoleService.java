package org.lospipitos.his.iam;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RoleService {

    private final RoleRepository roleRepository;
    private final PantallaRepository pantallaRepository;

    public RoleService(RoleRepository roleRepository, PantallaRepository pantallaRepository) {
        this.roleRepository = roleRepository;
        this.pantallaRepository = pantallaRepository;
    }

    @Transactional(readOnly = true)
    public List<RoleDto> listOrdered() {
        return roleRepository.findAll().stream()
                .sorted((a, b) -> a.getCodigo().compareToIgnoreCase(b.getCodigo()))
                .map(RoleDto::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RoleDetailDto get(Long id) {
        Role r = roleRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Rol no encontrado"));
        Set<Long> pantallaIds = new HashSet<>(pantallaRepository.findPantallaIdsByRoleId(id));
        return RoleDetailDto.from(r, pantallaIds);
    }

    @Transactional
    public RoleDto create(String codigo, String nombre, boolean activo) {
        String c = codigo.trim().toUpperCase(Locale.ROOT);
        if (c.isBlank()) {
            throw new IllegalArgumentException("El código es obligatorio.");
        }
        if (!c.matches("[A-Z0-9_]+")) {
            throw new IllegalArgumentException("El código solo puede contener letras, números y guión bajo.");
        }
        if (roleRepository.existsByCodigo(c)) {
            throw new IllegalArgumentException("Ya existe un rol con ese código.");
        }
        String technical = "ROLE_" + c;
        if (roleRepository.findByName(technical).isPresent()) {
            throw new IllegalArgumentException("Ya existe un rol con ese nombre técnico.");
        }
        String n = normalizeNombre(nombre);
        if (n.isBlank()) {
            throw new IllegalArgumentException("El nombre es obligatorio.");
        }
        Role r = new Role();
        r.setCodigo(c);
        r.setNombre(n);
        r.setName(technical);
        r.setActivo(activo);
        return RoleDto.from(roleRepository.save(r));
    }

    @Transactional
    public RoleDto update(Long id, String nombre, boolean activo) {
        Role r = roleRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Rol no encontrado"));
        String n = normalizeNombre(nombre);
        if (n.isBlank()) {
            throw new IllegalArgumentException("El nombre es obligatorio.");
        }
        r.setNombre(n);
        r.setActivo(activo);
        return RoleDto.from(roleRepository.save(r));
    }

    @Transactional
    public RoleDetailDto setPantallas(Long roleId, Set<Long> pantallaIds) {
        Role role = roleRepository.findById(roleId).orElseThrow(() -> new IllegalArgumentException("Rol no encontrado"));
        Set<Long> want = pantallaIds != null ? new HashSet<>(pantallaIds) : Set.of();
        List<Pantalla> todas = pantallaRepository.findAllOrderedForAdmin();
        for (Pantalla p : todas) {
            if (want.contains(p.getId())) {
                p.getRoles().add(role);
            } else {
                p.getRoles().removeIf(x -> x.getId().equals(roleId));
            }
        }
        pantallaRepository.saveAll(todas);
        return get(roleId);
    }

    private static String normalizeNombre(String nombre) {
        if (nombre == null) {
            return "";
        }
        return nombre.trim().replaceAll("\\s+", " ");
    }

    public record RoleDto(Long id, String codigo, String nombre, String name, boolean activo) {
        static RoleDto from(Role r) {
            return new RoleDto(r.getId(), r.getCodigo(), r.getNombre(), r.getName(), r.isActivo());
        }
    }

    public record RoleDetailDto(Long id, String codigo, String nombre, String name, boolean activo, Set<Long> pantallaIds) {
        static RoleDetailDto from(Role r, Set<Long> pantallaIds) {
            return new RoleDetailDto(
                    r.getId(), r.getCodigo(), r.getNombre(), r.getName(), r.isActivo(), pantallaIds);
        }
    }
}
